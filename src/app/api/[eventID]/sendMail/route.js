import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";

import { authEvent } from "../../../lib/helpers";
import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";
import { reminderTemplate, inviteTemplate } from "./templates.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sender = "event-sync@bmogul.net";
// Compile templates
const compiledReminderTemplate = Handlebars.compile(reminderTemplate);
const compiledInviteTemplate = Handlebars.compile(inviteTemplate);

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
    if (await authEvent(sheets, sheetID, password)) {
      const updatedGuestList = await Promise.all(
        guestList.map(async (guest) => {
          if (guest.Email) {
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
              from: sender,
              subject: reminder
                ? "Invitation inside"
                : "Important reminder inside",
              html: reminder
                ? compiledReminderTemplate(templateData)
                : compiledInviteTemplate(templateData),
            };
            await sgMail.send(msg);
            console.log(
              "Email sent to: ",
              guest.Email,
              "\nReminder: ",
              reminder,
            );
            return { ...guest, Sent: "Yes" };
          }
          return guest;
        }),
      );

      console.log(updatedGuestList);
      return NextResponse.json(
        { validated: true, guestList: updatedGuestList },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ validated: false }, { status: 200 });
    }
  } catch (error) {
    console.error("Error processing guest list:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
