# Send Update API Endpoint

**Endpoint**: `/api/[eventID]/sendUpdate`

**Description**: Sends event update emails to guests. This endpoint appears to be referenced in the frontend but the actual implementation is not present in the current codebase.

## Current Status

**Implementation Status**: Not implemented in the current codebase.

**Referenced Locations**:
- `src/app/[eventID]/components/emailPortal.js:295` - Frontend attempts to call this endpoint

## Expected Functionality

Based on the frontend usage and naming convention, this endpoint would likely:

### POST /api/[eventID]/sendUpdate

Send event update emails to guests with changes or additional information.

**Expected Authentication**: Required (Bearer token + Event manager access)

**Expected URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Expected Request Body Schema**:
```javascript
{
  "guestList": [
    {
      "name": "string",
      "email": "string",
      "group_id": "number"
      // Additional guest properties...
    }
  ],
  "updateMessage": "string", // Update content
  "updateType": "string", // Type of update ("date_change", "venue_change", etc.)
  "templateId": "number" // Optional: Update email template ID
}
```

**Expected Response Schema**:
```javascript
{
  "success": true,
  "results": {
    "total": "number",
    "successful": "number", 
    "failed": "number",
    "details": {
      "successful": "array",
      "failed": "array"
    }
  }
}
```

## Frontend Integration

### Current Usage
```javascript
// From emailPortal.js:295
const res = await fetch(`/api/${params.eventID}/sendUpdate`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    guestList: selectedGuests,
    // Additional update parameters would go here
  }),
});
```

## Implementation Recommendations

If implementing this endpoint, it should follow the pattern of existing email endpoints:

### Suggested Implementation Structure
```javascript
// /api/[eventID]/sendUpdate/route.js
import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import { createClient } from "../../../utils/supabase/server";
import { updateTemplate } from "./templates.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const compiledUpdateTemplate = Handlebars.compile(updateTemplate);

export const POST = async (req, { params }) => {
  const { eventID } = params;
  
  try {
    // Authentication and authorization (similar to sendMail)
    // Template loading and email generation
    // Bulk email sending with error handling
    // Response compilation
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
```

### Suggested Template Variables
```javascript
const templateData = {
  updateType: updateType,
  updateMessage: updateMessage,
  eventName: event.title,
  eventDate: formatEventDate(event.start_date),
  rsvpLink: rsvpLink,
  logoLink: event.logo_url,
  guestName: guest.name || 'Guest',
  // Standard email template variables...
};
```

### Common Update Types
- **Date Changes**: Event date/time modifications
- **Venue Changes**: Location updates
- **Agenda Updates**: Schedule or program changes
- **General Announcements**: Important information
- **Cancellations**: Event cancellation notices
- **Weather Updates**: Weather-related notifications

## Related Endpoints

- [`POST /api/[eventID]/sendMail`](./send-mail.md) - Send invitations
- [`POST /api/[eventID]/sendReminder`](./send-reminder.md) - Send reminders
- [`POST /api/[eventID]/remindeCountDown`](./reminder-countdown.md) - Countdown reminders

## Development Notes

### To Implement This Endpoint

1. **Create Route File**: `/api/[eventID]/sendUpdate/route.js`
2. **Create Template**: Update email template with appropriate styling
3. **Add Template Support**: Support for update-specific templates in database
4. **Testing**: Ensure frontend integration works correctly
5. **Documentation**: Update this documentation with actual implementation details

### Recommended Features
- Support for different update types with appropriate templates
- Ability to include file attachments (updated schedules, maps, etc.)
- Option to send to specific guest segments
- Update history tracking for audit purposes
- Integration with event change notifications

### Error Handling
Should follow the same pattern as other email endpoints:
- Individual guest error handling
- Detailed success/failure reporting
- Graceful degradation on template or delivery issues

## Security Considerations

- Same authentication requirements as other email endpoints
- Validate update content to prevent spam/abuse
- Rate limiting for update frequency
- Content filtering for inappropriate messages

## Future Enhancements

- **Template Versioning**: Track different versions of update templates
- **Delivery Tracking**: Monitor email open rates and engagement
- **Update Categories**: Categorize different types of updates
- **Guest Preferences**: Allow guests to opt out of certain update types
- **Multi-language Support**: Send updates in guest's preferred language