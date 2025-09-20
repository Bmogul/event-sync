# Reminder Countdown API Endpoint

**Endpoint**: `/api/[eventID]/remindeCountDown`

**Description**: Sends countdown reminder emails to guests as the event approaches. This is another legacy endpoint that integrates with Google Sheets for guest management and uses the same infrastructure as the send reminder system.

## Endpoints

### POST /api/[eventID]/remindeCountDown

Sends countdown reminder emails to guests with event timing information.

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
    "email_message": "string" // Custom countdown message
  },
  "guestList": [
    {
      "GUID": "string", // Guest unique identifier
      "UID": "string", // User unique identifier
      "Email": "string", // Guest email address
      "Sent": "string", // Current email status
      // Additional guest properties...
    }
  ]
}
```

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/remindeCountDown`, {
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
      email_message: "Only 3 days left until our special day! Don't forget to RSVP."
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
- `src/app/[eventID]/components/emailPortal.js:269` - Sending countdown reminders

## Implementation Details

### Shared Infrastructure
This endpoint shares the same implementation pattern as [`/api/[eventID]/sendReminder`](./send-reminder.md):

```javascript
// Same imports and setup
import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import { authEvent } from "../../../lib/helpers";
import { getGoogleSheets } from "../../../lib/google-sheets";
import { reminderTemplate } from "./templates.js";
```

### Template System
Uses the same Handlebars template compilation:
```javascript
const compiledReminderTemplate = Handlebars.compile(reminderTemplate);
```

### Template Data Structure
```javascript
const templateData = {
  rsvpLink: `${process.env.HOST}/${event.eventID}/rsvp?guid=${guest.GUID}`,
  clientMessage: event.email_message, // Countdown-specific message
  eventName: event.eventTitle,
  logoLink: event.logo
};
```

## Business Logic

### Countdown-Specific Features
While sharing the same infrastructure, countdown reminders typically:

1. **Time-Sensitive Messaging**: Include urgency about approaching event date
2. **Final RSVP Calls**: Emphasize RSVP deadlines
3. **Event Details**: Remind guests of key event information
4. **Preparation Instructions**: Include last-minute preparation details

### Message Differentiation
The main difference from regular reminders is the `email_message` content:
```javascript
// Regular reminder
"Please don't forget to RSVP for our event"

// Countdown reminder  
"Only 3 days left! Please confirm your attendance"
```

### Processing Flow
Same as send reminder endpoint:
1. **Authentication**: Validate event password against Google Sheets
2. **Guest Processing**: Send emails to guests with valid email addresses
3. **Sheet Updates**: Update "Sent" status in Google Sheets
4. **Response Compilation**: Return updated guest list

## Email Configuration

### SendGrid Setup
```javascript
const msg = {
  to: guest.Email,
  from: {
    email: "sender@event-sync.com",
    name: "Huzefa and Fatema Mogul" // Hardcoded sender
  },
  subject: "Important Update Inside", // Same subject as reminders
  html: compiledReminderTemplate(templateData)
};
```

### Template Variables
The template receives the same variables but with countdown-specific content:
- `{{rsvpLink}}` - RSVP URL for the guest
- `{{clientMessage}}` - Countdown message from event organizer
- `{{eventName}}` - Event title
- `{{logoLink}}` - Event logo URL

## Use Cases

### Timing Strategy
Countdown reminders are typically sent at strategic intervals:

1. **2 Weeks Before**: Initial countdown with full event details
2. **1 Week Before**: Urgent reminder with RSVP deadline emphasis
3. **3 Days Before**: Final call with last-minute information
4. **24 Hours Before**: Final reminder with immediate preparation details

### Message Examples
```javascript
// 1 Week countdown
"One week to go! We're excited to celebrate with you. Please confirm your attendance by [date]."

// 3 Day countdown  
"Only 3 days left until our special day! Final reminder to RSVP and prepare for an amazing celebration."

// 24 Hour countdown
"Tomorrow is the big day! We can't wait to see you. Here are the final details you need to know..."
```

## Authentication & Authorization

### Same as Send Reminder
Uses identical Google Sheets-based authentication:
```javascript
if (!(await authEvent(sheets, sheetID, password))) {
  return NextResponse.json({ validated: false }, { status: 200 });
}
```

### No User Authentication
Like the reminder endpoint, this doesn't require user authentication tokens - only event password validation.

## Error Handling

### Same Error Patterns
Identical error handling to the reminder endpoint:
- Authentication failures return `{ validated: false }`
- Invalid data format returns error messages
- Individual guest errors are logged but don't stop processing
- Google Sheets update failures are handled gracefully

## Performance Considerations

### Identical Constraints
Same performance characteristics as send reminder:
- Sequential email processing to avoid rate limits
- Individual Google Sheets cell updates
- Potential bottlenecks with large guest lists
- Google Sheets API quota limitations

## Environment Configuration

### Required Variables
Same environment variables as other email endpoints:
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
HOST=https://yourdomain.com
GOOGLE_SHEETS_PRIVATE_KEY=your_google_service_account_key
GOOGLE_SHEETS_CLIENT_EMAIL=your_service_account_email
```

## Templates

### Shared Template Files
Uses the same template system:
- `templates.js` - Contains reminderTemplate definition
- Template supports dynamic content through Handlebars variables
- Same styling and layout as regular reminders

### Template Customization
To differentiate countdown emails:
```javascript
// Could add countdown-specific template variables
const templateData = {
  // Standard variables...
  rsvpLink,
  clientMessage,
  eventName,
  logoLink,
  
  // Countdown-specific additions
  daysUntilEvent: calculateDaysUntil(event.startDate),
  urgencyLevel: determineUrgency(daysUntilEvent),
  isLastCall: daysUntilEvent <= 3
};
```

## Integration Notes

### Frontend Usage
Called from the email portal for countdown campaigns:
```javascript
// Send countdown reminder
const sendCountdownReminder = async () => {
  const response = await fetch(`/api/${eventID}/remindeCountDown`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      password: eventPassword,
      event: eventData,
      guestList: selectedGuests
    })
  });
};
```

### Campaign Coordination
Typically coordinated with other email communications:
1. Initial invitations
2. Regular reminders
3. **Countdown reminders** (this endpoint)
4. Final confirmations
5. Post-event follow-ups

## Migration Considerations

### Legacy Architecture
This endpoint represents legacy architecture:
- Google Sheets as primary data store
- Password-based authentication
- Manual campaign management

### Modern Alternative
For new implementations, consider:
- Database-stored guest information
- Token-based authentication  
- Automated countdown scheduling
- Template differentiation in database
- Campaign analytics and tracking

## Related Endpoints

- [`POST /api/[eventID]/sendReminder`](./send-reminder.md) - Regular reminder emails
- [`POST /api/[eventID]/sendMail`](./send-mail.md) - Modern invitation system
- [`POST /api/[eventID]/sendUpdate`](./send-update.md) - Event update emails

## Best Practices

### Timing Strategy
- Plan countdown sequence in advance
- Avoid over-communication fatigue
- Personalize urgency based on RSVP status
- Include clear next steps for guests

### Content Strategy
- Emphasize excitement and anticipation
- Include practical event information
- Provide clear RSVP calls-to-action
- Add last-minute preparation instructions

### Campaign Management
- Track open rates and engagement
- Segment guests based on RSVP status
- A/B test different message approaches
- Monitor unsubscribe rates