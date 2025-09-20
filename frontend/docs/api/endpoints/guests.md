# Guests API Endpoint

**Endpoint**: `/api/[eventID]/guests`

**Description**: Manages guest creation and group organization for events. This endpoint handles bulk guest creation with automatic group management, guest type validation, and sub-event invitation setup.

## Endpoints

### POST /api/[eventID]/guests

Creates multiple guests and their associated groups for an event.

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
  "guests": [
    {
      "name": "string", // Required
      "email": "string", // Optional but recommended
      "phone": "string", // Optional
      "tag": "string", // Optional custom tag
      "group": "string", // Group name, auto-creates if needed
      "gender": "string", // "male", "female", "other"
      "ageGroup": "string", // Age group classification
      "guestType": "string", // "single", "multiple", "variable"
      "guestLimit": "number", // Required for "multiple" type
      "isPointOfContact": "boolean", // Designate as group POC
      "subEventInvitations": ["number"] // Array of sub-event IDs to invite to
    }
  ],
  "event": "object" // Event context (optional)
}
```

**Guest Type Details**:

1. **Single**: 
   - Fixed limit of 1 guest
   - `guestLimit` is ignored and set to 1
   - Suitable for individual invitations

2. **Multiple**: 
   - Requires specific `guestLimit` (must be >= 0)
   - Fixed maximum number of attendees
   - Validation ensures limit is provided

3. **Variable**: 
   - Unlimited guests (null limit in database)
   - `guestLimit` is ignored and set to null
   - Allows flexible attendance numbers

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/guests`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guests: [
      {
        name: "John Smith",
        email: "john@example.com",
        phone: "+1234567890",
        group: "Family",
        gender: "male",
        ageGroup: "adult",
        guestType: "multiple",
        guestLimit: 2,
        isPointOfContact: true,
        subEventInvitations: [1, 2, 3]
      },
      {
        name: "Jane Smith", 
        email: "jane@example.com",
        group: "Family",
        gender: "female",
        guestType: "single",
        isPointOfContact: false,
        subEventInvitations: [1, 2]
      }
    ]
  })
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "guests": [
    {
      "id": "number", // Database ID
      "group_id": "number",
      "public_id": "string", // UUID for public references
      "name": "string",
      "email": "string|null",
      "phone": "string|null", 
      "tag": "string|null",
      "gender_id": "number|null",
      "age_group_id": "number|null",
      "guest_type_id": "number",
      "guest_limit": "number|null", // null for variable type
      "point_of_contact": "boolean"
    }
  ],
  "groups": [
    {
      "id": "number",
      "event_id": "number", 
      "title": "string",
      "size_limit": "number", // -1 for unlimited
      "status_id": "number",
      "details": {
        "color": "string",
        "description": "string"
      }
    }
  ]
}
```

**Frontend Usage**:
- `src/app/[eventID]/components/emailPortal.js:465` - Creating guests from CSV or form input
- `src/app/[eventID]/components/GuestForm.js:129` - Adding new guests through forms

## Business Logic

### Group Management
1. **Auto-Creation**: Groups are automatically created based on guest assignments
2. **Individual Fallback**: Guests without groups get individual groups: `"${guestName} (Individual)"`
3. **Group Properties**: All groups created with unlimited size (-1) and draft status
4. **Color Assignment**: Default purple color (#7c3aed) assigned to new groups

### Guest Type Validation
```javascript
// Single type validation
if (guestType === "single") {
  guestLimit = 1; // Always 1
}

// Multiple type validation  
if (guestType === "multiple") {
  if (!guestLimit || guestLimit < 0) {
    throw Error("Guest limit required for multiple type");
  }
  guestLimit = parseInt(guestLimit);
}

// Variable type validation
if (guestType === "variable") {
  guestLimit = null; // Unlimited
}
```

### Lookup Table Integration
The endpoint integrates with several lookup tables:
- `guest_gender` - Maps gender strings to IDs
- `guest_age_group` - Maps age group strings to IDs  
- `guest_type` - Maps guest type names to IDs

**Gender Mapping**:
```javascript
// Accepted values (case-insensitive)
"male", "m" → "male" 
"female", "f" → "female"
"other" → "other"
```

### RSVP Invitation Setup
When `subEventInvitations` are provided:
1. Creates RSVP records linking guests to sub-events
2. Sets status to "invited" (status_id: 1)
3. Records creation timestamp
4. Validates sub-event IDs exist

### Authentication Flow
1. **Token Validation**: Validates Bearer token with Supabase
2. **User Profile**: Retrieves user profile from database
3. **Event Access**: Verifies user is event manager through `event_managers` table
4. **Permissions**: Ensures user has create/edit access to event

## Error Handling

**Validation Errors**:
```javascript
// Missing guest limit for multiple type
{
  "error": "Validation error for guest John Smith: Guest limit is required for multiple guest type and must be >= 0"
}
```

**Authentication Errors**:
```javascript
{
  "validated": false,
  "message": "Access denied - you are not a manager of this event"
}
```

**Common Error Scenarios**:
- Missing authorization token (401)
- Invalid or expired token (401)
- User not event manager (403)  
- Event not found (404)
- Missing guest names (400)
- Invalid guest type configuration (400)
- Database constraint violations (500)

## Database Tables Affected

**Primary Operations**:
- `guest_groups` - Creates groups automatically
- `guests` - Creates guest records with validation
- `rsvps` - Creates invitation records (optional)

**Lookup Tables**:
- `guest_gender` - Gender ID resolution
- `guest_age_group` - Age group ID resolution
- `guest_type` - Guest type ID resolution

**Validation Tables**:
- `events` - Event existence verification
- `event_managers` - Access permission verification

## Performance Considerations

- **Bulk Operations**: Handles multiple guests in single transaction
- **Lookup Caching**: Fetches lookup tables once per request
- **Error Handling**: Continues processing on individual guest failures
- **Group Deduplication**: Uses Map for efficient group deduplication

## Integration Notes

### CSV Import Compatibility
This endpoint is designed to work with CSV-imported guest data:
- Handles missing/optional fields gracefully
- Supports flexible group assignment
- Validates data types appropriately

### Frontend Form Integration  
Works with form builders that collect:
- Basic guest information (name, contact)
- Group assignments
- Guest type preferences
- Sub-event selections

### Point of Contact Management
- Only one POC per group recommended
- POC status used for primary communication
- POC guests typically get additional privileges

## Example Use Cases

**1. Family Group Creation**:
```javascript
{
  "guests": [
    {
      "name": "John Doe",
      "email": "john@doe.com", 
      "group": "Doe Family",
      "guestType": "multiple",
      "guestLimit": 4,
      "isPointOfContact": true
    },
    {
      "name": "Jane Doe",
      "group": "Doe Family", 
      "guestType": "single"
    }
  ]
}
```

**2. Individual Guests**:
```javascript
{
  "guests": [
    {
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "guestType": "variable" // Unlimited guests
    }
  ]
}
```

**3. Corporate Event**:
```javascript
{
  "guests": [
    {
      "name": "Company Representative",
      "email": "corp@company.com",
      "group": "Corporate Partners",
      "guestType": "multiple", 
      "guestLimit": 10,
      "tag": "VIP"
    }
  ]
}
```