import sgMail from "@sendgrid/mail";
import { NextResponse } from "next/server";
import { getGoogleSheets, getAuthClient } from "../../../../lib/google-sheets";
import { reminderTemplate, inviteTemplate } from "./templates.js";
import bcrypt from "bcrypt";
import Handlebars from "handlebars";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sender = "event-sync@bmogul.net";
const email = {
  reminder: {
    text: "This is a reminder",
    html: "<h1>This is a Reminder</h1>",
  },
  invite: {
    text: "This is an invite",
    html: "<h1>This is an Invite</h1>",
  },
};

// Compile templates
const compiledReminderTemplate = Handlebars.compile(reminderTemplate);
const compiledInviteTemplate = Handlebars.compile(inviteTemplate);

export async function POST(req) {
  const body = await req.json();
  if (body.password) {
    // Check Password with sheet
    const sheetID = process.env.GOOGLE_SHEET_ID;
    const sheets = await getGoogleSheets();
    try {
      const webdata = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: "WebsiteData",
      });
      const password = webdata.data.values[0][1];
      if (password === body.password) {
        // check if sending email
        if (body.guestList) {
          const eventLogo = body.event.logo;
          const guestList = body.guestList;

          await guestList.forEach(async (guest, index) => {
            if (guest.Email) {
              let reminder = guest.Sent === "Yes" ? true : false;
              const rsvpLink = `${process.env.HOST}/events/${body.event.eventID}?guid=${guest.GUID}`;

              const templateData = {
                rsvpLink: rsvpLink ? rsvpLink : "google.com",
                clientMessage: body.event.email_message,
                eventName: body.event.eventTitle,
                logoLink: eventLogo,
              };
              const msg = {
                to: guest.Email,
                from: sender,
                subject: reminder
                  ? "Invitation inside"
                  : "Important reminder inside",
                text: reminder ? email.reminder.text : email.invite.text,
                html: reminder
                  ? compiledReminderTemplate(templateData)
                  : compiledInviteTemplate(templateData),
              };
              await sgMail.send(msg);
              guest.Sent = "Yes";
              console.log("Email sent to: ", guest, "\nReminder: ", reminder);
            }
          });
          //Update guest sent response in sheets
          try {
            // Make another API request to update guest status in sheets
            const sheetUpdateResponse = await fetch(
              `${process.env.HOST}/api/sheets`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ guestList }),
              },
            );

            if (!sheetUpdateResponse.ok) {
              throw new Error("Failed to update sheet");
            }

            console.log("Sheet updated for guest:", guest.Email);
          } catch (error) {
            console.error("Error processing guest:", guest.Email, error);
            // Optionally, you might want to track failed sends/updates
          }
          return NextResponse.json(
            { message: "Email(s) sent successfully" },
            { status: 200 },
          );
        }
        // else get all users and return
        let allUsers = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetID,
          range: "Main",
        });

        allUsers = allUsers.data.values;
        const keys = allUsers.shift();
        const selectedKeys = [
          keys[0],
          keys[1],
          keys[4],
          keys[5],
          keys[10],
          keys[11],
        ];
        const selectedIndexes = [0, 1, 4, 5, 10, 11];

        allUsers = allUsers.map((user) => {
          return selectedKeys.reduce((obj, key, index) => {
            obj[key] = user[selectedIndexes[index]];
            return obj;
          }, {});
        });

        return NextResponse.json(
          { validated: true, guestList: allUsers },
          { status: 200 },
        );
      } else {
        return NextResponse.json({ validated: false }, { status: 200 });
      }
    } catch (error) {
      return NextResponse.json({ message: error }, { status: 200 });
    }
  } else {
  }

  return NextResponse.json({ error: "Failed" }, { status: 400 });
}

async function GET(req) {
  const body = await req.json();

  if (body.password) {
    return NextResponse.json({ message: body.password }, { status: 200 });
  }
  if (body.getUsers) {
    // get all users
    try {
      const allUsers = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: "Main",
      });
      return NextResponse.json({ messgae: allUsers }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ messgae: errors }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Failed" }, { status: 400 });
}

export async function handler(req, res) {
  if (req.method === "POST") return await POST(req);
  if (req.method === "GET") return await GET(req);
  return NextResponse.json({ error: "Failed" }, { status: 400 });
}
