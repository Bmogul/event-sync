# RSVP API Endpoint

**Endpoint**: `/api/[eventID]/rsvp`

**Description**: Handles guest RSVP responses and guest information retrieval for public RSVP pages. This endpoint manages the complete RSVP workflow including guest lookup, response submission, and contact information updates.

## Endpoints

### GET /api/[eventID]/rsvp

Retrieves guest party information and event details for RSVP submission.

**Authentication**: None required (public endpoint)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Query Parameters**:
- `guestId` or `guid` (string, required): The guest group ID for lookup

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/rsvp?guestId=${groupId}`);
```

**Response Schema**:
```javascript
{
  "party": [
    {
      "id": "number", // Guest database ID
      "public_id": "string", // UUID identifier
      "name": "string",
      "email": "string|null",
      "phone": "string|null",
      "tag": "string|null",
      "point_of_contact": "boolean",
      "group": "string", // Group title
      "group_id": "number",
      "gender": "string", // "male", "female", "other"
      "ageGroup": "string",
      "guestType": "string", // "single", "multiple", "variable" 
      "guestLimit": "number|null", // null for variable type
      "invites": {
        "[Sub-event Title]": "number" // Status ID (1=invited, 3=attending, 4=not_attending)
      },
      "rsvps": [
        {
          "subevent_id": "number",
          "status_id": "number",
          "response": "number|null",
          "details": "object|null"
        }
      ],
      "hasInvitations": "boolean"
    }
  ],
  "event": {
    "id": "number",
    "public_id": "string", 
    "title": "string",
    "description": "string",
    "start_date": "ISO 8601 string",
    "end_date": "ISO 8601 string",
    "capacity": "number",
    "status_id": "number",
    "details": "object",
    "logo_url": "string",
    "hero_url": "string", 
    "background_image_url": "string",
    "landing_page_configs": [
      {
        "id": "number",
        "title": "string",
        "logo": "string",
        "greeting_config": {
          "message": "string",
          "subtitle": "string",
          "theme": "string",
          "font_family": "string",
          "background_color": "string",
          "text_color": "string",
          "primary_color": "string",
          "background_image": "string",
          "background_overlay": "number"
        },
        "rsvp_config": {
          "custom_questions": "array"
        },
        "status": "string"
      }
    ]
  },
  "subEvents": [
    {
      "id": "number",
      "title": "string", 
      "event_date": "ISO 8601 string",
      "start_time": "string",
      "venue_address": "string",
      "capacity": "number",
      "details": "object",
      "image_url": "string"
    }
  ],
  "group": {
    "id": "number",
    "title": "string"
  }
}
```

**Guest Filtering Logic**:
- Only returns guests who have at least one invitation to a sub-event
- Filters out guests without any RSVP records
- Provides only sub-events the guest group is invited to

**Frontend Usage**:
- `src/app/[eventID]/rsvp/page.js:35` - Loading guest data for RSVP page

### POST /api/[eventID]/rsvp

Submits RSVP responses and updates guest information.

**Authentication**: None required (public endpoint)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Request Body Schema**:
```javascript
{
  "party": [
    {
      "id": "number", // Guest database ID
      "public_id": "string", // UUID identifier (alternative to id)
      "responses": {
        "[Sub-event Title]": "string|number", // Response value
        // OR
        "[Sub-event ID]": "string|number" // Response by ID
      },
      "guestType": "string", // "single", "multiple", "variable"
      "guestLimit": "number|null" // For validation
    }
  ],
  "responses": "object", // Legacy format support
  "guestDetails": {
    "[Guest Public ID or ID]": {
      "email": "string",
      "phone": "string"
    }
  },
  "customQuestionResponses": "object" // Custom form responses
}
```

**Response Value Processing by Guest Type**:

**Single Type**:
- `"attending"`, `"yes"` → Status: 3 (attending), Response: 1
- `"not_attending"`, `"no"` → Status: 4 (not_attending), Response: 0
- Other values → Status: 1 (pending), Response: 0

**Multiple/Variable Type**:
- Numeric values > 0 → Status: 3 (attending), Response: number
- Numeric value = 0 → Status: 4 (not_attending), Response: 0
- Multiple type validates against `guestLimit`

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/rsvp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    party: [
      {
        id: 123,
        public_id: "uuid-123",
        guestType: "multiple",
        guestLimit: 4,
        responses: {
          "Ceremony": 2,
          "Reception": 4,
          "After Party": 0
        }
      },
      {
        id: 124,
        guestType: "single", 
        responses: {
          "Ceremony": "attending",
          "Reception": "attending"
        }
      }
    ],
    guestDetails: {
      "uuid-123": {
        "email": "updated@example.com",
        "phone": "+1234567890"
      }
    },
    customQuestionResponses: {
      "dietary_requirements": "Vegetarian",
      "message": "Looking forward to celebrating!"
    }
  })
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "updated": {
    "guests": "number", // Count of guest contact updates
    "rsvps": "number" // Count of RSVP responses updated
  }
}
```

**Frontend Usage**:
- `src/app/[eventID]/rsvp/page.js:130` - Submitting RSVP responses

## Business Logic

### Guest Group Lookup
The GET endpoint performs group-based lookup:
1. **Group Validation**: Verifies group belongs to the specified event
2. **Guest Filtering**: Only includes guests with invitations
3. **Sub-event Filtering**: Only shows sub-events guests are invited to
4. **Invitation Status**: Maps RSVP records to invitation status

### Response Processing Logic
```javascript
const processResponseByGuestType = (response, guestType, guestLimit) => {
  const normalizedGuestType = (guestType || "single").toLowerCase();
  
  switch (normalizedGuestType) {
    case "single":
      // Boolean-style responses
      if (String(response).toLowerCase() === "attending") {
        return { statusId: 3, responseValue: 1 };
      } else if (String(response).toLowerCase() === "not_attending") {
        return { statusId: 4, responseValue: 0 };
      }
      return { statusId: 1, responseValue: 0 };
      
    case "multiple":
    case "variable":
      // Numeric responses with validation
      const numericResponse = parseInt(response) || 0;
      
      if (normalizedGuestType === "multiple" && guestLimit && numericResponse > guestLimit) {
        // Cap to guest limit
        return { statusId: numericResponse > 0 ? 3 : 4, responseValue: guestLimit };
      }
      
      return { 
        statusId: numericResponse > 0 ? 3 : 4, 
        responseValue: numericResponse 
      };
  }
};
```

### Invitation Validation
POST endpoint validates guest invitations:
```javascript
// Only allow RSVP if guest is invited to sub-event
const { data: guestExistingRsvps } = await supabase
  .from("rsvps")
  .select("subevent_id")
  .eq("guest_id", guestId);

const invitedSubEventIds = guestExistingRsvps?.map(r => r.subevent_id) || [];

// Skip RSVP if not invited
if (!invitedSubEventIds.includes(subEvent.id)) {
  continue;
}
```

### Contact Information Updates
Guest details are updated separately from RSVP responses:
```javascript
// Update guest contact information
if (guestDetails && guestDetails[public_id || guestId]) {
  const details = guestDetails[public_id || guestId];
  await supabase.from("guests").update({
    email: details.email,
    phone: details.phone,
  }).eq("id", guestId);
}
```

## Data Flow

### RSVP Submission Flow
1. **Guest Identification**: Locate guest by group ID
2. **Invitation Verification**: Confirm guest is invited to sub-events
3. **Response Processing**: Convert frontend responses to database format
4. **Validation**: Check responses against guest type limits
5. **Database Updates**: Upsert RSVP records and update guest contact info
6. **Custom Questions**: Store additional form responses

### Guest Type Handling
Each guest type requires different processing:

**Single Guest Flow**:
```
"attending" → status_id: 3, response: 1
"not_attending" → status_id: 4, response: 0
```

**Multiple Guest Flow**:
```
Number (1-limit) → status_id: 3, response: number
Number (0) → status_id: 4, response: 0
Number (>limit) → status_id: 3, response: limit (capped)
```

**Variable Guest Flow**:
```
Number (>0) → status_id: 3, response: number
Number (0) → status_id: 4, response: 0
```

## Error Handling

**Missing Group ID**:
```javascript
{
  "message": "Missing group ID"
}
```

**Group Not Found**:
```javascript
{
  "message": "Group not found for this event"
}
```

**No Invited Guests**:
```javascript
{
  "message": "No guests found in this group"
}
```

**Invalid Response Data**:
```javascript
{
  "error": "Invalid data format - no party data"
}
```

**Database Errors**:
```javascript
{
  "error": "Internal server error"
}
```

## Database Tables Affected

**Read Operations (GET)**:
- `events` - Event information and landing page config
- `guest_groups` - Group validation and information
- `guests` - Guest details and contact information
- `rsvps` - Invitation status and existing responses
- `subevents` - Sub-event details for invited events

**Write Operations (POST)**:
- `guests` - Contact information updates (email, phone)
- `rsvps` - RSVP response records (upsert operation)

## Performance Considerations

### Query Optimization
- **Group-based Filtering**: Efficient filtering by group reduces data load
- **Invitation Filtering**: Only loads relevant sub-events and RSVPs
- **Single Transaction**: Groups related updates in transactions

### Response Size Management
- **Filtered Data**: Only returns guests with invitations
- **Relevant Sub-events**: Only includes sub-events guests are invited to
- **Minimal Payload**: Optimized for public RSVP page performance

## Security Considerations

### Public Access
- **No Authentication**: Endpoint is publicly accessible
- **Group-based Security**: Access controlled by knowledge of group ID
- **Data Minimization**: Only exposes necessary information for RSVP

### Input Validation
- **Response Validation**: Validates response values against guest types
- **Invitation Verification**: Only allows responses for valid invitations
- **Data Sanitization**: Cleans and validates all input data

### Rate Limiting
Consider implementing rate limiting for:
- Multiple rapid submissions
- Brute force group ID attempts
- Large response payloads

## Integration Notes

### Frontend RSVP Form
The endpoint is designed to work with dynamic RSVP forms:
```javascript
// Form structure supports multiple guests
const rsvpData = {
  party: partyMembers.map(member => ({
    id: member.id,
    guestType: member.guestType,
    guestLimit: member.guestLimit,
    responses: buildResponses(member, subEvents)
  })),
  guestDetails: collectContactUpdates(partyMembers),
  customQuestionResponses: collectCustomResponses(formData)
};
```

### Email Integration
RSVP responses can trigger email notifications:
- Confirmation emails to guests
- Notification emails to event managers
- Reminder emails for incomplete responses

## Related Endpoints

- [`GET /api/[eventID]/guestList`](./guest-list.md) - Manager view of all RSVPs
- [`POST /api/[eventID]/sendMail`](./send-mail.md) - Send RSVP invitations
- [`POST /api/[eventID]/sendReminder`](./send-reminder.md) - Send RSVP reminders
- [`GET /api/events/[eventID]`](./events-detail.md) - Public event information