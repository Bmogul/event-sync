import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";

import { authEvent } from "../../../lib/helpers";
import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";
import { reminderTemplate } from "./templates.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sender = "sender@event-sync.com";
// Compile templates
const compiledReminderTemplate = Handlebars.compile(reminderTemplate);
export const POST = async (req) => {
  const { password, event, guestList } = await req.json();
  const eventLogo = event.logo;
  const sheetID = event.sheetID;
  const sheets = await getGoogleSheets();

  if (!password || !event || !guestList || guestList.length === 0) {
    console.log("INVALID DATA FORMAT");
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  try {
    if (!(await authEvent(sheets, sheetID, password))) {
      return NextResponse.json({ validated: false }, { status: 200 });
    }

    // Get existing data from sheet once at the start
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Main",
    });
    const allValues = mainSheet.data.values || [];

    // Function to update a single row in the sheet
    const updateSheetRow = async (guest, rowNumber) => {
      const cellRange = `Main!J${rowNumber}:K${rowNumber}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetID,
        range: cellRange,
        valueInputOption: "RAW",
        resource: {
          values: [[guest.Sent]],
        },
      });
    };

    // Function to find row number for a guest
    const findRowNumber = (guest, allValues) => {
      const rowIndex = allValues.findIndex(
        (row) =>
          row[0]?.toString() === guest.GUID?.toString() &&
          row[1]?.toString() === guest.UID?.toString(),
      );
      return rowIndex !== -1 ? rowIndex + 1 : null;
    };

    const updatedGuestList = [];

    // Process each guest sequentially
    for (const guest of guestList) {
      try {
        if (!guest.Email) {
          updatedGuestList.push(guest);
          continue;
        }

        const reminder = guest.Sent === "Yes";
        const rsvpLink = `${process.env.HOST}/${event.eventID}/rsvp?guid=${guest.GUID}`;
        const templateData = {
          rsvpLink: rsvpLink || "google.com",
          clientMessage: event.email_message,
          eventName: event.eventTitle,
          logoLink: eventLogo,
        };

        const msg = {
          to: guest.Email,
          from: {
            email: sender,
            name: "Huzefa and Fatema Mogul",
          },
          subject: "Important Reminder Inside",
          html: compiledReminderTemplate(templateData),
        };

        // Send email
        await sgMail.send(msg);
        console.log("Email sent to: ", guest.Email, "\nReminder: ", reminder);

        // Update guest status
        const updatedGuest = { ...guest, Sent: "Yes" };
        updatedGuestList.push(updatedGuest);

        // Find and update the corresponding row in the sheet
        const rowNumber = findRowNumber(guest, allValues);
        if (rowNumber) {
          await updateSheetRow(updatedGuest, rowNumber);
          console.log(`Sheet updated for guest: ${guest.Email}`);
        } else {
          console.warn(`Could not find row for guest: ${guest.Email}`);
        }
      } catch (error) {
        console.log("erorr")
        console.error(`Error processings guest ${guest.Email}:`, error,"\nss\n");
        // Add the guest to the list without updating their status
        updatedGuestList.push(guest);
      }
    }

    return NextResponse.json(
      { validated: true, guestList: updatedGuestList },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error processing guest list:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};

