import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import { getGoogleSheets } from "../../../lib/google-sheets";
import { reminderTemplate } from "./templates.js";
import { parseDateString, getDaysUntilEvent } from "../../../utils/dateParser";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sender = "event-sync@bmogul.net";
const compiledReminderTemplate = Handlebars.compile(reminderTemplate);

// Helper function to check if a date is within the reminder window
const isWithinReminderWindow = (eventDateString, daysBeforeEvent = 10) => {
  const daysUntil = getDaysUntilEvent(eventDateString);
  return daysUntil <= daysBeforeEvent && daysUntil >= 0;
};

// Helper function to process and filter guest list
const processGuestList = (rows) => {
  const headerRow = rows[0];
  return rows
    .slice(1)
    .map((row) => {
      const guest = {};
      headerRow.forEach((header, index) => {
        guest[header] = row[index];
      });
      return guest;
    })
    .filter(
      (guest) =>
        guest.MainResponse === "1" && // Has RSVP'd yes
        guest.Email && // Has email address
        guest.Sent !== "Completed", // Hasn't received all reminders
    );
};

export const POST = async (req) => {
  console.log("Posting email reminders")
  try {
    const { event } = await req.json();
    const sheets = await getGoogleSheets();

    // Get all guests from sheet
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: event.sheetID,
      range: "Main",
    });

    if (!mainSheet.data.values) {
      console.log("No data")
      throw new Error("No data found in sheet");
    }

    // Only process if event is within reminder window
    if (!isWithinReminderWindow(event.eventDate)) {
      console.log("Not within window", event)
      return NextResponse.json({
        message: "No reminders needed today",
        reminders: 0,
      });
    }

    const guests = processGuestList(mainSheet.data.values);
    let remindersSent = 0;

    console.log(guests)

    for (const guest of guests) {
      try {
        const rsvpLink = `${process.env.HOST}/${event.eventID}/rsvp?guid=${guest.GUID}`;

        // Calculate days until event
        const daysUntil = getDaysUntilEvent(event.eventDate);
        const eventDate = parseDateString(event.eventDate);

        const templateData = {
          name: guest.Name,
          rsvpLink,
          eventName: event.eventTitle,
          eventDate: eventDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          }),
          daysUntil,
          clientMessage: event.email_message,
          logoLink: event.logo,
        };

        const msg = {
          to: guest.Email,
          from: {
            email: sender,
            name: "Shk Khuzema and Zahra bhen Kanchwala",
          },
          subject: `Reminder: ${event.eventTitle} in ${daysUntil} days`,
          html: compiledReminderTemplate(templateData),
        };

        await sgMail.send(msg);
        remindersSent++;

        // Update sheet to mark reminder as sent
        const rowIndex = mainSheet.data.values.findIndex(
          (row) => row[0] === guest.GUID && row[1] === guest.UID,
        );

        if (rowIndex !== -1) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: event.sheetID,
            range: `Main!J${rowIndex + 1}:J${rowIndex + 1}`,
            valueInputOption: "RAW",
            resource: {
              values: [[daysUntil === 1 ? "Completed" : "Yes"]],
            },
          });
        }
      } catch (error) {
        console.error(`Failed to send reminder to ${guest.Email}:`, error);
      }
    }

    return NextResponse.json({
      message: `Sent ${remindersSent} reminders`,
      reminders: remindersSent,
    });
  } catch (error) {
    console.error("Error in reminder system:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
};
