# Guest List API Endpoint

**Endpoint**: `/api/[eventID]/guestList`

**Description**: Provides comprehensive guest list management for events. This endpoint handles bulk guest retrieval with detailed information including RSVP status, group assignments, and contact details. Designed for event management dashboards and guest overview interfaces.

## Endpoints

### GET /api/[eventID]/guestList

Retrieves complete guest list for an event with detailed information.

**Authentication**: Required (Bearer token + Event manager access)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Query Parameters**:
- `password` (string, optional): Event password for additional verification (legacy parameter)

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/guestList`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response Schema**:
```javascript
{
  "validated": true,
  "allUsers": [
    {
      "id": "number", // Database ID
      "public_id": "string", // UUID identifier
      "name": "string",
      "email": "string|null",
      "phone": "string|null",
      "tag": "string|null",
      "point_of_contact": "boolean",
      "group": "string", // Group title
      "group_id": "number",
      "gender": "string", // "male", "female", "other"
      "gender_id": "number",
      "ageGroup": "string",
      "age_group_id": "number", 
      "guest_type": "string", // "single", "multiple", "variable"
      "guest_limit": "number|null", // null for variable type
      "rsvp_status": {
        "[Sub-event Title]": {
          "status_id": "number",
          "status_name": "string", // "pending", "attending", "not_attending", etc.
          "response": "number|null" // Guest count response
        }
      },
      "total_rsvps": "number" // Count of sub-events guest is invited to
    }
  ],
  "event": {
    "id": "number",
    "public_id": "string",
    "title": "string", 
    "status_id": "number"
  },
  "total_guests": "number"
}
```

**RSVP Status Mapping**:
```javascript
const statusMap = {
  1: "pending",     // Invited but no response
  2: "opened",      // Viewed invitation  
  3: "attending",   // Confirmed attendance
  4: "not_attending", // Declined
  5: "maybe",       // Tentative
  6: "no_response"  // No response received
};
```

**Frontend Usage**:
- `src/app/[eventID]/portal/page.js:28` - Loading guest data for event portal
- `src/app/[eventID]/portal/page.js:94` - Refreshing guest list after updates
- Event management dashboards
- Guest list export functionality

### POST /api/[eventID]/guestList

Updates guest list information (placeholder implementation).

**Authentication**: Required (Bearer token + Event manager access)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Request Body Schema**:
```javascript
{
  "event": "object", // Event context
  "guestList": "array" // Guest list updates
}
```

**Response Schema**:
```javascript
{
  "validated": true,
  "message": "Guest list updated successfully"
}
```

**Note**: This endpoint currently returns a success message but doesn't implement actual update logic. Full implementation would handle bulk guest updates.

## Data Relationships

### Guest Information Structure
The endpoint provides a comprehensive view by joining multiple tables:

```sql
SELECT guests.*, 
       guest_groups.title as group_title,
       guest_gender.state as gender,
       guest_age_group.state as age_group,
       guest_type.name as guest_type_name,
       rsvps.* with subevents.title
FROM guests
INNER JOIN guest_groups ON guests.group_id = guest_groups.id  
LEFT JOIN guest_gender ON guests.gender_id = guest_gender.id
LEFT JOIN guest_age_group ON guests.age_group_id = guest_age_group.id
LEFT JOIN guest_type ON guests.guest_type_id = guest_type.id
LEFT JOIN rsvps ON guests.id = rsvps.guest_id
WHERE guest_groups.event_id = ?
```

### RSVP Status Aggregation
The response includes aggregated RSVP information:
- **Per Sub-event**: Status and response count for each sub-event
- **Total Count**: Number of sub-events guest is invited to
- **Status Names**: Human-readable status descriptions

## Authentication & Authorization

### Access Control Flow
1. **Token Extraction**: Retrieves Bearer token from Authorization header
2. **User Verification**: Validates token with Supabase and gets user profile
3. **Event Access**: Verifies event exists and user has manager access
4. **Manager Validation**: Checks `event_managers` table for permissions

### Permission Requirements
- Must be authenticated user with valid session
- Must be listed as manager for the specific event
- Event must exist and be accessible to the user

**Authorization Example**:
```javascript
// Check manager access
const { data: managers } = await supabase
  .from("event_managers") 
  .select("*")
  .eq("event_id", event.id)
  .eq("user_id", currentUser.id)
  .limit(1);

if (!managers || managers.length === 0) {
  return { validated: false, message: "Access denied" };
}
```

## Business Logic

### Guest Data Transformation
The endpoint transforms database records into frontend-friendly format:

```javascript
// Transform raw guest data
const transformedUsers = allGuests?.map((guest) => ({
  id: guest.id,
  public_id: guest.public_id,
  name: guest.name,
  email: guest.email,
  phone: guest.phone,
  tag: guest.tag,
  point_of_contact: guest.point_of_contact,
  group: guest.guest_groups?.title,
  group_id: guest.guest_groups?.id,
  gender: guest.guest_gender?.state,
  ageGroup: guest.guest_age_group?.state,
  guest_type: guest.guest_type?.name,
  guest_limit: guest.guest_limit,
  
  // RSVP status aggregation
  rsvp_status: guest.rsvps?.reduce((acc, rsvp) => {
    if (rsvp.subevents) {
      acc[rsvp.subevents.title] = {
        status_id: rsvp.status_id,
        status_name: getStatusName(rsvp.status_id),
        response: rsvp.response,
      };
    }
    return acc;
  }, {}) || {},
  
  total_rsvps: guest.rsvps?.length || 0,
}));
```

### Filtering and Sorting
- **Event Filtering**: Only returns guests belonging to the specified event
- **Name Sorting**: Results ordered alphabetically by guest name  
- **Group Context**: Maintains group relationship information

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

**Database Errors**:
```javascript
{
  "error": "Failed to fetch guest list",
  "message": "Database connection error details"
}
```

## Performance Considerations

### Query Optimization
- **Single Query**: Uses JOINs to fetch all related data in one request
- **Selective Fields**: Only fetches required columns for display
- **Proper Indexing**: Relies on database indexes for efficient filtering

### Response Size Management
- **Large Guest Lists**: May need pagination for events with 1000+ guests
- **Data Minimization**: Could implement field selection to reduce payload
- **Caching**: Consider caching for frequently accessed guest lists

### Database Load
```javascript
// Efficient data loading pattern
const { data: allGuests } = await supabase
  .from("guests")
  .select(`
    id, public_id, name, email, phone, tag, point_of_contact, group_id,
    guest_groups!inner (id, title, event_id),
    guest_gender (id, state),
    guest_age_group (id, state), 
    rsvps (subevent_id, status_id, response, subevents (id, title)),
    guest_type (id, name),
    guest_limit
  `)
  .eq("guest_groups.event_id", event.id)
  .order("name");
```

## Use Cases

### Event Management Dashboard
```javascript
// Load guest list for dashboard
const { allUsers, total_guests } = await fetchGuestList(eventID);

// Display summary statistics
console.log(`Total Guests: ${total_guests}`);
console.log(`Confirmed: ${allUsers.filter(g => hasConfirmed(g)).length}`);
console.log(`Pending: ${allUsers.filter(g => isPending(g)).length}`);
```

### Export Functionality  
```javascript
// Prepare data for CSV export
const exportData = allUsers.map(guest => ({
  Name: guest.name,
  Email: guest.email,
  Phone: guest.phone,
  Group: guest.group,
  Status: getOverallStatus(guest.rsvp_status)
}));
```

### Communication Targeting
```javascript
// Filter guests for specific communications
const pocGuests = allUsers.filter(g => g.point_of_contact);
const pendingGuests = allUsers.filter(g => isPending(g.rsvp_status));
const attendingGuests = allUsers.filter(g => isAttending(g.rsvp_status));
```

## Database Tables Accessed

**Primary Tables**:
- `guests` - Main guest records
- `guest_groups` - Group organization and event relationship
- `rsvps` - RSVP responses and invitations
- `subevents` - Sub-event information for RSVP context

**Lookup Tables**:
- `guest_gender` - Gender classifications
- `guest_age_group` - Age group classifications
- `guest_type` - Guest type definitions

**Authorization Tables**:
- `events` - Event verification
- `event_managers` - Access control
- `users` - User profile information

## Integration Notes

### Frontend State Management
The guest list data typically feeds into:
- Guest management tables/grids
- Communication targeting interfaces  
- RSVP status dashboards
- Export and reporting tools

### Real-time Updates
Consider implementing WebSocket or Supabase real-time subscriptions for live guest list updates when multiple managers are working simultaneously.

### Caching Strategy
For large events, implement caching:
```javascript
// Cache key example
const cacheKey = `guestlist:${eventID}:${lastModified}`;
```

## Related Endpoints

- [`POST /api/[eventID]/guests`](./guests.md) - Bulk guest creation
- [`GET /api/[eventID]/guests/[guestId]`](./guests-detail.md) - Individual guest management
- [`GET/POST /api/[eventID]/rsvp`](./rsvp.md) - RSVP status management
- [`POST /api/[eventID]/sendMail`](./send-mail.md) - Guest communication