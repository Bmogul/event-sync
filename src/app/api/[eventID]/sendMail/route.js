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
              from:{
                email: sender,
                name: 'Shk Khuzema and Zahra bhen Kanchwala',
              } ,
              subject: !reminder
                ? "Rashida's Shadi Invitation"
                : "Important reminder inside",
              html:compiledInviteTemplate(templateData)
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

      // Update the sheet
      // Get existing data from sheet
      const mainSheet = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: "Main",
      });
      const allValues = mainSheet.data.values || [];
      const valuesToUpdate = {};

      // loop through party and get values to update
      for (const member of updatedGuestList) {
        const { GUID, UID } = member;

        if (!GUID || !UID) {
          continue; // Skip members without GUID or UID
        }
        console.log(member.Sent);

        allValues.filter((row) => {
          console.log(row[0]);
          if (row[0].toString() === GUID && row[1].toString() === UID) {
            const rowNumber = allValues.indexOf(row) + 1;
            const cellRange = `Main!J${rowNumber}:K${rowNumber}`;
            const values = [member.Sent];

            valuesToUpdate[cellRange] = {
              values: [values],
            };
            return true;
          }
          return false;
        });
      }

      // Batch Update values in sheet
      if (Object.keys(valuesToUpdate).length > 0) {
        const batchUpdateRequest = {
          data: [],
          valueInputOption: "RAW",
        };

        for (const [range, valueData] of Object.entries(valuesToUpdate)) {
          batchUpdateRequest.data.push({
            range,
            ...valueData,
          });
        }

        sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          resource: batchUpdateRequest,
        });
      }
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
