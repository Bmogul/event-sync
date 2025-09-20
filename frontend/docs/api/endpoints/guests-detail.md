# Guest Details API Endpoint

**Endpoint**: `/api/[eventID]/guests/[guestId]`

**Description**: Manages individual guest operations including retrieval and updates. This endpoint provides detailed guest information with group context and handles guest-specific modifications.

## Endpoints

### GET /api/[eventID]/guests/[guestId]

Retrieves detailed information about a specific guest.

**Authentication**: Required (Bearer token + Event manager access)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event
- `guestId` (string, required): The guest's database ID

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/guests/${guestId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response Schema**:
```javascript
{
  "id": "number",
  "public_id": "string", // UUID identifier
  "name": "string",
  "email": "string|null",
  "phone": "string|null", 
  "tag": "string|null",
  "point_of_contact": "boolean",
  "group_id": "number",
  "guest_limit": "number|null", // null for variable type
  "group": {
    "id": "number",
    "title": "string",
    "event_id": "number"
  },
  "gender": {
    "id": "number",
    "state": "string" // "male", "female", "other"
  },
  "ageGroup": {
    "id": "number", 
    "state": "string"
  },
  "guestType": {
    "id": "number",
    "name": "string" // "single", "multiple", "variable"
  },
  "rsvps": [
    {
      "subevent_id": "number",
      "status_id": "number",
      "response": "number|null",
      "details": "object|null",
      "subevent": {
        "id": "number",
        "title": "string",
        "event_date": "string",
        "start_time": "string",
        "venue_address": "string",
        "capacity": "number"
      }
    }
  ]
}
```

**Frontend Usage**:
- `src/app/[eventID]/components/emailPortal.js:411` - Getting guest details for email operations
- Guest management forms and modal dialogs

### PUT /api/[eventID]/guests/[guestId]

Updates an existing guest's information.

**Authentication**: Required (Bearer token + Event manager access)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event  
- `guestId` (string, required): The guest's database ID

**Request Body Schema**:
```javascript
{
  "name": "string", // Optional - update guest name
  "email": "string", // Optional - update email
  "phone": "string", // Optional - update phone
  "tag": "string", // Optional - update custom tag
  "gender": "string", // Optional - "male", "female", "other"
  "ageGroup": "string", // Optional - age group classification
  "guestType": "string", // Optional - "single", "multiple", "variable"
  "guestLimit": "number", // Optional/Required for "multiple" type
  "point_of_contact": "boolean", // Optional - POC status
  "group": "string", // Optional - group name (creates if needed)
  "subEventInvitations": ["number"] // Optional - sub-event IDs to invite to
}
```

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/guests/${guestId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "John Smith Updated",
    email: "newemail@example.com",
    phone: "+1987654321",
    guestType: "multiple",
    guestLimit: 3,
    point_of_contact: true
  })
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "guest": {
    "id": "number",
    "public_id": "string",
    "name": "string",
    "email": "string|null",
    "phone": "string|null",
    "tag": "string|null",
    "group_id": "number",
    "guest_type_id": "number",
    "guest_limit": "number|null",
    "point_of_contact": "boolean",
    "updated_at": "ISO 8601 string"
  },
  "message": "Guest updated successfully"
}
```

**Frontend Usage**:
- `src/app/[eventID]/components/GuestForm.js:99` - Updating existing guests through forms
- Guest profile editing interfaces

### DELETE /api/[eventID]/guests/[guestId]

Removes a guest from the event.

**Authentication**: Required (Bearer token + Event manager access)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event
- `guestId` (string, required): The guest's database ID

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/guests/${guestId}`, {
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
  "message": "Guest deleted successfully"
}
```

**Cascade Behavior**:
- Removes associated RSVP records
- Updates group member counts
- Handles point of contact reassignment if needed

## Business Logic

### Guest Type Validation
When updating guest type, the same validation rules apply as creation:

```javascript
// Type-specific validation
switch (guestType) {
  case "single":
    guestLimit = 1; // Always 1
    break;
    
  case "multiple": 
    if (!guestLimit || guestLimit < 0) {
      throw Error("Guest limit required for multiple type");
    }
    guestLimit = parseInt(guestLimit);
    break;
    
  case "variable":
    guestLimit = null; // Unlimited
    break;
}
```

### Group Management
- **Group Changes**: If group name changes, guest is moved to new/existing group
- **Auto-Creation**: New groups created automatically if they don't exist
- **POC Transfer**: When POC status changes, validation ensures proper assignment

### RSVP Update Handling
When `subEventInvitations` is provided:
1. **Current RSVPs**: Fetches existing RSVP records
2. **Additions**: Creates new invitation records for new sub-events
3. **Removals**: Removes RSVP records for sub-events no longer invited to
4. **Preservation**: Maintains existing responses for continuing invitations

### Lookup Table Updates
Updates integrate with lookup tables:
- Gender changes mapped through `guest_gender` table
- Age group changes mapped through `guest_age_group` table
- Guest type changes mapped through `guest_type` table

## Authentication & Authorization

### Access Control Flow
1. **Token Validation**: Verifies Bearer token with Supabase auth
2. **User Profile**: Retrieves authenticated user's profile
3. **Event Verification**: Confirms event exists and is accessible
4. **Manager Check**: Validates user is event manager via `event_managers` table
5. **Guest Ownership**: Ensures guest belongs to the specified event

### Permission Levels
- **Event Owner**: Full guest management access
- **Event Manager**: Based on role permissions in `event_managers`
- **Collaborator**: May have restricted access based on role configuration

## Error Handling

**Authentication Errors**:
```javascript
{
  "validated": false,
  "message": "Access denied - you are not a manager of this event"
}
```

**Validation Errors**:
```javascript
{
  "error": "Guest limit is required for multiple guest type",
  "field": "guestLimit",
  "provided_value": null
}
```

**Not Found Errors**:
```javascript
{
  "error": "Guest not found",
  "guest_id": 123,
  "event_id": "wedding-2024"
}
```

**Database Errors**:
```javascript
{
  "error": "Database constraint violation",
  "details": "Email already exists for another guest in this event"
}
```

## Database Tables Affected

**Primary Tables**:
- `guests` - Main guest record updates
- `guest_groups` - Group assignments and POC management
- `rsvps` - Invitation/response record management

**Lookup Tables**:
- `guest_gender` - Gender ID resolution
- `guest_age_group` - Age group ID resolution  
- `guest_type` - Guest type ID resolution

**Validation Tables**:
- `events` - Event existence verification
- `event_managers` - Access permission verification

## Performance Considerations

- **Single Record Operations**: Optimized for individual guest updates
- **Relationship Loading**: Efficiently loads related data (groups, RSVPs)
- **Cascade Updates**: Handles related record updates in transactions
- **Lookup Caching**: Could benefit from lookup table caching for frequent updates

## Integration Patterns

### Form Integration
```javascript
// Guest editing form submit
const handleGuestUpdate = async (formData) => {
  const response = await fetch(`/api/${eventID}/guests/${guestId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });
  
  if (response.ok) {
    // Update local state, show success message
    updateGuestInList(await response.json());
  }
};
```

### Bulk Update Coordination
When updating multiple guests:
```javascript
// Update guests sequentially to avoid conflicts
for (const guest of guestsToUpdate) {
  await fetch(`/api/${eventID}/guests/${guest.id}`, {
    method: 'PUT',
    body: JSON.stringify(guest.updates)
  });
}
```

## Security Considerations

- **Data Validation**: All input fields validated and sanitized
- **Access Control**: Strict event manager verification
- **SQL Injection**: Parameterized queries prevent injection attacks
- **Rate Limiting**: Consider implementing for bulk operations
- **Audit Trail**: Track changes for accountability (future enhancement)

## Related Endpoints

- [`POST /api/[eventID]/guests`](./guests.md) - Bulk guest creation
- [`GET /api/[eventID]/guestList`](./guest-list.md) - Complete guest listing
- [`GET/POST /api/[eventID]/rsvp`](./rsvp.md) - RSVP management