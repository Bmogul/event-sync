import { NextResponse } from "next/server";
import { EmailService } from "../../../lib/emailService.js";
import { authEvent } from "../../../lib/helpers";
import { getGoogleSheets } from "../../../lib/google-sheets";

export const POST = async (req, { params }) => {
  const eventID = params.eventID;
  const { password, event, guestList, emailType = 'invitation' } = await req.json();
  
  if (!password || !event || !guestList || guestList.length === 0) {
    console.log("INVALID DATA FORMAT");
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  try {
    // Authenticate event access
    const sheets = await getGoogleSheets();
    const sheetID = event.sheetID;
    
    if (!(await authEvent(sheets, sheetID, password))) {
      return NextResponse.json({ validated: false }, { status: 200 });
    }

    // Initialize email service
    const emailService = EmailService.getInstance();
    
    // Send emails using new template system
    let results;
    switch (emailType) {
      case 'reminder':
        results = await emailService.sendReminderEmails(eventID, guestList);
        break;
      case 'update':
        const updateMessage = event.update_message || 'Event details have been updated.';
        results = await emailService.sendUpdateEmails(eventID, guestList, updateMessage);
        break;
      case 'countdown':
        results = await emailService.sendCountdownEmails(eventID, guestList);
        break;
      default:
        results = await emailService.sendInvitationEmails(eventID, guestList);
    }

    // Update Google Sheets with send status
    if (results.successful.length > 0) {
      try {
        // Get existing data from sheet
        const mainSheet = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetID,
          range: "Main",
        });
        const allValues = mainSheet.data.values || [];

        // Function to update a single row in the sheet
        const updateSheetRow = async (guest, rowNumber) => {
          const cellRange = `Main!M${rowNumber}:N${rowNumber}`;
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetID,
            range: cellRange,
            valueInputOption: "RAW",
            resource: {
              values: [["Yes"]],
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

        // Update sheets for successful sends
        for (const successResult of results.successful) {
          const guest = successResult.guest;
          const rowNumber = findRowNumber(guest, allValues);
          if (rowNumber) {
            await updateSheetRow(guest, rowNumber);
            console.log(`Sheet updated for guest: ${guest.email}`);
          }
        }
      } catch (sheetError) {
        console.warn('Failed to update Google Sheets:', sheetError);
        // Don't fail the entire operation if sheet update fails
      }
    }

    // Prepare response
    const updatedGuestList = guestList.map(guest => {
      const success = results.successful.find(s => s.guest.email === guest.email);
      return success ? { ...guest, Sent: "Yes" } : guest;
    });

    return NextResponse.json({
      validated: true,
      guestList: updatedGuestList,
      emailResults: {
        total: results.total,
        successful: results.successful.length,
        failed: results.failed.length,
        errors: results.failed.map(f => ({
          email: f.guest.email,
          error: f.error
        }))
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error processing email send:", error);
    return NextResponse.json({ 
      message: error.message,
      validated: true,
      guestList: guestList // Return original list on error
    }, { status: 500 });
  }
};