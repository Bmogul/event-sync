# Send Mail API Endpoint

**Endpoint**: `/api/[eventID]/sendMail`

**Description**: Handles sending invitation emails to guests using customizable templates. This endpoint integrates with SendGrid for email delivery and supports both database-stored templates and event-specific email configurations.

## Endpoints

### POST /api/[eventID]/sendMail

Sends invitation emails to a list of guests.

**Authentication**: Required (Bearer token + Event manager access)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Request Headers**:
```javascript
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body Schema**:
```javascript
{
  "guestList": [
    {
      "name": "string", // Guest name
      "email": "string", // Required for email sending
      "group_id": "number", // Guest group ID for RSVP link generation
      // Additional guest properties...
    }
  ],
  "emailType": "string", // Optional: "invitation" (default)
  "templateId": "number" // Optional: Database template ID to use
}
```

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/sendMail`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guestList: [
      {
        name: "John Doe",
        email: "john@example.com",
        group_id: 123
      },
      {
        name: "Jane Smith", 
        email: "jane@example.com",
        group_id: 124
      }
    ],
    emailType: "invitation",
    templateId: 42
  })
});
```

**Response Schema**:
```javascript
{
  "validated": true,
  "success": true,
  "results": {
    "total": "number", // Total guests processed
    "successful": "number", // Successfully sent emails
    "failed": "number", // Failed email attempts
    "details": {
      "successful": [
        {
          "guest": "object", // Guest object
          "email": "string" // Email address used
        }
      ],
      "failed": [
        {
          "guest": "object", // Guest object
          "error": "string" // Error message
        }
      ]
    }
  },
  "guestList": [
    {
      // Updated guest objects with email status
      "emailSent": "boolean",
      "lastEmailSent": "ISO 8601 string"
    }
  ]
}
```

**Frontend Usage**:
- `src/app/[eventID]/components/emailPortal.js:219` - Sending invitations from email portal

## Email Template System

### Template Priority Order
1. **Database Template**: If `templateId` provided, uses stored email template
2. **Event Configuration**: Falls back to event.details.emailConfig
3. **Default Template**: Uses hardcoded defaults

### Template Data Structure
```javascript
const emailContent = {
  greeting: "Dear Guest,", // Email opening
  body: "You are invited...", // Main email content
  signoff: "Best regards,", // Email closing
  subjectLine: "Invitation: Event Title", // Email subject
  senderName: "Event Organizer", // Sender display name
  primary_color: "#ffffff", // Template styling
  secondary_color: "#e1c0b7", // Template styling  
  text_color: "#333333" // Template styling
};
```

### Database Template Loading
When `templateId` is provided:
```javascript
const { data: template } = await supabase
  .from("email_templates")
  .select(`
    *,
    email_template_categories(name),
    email_template_status(name)
  `)
  .eq("id", templateId)
  .eq("event_id", event.id)
  .single();
```

## Email Generation & Delivery

### RSVP Link Generation
Each guest receives a unique RSVP link:
```javascript
const rsvpLink = `${process.env.HOST || 'http://localhost:3000'}/${eventID}/rsvp?guestId=${guest.group_id}`;
```

### Template Data Population
```javascript
const templateData = {
  rsvpLink: rsvpLink,
  eventName: event.title,
  logoLink: event.logo_url,
  greeting: emailContent.greeting,
  body: emailContent.body, 
  signoff: emailContent.signoff,
  senderName: emailContent.senderName,
  guestName: guest.name || 'Guest',
  eventDate: formatEventDate(event.start_date),
  eventDescription: event.description || '',
  primary_color: emailContent.primary_color,
  secondary_color: emailContent.secondary_color,
  text_color: emailContent.text_color
};
```

### SendGrid Integration
```javascript
const msg = {
  to: guest.email,
  from: {
    email: "sender@event-sync.com",
    name: emailContent.senderName
  },
  subject: emailContent.subjectLine,
  html: compiledInviteTemplate(templateData)
};

await sgMail.send(msg);
```

### Handlebars Template Compilation
The endpoint uses Handlebars templates for email rendering:
```javascript
import Handlebars from "handlebars";
import { inviteTemplate } from "./templates.js";

const compiledInviteTemplate = Handlebars.compile(inviteTemplate);
const html = compiledInviteTemplate(templateData);
```

## Business Logic

### Guest Processing Flow
1. **Validation**: Check for valid email addresses
2. **Template Resolution**: Load database template or use defaults
3. **Email Generation**: Populate template with guest-specific data
4. **Delivery**: Send via SendGrid API
5. **Status Tracking**: Record success/failure for each guest
6. **Response Building**: Compile results and updated guest list

### Error Handling Per Guest
The endpoint processes guests individually and continues on errors:
```javascript
for (const guest of guestList) {
  try {
    if (!guest.email) {
      emailResults.failed.push({
        guest: guest,
        error: "No email address"
      });
      continue;
    }
    
    // Process email sending...
    await sgMail.send(msg);
    
    emailResults.successful.push({
      guest: guest,
      email: guest.email
    });
    
  } catch (error) {
    emailResults.failed.push({
      guest: guest,
      error: error.message
    });
  }
}
```

### Guest List Updates
Successfully sent emails update guest records:
```javascript
const updatedGuest = {
  ...guest,
  emailSent: true,
  lastEmailSent: new Date().toISOString()
};
```

## Authentication & Authorization

### Access Control Flow
1. **Token Extraction**: Retrieves Bearer token from Authorization header
2. **User Verification**: Validates token with Supabase auth
3. **Profile Lookup**: Gets user profile from database
4. **Event Access**: Verifies event exists and user has manager access
5. **Manager Validation**: Checks `event_managers` table for permissions

### Required Permissions
- Valid authenticated session
- Event manager role for the specified event
- Event must exist and be accessible

**Authorization Example**:
```javascript
const { data: managers } = await supabase
  .from("event_managers")
  .select("*")
  .eq("event_id", event.id)
  .eq("user_id", userProfile.id)
  .limit(1);

if (!managers || managers.length === 0) {
  return { validated: false, message: "Access denied" };
}
```

## Configuration & Environment

### Required Environment Variables
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
HOST=https://yourdomain.com  # For RSVP link generation
```

### SendGrid Configuration
```javascript
import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Default Sender Configuration
```javascript
const defaultSender = {
  email: "sender@event-sync.com",
  name: eventDetails.organizerName || "Event Organizer"
};
```

## Error Handling

**Authentication Errors**:
```javascript
{
  "validated": false,
  "message": "Invalid user"
}
```

**Authorization Errors**:
```javascript
{
  "validated": false,
  "message": "Access denied"
}
```

**Event Not Found**:
```javascript
{
  "error": "Event not found"
}
```

**Template Not Found**:
```javascript
{
  "error": "Email template not found"
}
```

**No Guests Provided**:
```javascript
{
  "error": "No guests provided"
}
```

**SendGrid Errors**:
Individual email failures are captured and reported in the response without failing the entire operation.

## Performance Considerations

### Bulk Email Processing
- **Sequential Processing**: Processes emails one at a time to avoid rate limits
- **Error Isolation**: Individual failures don't stop the entire batch
- **Status Tracking**: Maintains detailed success/failure tracking

### Rate Limiting
Consider implementing:
- Daily email limits per event
- Hourly sending limits
- Duplicate email prevention

### Template Caching
For high-volume sending:
- Cache compiled Handlebars templates
- Cache database template lookups
- Pre-load event configuration

## Database Tables Affected

**Read Operations**:
- `events` - Event details and configuration
- `email_templates` - Template content (if templateId provided)
- `email_template_categories` - Template categorization
- `email_template_status` - Template status information
- `event_managers` - Access control validation

**No Direct Writes**: This endpoint reads from database but doesn't update guest records directly (that's handled by the frontend after response).

## Integration Notes

### Email Template System
Templates support Handlebars syntax with variables:
- `{{rsvpLink}}` - Unique RSVP URL
- `{{eventName}}` - Event title
- `{{guestName}}` - Guest's name
- `{{eventDate}}` - Formatted event date
- `{{logoLink}}` - Event logo URL
- `{{greeting}}` - Template greeting
- `{{body}}` - Template main content
- `{{signoff}}` - Template closing
- `{{senderName}}` - Sender name

### Frontend Integration
The email portal integrates with this endpoint:
```javascript
// Send invitations
const sendInvitations = async (selectedGuests, templateId) => {
  const response = await fetch(`/api/${eventID}/sendMail`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      guestList: selectedGuests,
      templateId: templateId
    })
  });
  
  const result = await response.json();
  
  // Update UI with results
  showEmailResults(result.results);
};
```

## Related Endpoints

- [`POST /api/[eventID]/sendReminder`](./send-reminder.md) - Send reminder emails
- [`POST /api/[eventID]/sendUpdate`](./send-update.md) - Send event updates
- [`GET /api/[eventID]/guestList`](./guest-list.md) - Get guest list for email targeting
- [`GET /api/events`](./events.md) - Get email templates for selection

## Best Practices

### Email Content
- Keep subject lines under 50 characters
- Use responsive email templates
- Include clear RSVP call-to-action
- Test templates across email clients

### Delivery Management
- Validate email addresses before sending
- Monitor bounce rates and deliverability
- Implement unsubscribe handling
- Track email open rates (future enhancement)

### Error Recovery
- Retry failed sends with exponential backoff
- Log detailed error information for debugging
- Provide clear error messages to users
- Implement fallback communication methods