# Events API Endpoint

**Endpoint**: `/api/events`

**Description**: Core endpoint for managing events. Handles creation, retrieval, and deletion of events with comprehensive data including sub-events, guests, email templates, and landing page configurations.

## Endpoints

### GET /api/events

Retrieves a specific event by public_id with all related data.

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `public_id` (string, required): The public identifier of the event

**Request Example**:
```javascript
const response = await fetch(`/api/events?public_id=${encodeURIComponent(publicId)}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "event": {
    "public_id": "string",
    "title": "string",
    "description": "string",
    "location": "string",
    "startDate": "ISO 8601 string",
    "endDate": "ISO 8601 string", 
    "logo_url": "string",
    "maxGuests": "number",
    "eventType": "string",
    "isPrivate": "boolean",
    "requireRSVP": "boolean",
    "allowPlusOnes": "boolean",
    "rsvpDeadline": "ISO 8601 string",
    "timezone": "string",
    "subEvents": [
      {
        "id": "number",
        "title": "string",
        "description": "string",
        "date": "ISO 8601 string",
        "startTime": "string",
        "endTime": "string",
        "location": "string",
        "maxGuests": "number",
        "timezone": "string",
        "isRequired": "boolean",
        "image": "string|null"
      }
    ],
    "guestGroups": [
      {
        "id": "number",
        "name": "string",
        "title": "string",
        "description": "string",
        "maxSize": "number|string",
        "size": "number",
        "color": "string",
        "point_of_contact": "string|null"
      }
    ],
    "guests": [
      {
        "id": "number",
        "public_id": "string",
        "name": "string",
        "email": "string",
        "phone": "string",
        "tag": "string",
        "group": "string",
        "group_id": "number",
        "gender": "string",
        "ageGroup": "string",
        "guestType": "string",
        "guestLimit": "number|null",
        "isPointOfContact": "boolean",
        "subEventRSVPs": "object"
      }
    ],
    "rsvpSettings": {
      "pageTitle": "string",
      "subtitle": "string",
      "welcomeMessage": "string",
      "theme": "string",
      "fontFamily": "string",
      "backgroundColor": "string",
      "textColor": "string",
      "primaryColor": "string",
      "customQuestions": "array",
      "backgroundImage": "string|null",
      "backgroundOverlay": "number",
      "logo": "string|null"
    },
    "emailTemplates": [
      {
        "id": "number",
        "title": "string",
        "subtitle": "string",
        "body": "string",
        "greeting": "string",
        "signoff": "string",
        "sender_name": "string",
        "sender_email": "string",
        "reply_to": "string",
        "subject_line": "string",
        "template_key": "string",
        "category": "string",
        "status": "string",
        "description": "string",
        "is_default": "boolean",
        "primary_color": "string",
        "secondary_color": "string",
        "text_color": "string"
      }
    ]
  }
}
```

**Frontend Usage**:
- `src/app/create-event/page.js:163` - Loading existing events for editing
- `src/app/[eventID]/components/emailPortal.js:82` - Getting event data for email operations
- `src/app/[eventID]/components/EmailTemplateEditor.jsx:68` - Loading templates for editing

### POST /api/events

Creates a new event or updates an existing one with all related data.

**Authentication**: Required (Bearer token)

**Request Body Schema**:
```javascript
{
  "public_id": "string", // Required for updates
  "title": "string", // Required
  "description": "string",
  "location": "string",
  "startDate": "ISO 8601 string",
  "endDate": "ISO 8601 string",
  "logo_url": "string",
  "maxGuests": "number",
  "eventType": "string",
  "isPrivate": "boolean",
  "requireRSVP": "boolean", 
  "allowPlusOnes": "boolean",
  "rsvpDeadline": "ISO 8601 string",
  "timezone": "string",
  "status": "string", // "draft" or "published"
  "subEvents": [
    {
      "id": "number", // Include for updates
      "title": "string",
      "description": "string", 
      "date": "ISO 8601 string",
      "startTime": "string",
      "endTime": "string",
      "location": "string",
      "maxGuests": "number",
      "isRequired": "boolean"
    }
  ],
  "guestGroups": [
    {
      "name": "string",
      "description": "string",
      "maxSize": "number|string",
      "color": "string"
    }
  ],
  "guests": [
    {
      "name": "string", // Required
      "email": "string",
      "phone": "string",
      "tag": "string",
      "group": "string",
      "gender": "string",
      "ageGroup": "string", 
      "guestType": "string", // "single", "multiple", "variable"
      "guestLimit": "number",
      "isPointOfContact": "boolean",
      "subEventRSVPs": "object" // Map of sub-event IDs to invitation status
    }
  ],
  "rsvpSettings": {
    "pageTitle": "string",
    "subtitle": "string", 
    "welcomeMessage": "string",
    "theme": "string",
    "fontFamily": "string",
    "backgroundColor": "string",
    "textColor": "string",
    "primaryColor": "string",
    "customQuestions": "array",
    "backgroundImage": "string",
    "backgroundOverlay": "number"
  },
  "emailTemplates": [
    {
      "title": "string",
      "subtitle": "string",
      "body": "string",
      "greeting": "string", 
      "signoff": "string",
      "sender_name": "string",
      "subject_line": "string",
      "category": "string",
      "status": "string",
      "description": "string",
      "primary_color": "string",
      "secondary_color": "string",
      "text_color": "string"
    }
  ],
  "allowDuplicates": "boolean" // Allow duplicate guest creation
}
```

**Request Examples**:

*Creating a new event*:
```javascript
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Wedding Celebration",
    description: "Join us for our special day",
    startDate: "2024-06-15T15:00:00Z",
    endDate: "2024-06-15T23:00:00Z",
    location: "Grand Ballroom",
    eventType: "wedding",
    status: "draft",
    subEvents: [
      {
        title: "Ceremony",
        date: "2024-06-15",
        startTime: "15:00",
        endTime: "16:00",
        location: "Chapel",
        isRequired: true
      }
    ],
    guests: [
      {
        name: "John Doe",
        email: "john@example.com", 
        group: "Family",
        guestType: "single",
        isPointOfContact: true
      }
    ]
  })
});
```

*Updating an existing event*:
```javascript
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    public_id: "event-123",
    title: "Updated Wedding Celebration",
    status: "published"
  })
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "event": {
    "id": "number",
    "public_id": "string",
    "title": "string"
  },
  "id": "number",
  "eventId": "number", 
  "action": "string", // "draft" or "published"
  "message": "string",
  "timestamp": "ISO 8601 string"
}
```

**Special Response - Duplicate Detection**:
When duplicates are found and `allowDuplicates` is false:
```javascript
{
  "success": false,
  "duplicatesFound": true,
  "duplicates": [
    {
      "type": "string", // "within_new_list" or "existing_guest"
      "guestName": "string",
      "groupTitle": "string",
      "existingGuestId": "number", // For existing_guest type
      "newGuestFrontendIndex": "number"
    }
  ],
  "message": "Duplicate guests detected among new guests. Please confirm if you want to proceed."
}
```

**Frontend Usage**:
- `src/app/create-event/page.js:213` - Draft saving
- `src/app/create-event/page.js:248` - Publishing events
- `src/app/create-event/page.js:283` - Form submissions
- `src/app/[eventID]/components/EmailTemplateEditor.jsx:160` - Template updates

### DELETE /api/events

Deletes an event and all related data.

**Authentication**: Required (Bearer token + Event ownership)

**Query Parameters**:
- `eventId` (number, required): The internal ID of the event to delete

**Request Example**:
```javascript
const response = await fetch(`/api/events?eventId=${eventId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "message": "Event deleted successfully"
}
```

**Frontend Usage**: Currently not directly used but available for event management features.

## Business Logic

### Event Creation Flow
1. **Validation**: Validates required fields (title minimum)
2. **Event Record**: Creates/updates main event record
3. **Manager Assignment**: Links authenticated user as event owner
4. **Sub-events**: Creates/updates/deletes sub-events
5. **Guest Groups**: Auto-creates groups from guest assignments
6. **Guest Processing**: Creates guests with type validation and duplicate checking
7. **RSVP Setup**: Creates invitation records linking guests to sub-events
8. **Email Templates**: Stores customizable email templates
9. **Landing Page**: Configures RSVP page settings

### Duplicate Detection
- Checks for duplicate guests within the new guest list
- Checks against existing guests for the event
- Provides detailed duplicate information for frontend handling
- Allows override with `allowDuplicates` flag

### Guest Types
- **Single**: Fixed 1 guest limit
- **Multiple**: Requires specific guest limit (1+)  
- **Variable**: Unlimited guests (null limit)

### Data Relationships
The endpoint manages complex relationships:
- Events → Sub-events (1:N)
- Events → Guest Groups (1:N) 
- Guest Groups → Guests (1:N)
- Guests ↔ Sub-events (N:N via RSVPs)
- Events → Email Templates (1:N)
- Events → Landing Page Config (1:1)

## Error Handling

**Common Errors**:
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Event not found or user lacks access
- `400 Bad Request`: Missing required fields or validation errors
- `500 Internal Server Error`: Database or processing errors

**Error Response Example**:
```javascript
{
  "error": "Event title is required",
  "details": "Additional context (development only)",
  "timestamp": "ISO 8601 string"
}
```

## Database Tables Affected

- `events` - Main event data
- `event_managers` - User-event relationships
- `subevents` - Individual event functions
- `guest_groups` - Guest organization
- `guests` - Individual guest records
- `rsvps` - Guest invitation/response tracking
- `email_templates` - Email content management
- `landing_page_configs` - RSVP page customization

## Performance Considerations

- Large guest lists may require pagination in future versions
- Complex data transformations may impact response times
- Consider using database transactions for data consistency
- Image URL handling integrates with separate upload endpoints