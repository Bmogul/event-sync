# Send Reminder API Endpoint

**Endpoint**: `/api/[eventID]/sendReminder`

**Description**: Sends reminder emails to guests with customizable messaging. This is a legacy endpoint that integrates with Google Sheets for guest list management and uses SendGrid for email delivery.

## Endpoints

### POST /api/[eventID]/sendReminder

Sends reminder emails to guests and updates their status in Google Sheets.

**Authentication**: Required (Event password authentication via Google Sheets)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Request Body Schema**:
```javascript
{
  "password": "string", // Required - Event access password
  "event": {
    "eventID": "string", // Event public ID
    "eventTitle": "string", // Event name
    "sheetID": "string", // Google Sheets ID
    "logo": "string", // Event logo URL
    "email_message": "string" // Custom reminder message
  },
  "guestList": [
    {
      "GUID": "string", // Guest unique identifier
      "UID": "string", // User unique identifier  
      "Email": "string", // Guest email address
      "Sent": "string", // Current email status ("Yes" or other)
      // Additional guest properties from Google Sheets...
    }
  ]
}
```

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/sendReminder`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    password: "event-password-123",
    event: {
      eventID: "wedding-2024",
      eventTitle: "John & Jane's Wedding",
      sheetID: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      logo: "https://example.com/logo.png",
      email_message: "Don't forget to RSVP for our special day!"
    },
    guestList: [
      {
        GUID: "guest-123",
        UID: "user-456", 
        Email: "guest@example.com",
        Sent: "No"
      }
    ]
  })
});
```

**Response Schema**:
```javascript
{
  "validated": true,
  "guestList": [
    {
      "GUID": "string",
      "UID": "string", 
      "Email": "string",
      "Sent": "Yes", // Updated status after sending
      // Other guest properties...
    }
  ]
}
```

**Frontend Usage**:
- `src/app/[eventID]/components/emailPortal.js:244` - Sending reminder emails
- `src/app/[eventID]/components/emailPortal.js:269` - Countdown reminders
- `src/app/[eventID]/components/emailPortal.js:295` - Event update emails

## Legacy Architecture

### Google Sheets Integration
This endpoint relies on Google Sheets as the data source:

```javascript
import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";
import { authEvent } from "../../../lib/helpers";

const sheets = await getGoogleSheets();

// Authenticate using event password
if (!(await authEvent(sheets, sheetID, password))) {
  return NextResponse.json({ validated: false }, { status: 200 });
}
```

### Sheet Data Structure
Expected Google Sheets format:
- **Column A**: GUID (Guest ID)
- **Column B**: UID (User ID)
- **Column M**: Sent status
- Additional columns for guest information

### Sheet Update Operations
```javascript
// Update single row in sheet
const updateSheetRow = async (guest, rowNumber) => {
  const cellRange = `Main!M${rowNumber}:N${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetID,
    range: cellRange,
    valueInputOption: "RAW",
    resource: {
      values: [[guest.Sent]]
    }
  });
};
```

## Email Processing

### Template System
Uses Handlebars template compilation:
```javascript
import Handlebars from "handlebars";
import { reminderTemplate } from "./templates.js";

const compiledReminderTemplate = Handlebars.compile(reminderTemplate);
```

### Template Data
```javascript
const templateData = {
  rsvpLink: `${process.env.HOST}/${event.eventID}/rsvp?guid=${guest.GUID}`,
  clientMessage: event.email_message,
  eventName: event.eventTitle,
  logoLink: event.logo
};
```

### Email Configuration
```javascript
const msg = {
  to: guest.Email,
  from: {
    email: "sender@event-sync.com",
    name: "Huzefa and Fatema Mogul" // Hardcoded sender
  },
  subject: "Important Update Inside",
  html: compiledReminderTemplate(templateData)
};
```

## Business Logic

### Guest Processing Flow
1. **Authentication**: Validate event password against Google Sheets
2. **Sheet Data Loading**: Fetch existing guest data from Google Sheets
3. **Email Processing**: Send reminder emails to guests with valid emails
4. **Status Updates**: Update "Sent" status in Google Sheets
5. **Response Compilation**: Return updated guest list

### Email Sending Logic
```javascript
for (const guest of guestList) {
  try {
    if (!guest.Email) {
      updatedGuestList.push(guest);
      continue;
    }

    const reminder = guest.Sent === "Yes";
    
    // Send email via SendGrid
    await sgMail.send(msg);
    
    // Update guest status
    const updatedGuest = { ...guest, Sent: "Yes" };
    updatedGuestList.push(updatedGuest);

    // Update corresponding row in Google Sheets
    const rowNumber = findRowNumber(guest, allValues);
    if (rowNumber) {
      await updateSheetRow(updatedGuest, rowNumber);
    }
    
  } catch (error) {
    // Continue processing other guests on error
    updatedGuestList.push(guest);
  }
}
```

### Row Finding Logic
```javascript
const findRowNumber = (guest, allValues) => {
  const rowIndex = allValues.findIndex(
    (row) =>
      row[0]?.toString() === guest.GUID?.toString() &&
      row[1]?.toString() === guest.UID?.toString()
  );
  return rowIndex !== -1 ? rowIndex + 1 : null;
};
```

## Authentication System

### Event Password Validation
Uses Google Sheets-based authentication:
```javascript
// Helper function in lib/helpers
export async function authEvent(sheets, sheetID, password) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Config!B1" // Password stored in specific cell
    });
    
    const storedPassword = response.data.values?.[0]?.[0];
    return storedPassword === password;
  } catch (error) {
    return false;
  }
}
```

### No User Authentication
Unlike modern endpoints, this doesn't require user authentication tokens - only event password validation.

## Environment Configuration

### Required Environment Variables
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
HOST=https://yourdomain.com
GOOGLE_SHEETS_PRIVATE_KEY=your_google_service_account_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
```

### SendGrid Setup
```javascript
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## Error Handling

**Authentication Failure**:
```javascript
{
  "validated": false
}
```

**Invalid Data Format**:
```javascript
{
  "error": "Invalid data format"
}
```

**Processing Errors**:
```javascript
{
  "message": "Detailed error message"
}
```

**Individual Guest Errors**:
- Logged but don't stop processing
- Guest remains in list with original status
- Detailed error logging for debugging

## Performance Considerations

### Sequential Processing
- Processes guests one at a time to avoid rate limits
- Updates Google Sheets synchronously for each guest
- May be slow for large guest lists

### Google Sheets API Limits
- Subject to Google Sheets API quotas
- Updates individual cells rather than batch operations
- Could benefit from batch update optimization

### Error Resilience
- Continues processing on individual failures
- Maintains data consistency between email status and sheets
- Logs errors for debugging without failing entire operation

## Migration Notes

### Legacy vs. Modern Architecture
This endpoint represents the legacy architecture using:
- Google Sheets as primary data store
- Password-based authentication
- Hardcoded sender information
- Individual sheet cell updates

### Modern Equivalent
For new implementations, use:
- [`POST /api/[eventID]/sendMail`](./send-mail.md) - Modern invitation system
- Database-stored guest information
- Token-based authentication
- Batch processing capabilities

## Database Tables

**None**: This endpoint operates entirely through Google Sheets and doesn't interact with the Supabase database.

## Integration Notes

### Google Sheets API
Requires Google Service Account configuration:
```javascript
// lib/google-sheets.js
const auth = new google.auth.JWT(
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  null,
  process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets']
);
```

### Template Files
Reminder template stored in:
- `templates.js` - Handlebars template definitions
- Template includes variables for dynamic content insertion

## Related Endpoints

- [`POST /api/[eventID]/sendMail`](./send-mail.md) - Modern invitation system
- [`POST /api/[eventID]/sendUpdate`](./send-update.md) - Event update emails
- [`POST /api/[eventID]/remindeCountDown`](./reminder-countdown.md) - Countdown reminders

## Best Practices

### When to Use
- Legacy events still using Google Sheets
- Events that haven't migrated to database system
- Backward compatibility requirements

### Migration Recommendations
- Migrate guest data to database system
- Implement proper user authentication
- Use modern email template system
- Implement batch processing for better performance

### Error Handling
- Always validate Google Sheets connectivity
- Implement retry logic for failed operations
- Monitor API quota usage
- Log detailed errors for troubleshooting