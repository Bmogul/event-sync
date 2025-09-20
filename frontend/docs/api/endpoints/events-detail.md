# Event Details API Endpoint

**Endpoint**: `/api/events/[eventID]`

**Description**: Retrieves detailed information about a specific event using the event's public ID. This endpoint returns event data in a legacy format compatible with older components and provides core event information along with sub-events and landing page configuration.

## Endpoints

### GET /api/events/[eventID]

Retrieves public event information by event public ID.

**Authentication**: None required (public endpoint)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Request Example**:
```javascript
const response = await fetch(`/api/events/${eventID}`);
```

**Response Schema**:
```javascript
{
  "eventID": "string", // Public ID of the event
  "eventTitle": "string",
  "description": "string",
  "startDate": "ISO 8601 string",
  "endDate": "ISO 8601 string", 
  "capacity": "number",
  "totalYes": "number", // Total confirmed attendees
  "status": "number", // Status ID (1=draft, 2=published)
  "details": "object", // Additional event details JSON
  "logo": "string", // Logo URL
  "hero": "string", // Hero image URL
  "background": "string", // Background image URL
  "numberOfFunctions": "number", // Count of sub-events
  "landingConfig": {
    "id": "number",
    "title": "string",
    "landing_page_url": "string",
    "logo": "string",
    "cards": "object",
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
    "status": "string",
    "custom_css": "string",
    "created_at": "ISO 8601 string",
    "updated_at": "ISO 8601 string",
    "published_at": "ISO 8601 string",
    "deleted_at": "ISO 8601 string"
  },
  "email_message": "string", // Legacy email message field
  
  // Dynamic sub-event properties (legacy format)
  "func0": {
    "funcNum": 0,
    "funcTitle": "string",
    "cardLink": "string", // Image URL
    "date": "string", // Formatted date/time
    "location": "string",
    "capacity": "number",
    "details": "object"
  },
  "func1": {
    // Additional sub-events follow same pattern
  }
  // ... continues for all sub-events
}
```

**Date Formatting**:
The endpoint includes a helper function that formats dates:
```javascript
function formatDateTime(date, time) {
  // Returns format like: "3:00 PM, Saturday, June 15, 2024"
  // Or "Date TBD" if no date provided
}
```

**Request Example**:
```javascript
// Get event details for display
const response = await fetch(`/api/events/wedding-2024`);
const eventData = await response.json();

console.log(eventData.eventTitle); // "Wedding Celebration"
console.log(eventData.func0.funcTitle); // "Ceremony"
console.log(eventData.numberOfFunctions); // 3
```

**Frontend Usage**:
- `src/app/[eventID]/portal/page.js:59` - Loading event data in portal
- `src/app/[eventID]/components/GuestForm.js:43` - Getting event context for forms

## Legacy Format Considerations

This endpoint maintains compatibility with older frontend components that expect:

1. **Dynamic Function Properties**: Sub-events are returned as `func0`, `func1`, etc.
2. **Specific Field Names**: Uses camelCase naming different from database schema
3. **Formatted Dates**: Includes human-readable date formatting
4. **Flattened Structure**: Some nested data is flattened for easier access

## Response Data Transformation

The endpoint performs several transformations:

### Event Data Mapping
```javascript
// Database → API Response
{
  public_id → eventID,
  title → eventTitle,
  start_date → startDate,
  logo_url → logo,
  hero_url → hero,
  background_image_url → background
}
```

### Sub-events Processing
```javascript
// Creates numbered function objects
subEvents.forEach((subEvent, index) => {
  response[`func${index}`] = {
    funcNum: index,
    funcTitle: subEvent.title,
    cardLink: subEvent.details?.image || null,
    date: formatDateTime(subEvent.event_date, subEvent.start_time),
    location: subEvent.venue_address,
    capacity: subEvent.capacity,
    details: subEvent.details
  };
});
```

### Landing Config Access
The first landing page configuration is exposed directly as `landingConfig`, with the email message also available as `email_message` for backward compatibility.

## Database Tables Accessed

- `events` - Main event information
- `subevents` - Event functions/sub-events
- `landing_page_configs` - Landing page and RSVP settings

## Error Handling

**Common Errors**:
- `404 Not Found`: Event doesn't exist or is not accessible
- `500 Internal Server Error`: Database connection or processing errors

**Error Response Format**:
```javascript
{
  "error": "Event not found"
}
```

**Error Example**:
```javascript
{
  "error": "Internal server error"
}
```

## Performance Notes

- This endpoint is optimized for read-only access
- Includes related data in single query to minimize database calls
- Date formatting is performed server-side for consistency
- No authentication required makes it suitable for public event pages

## Migration Notes

For new development, consider using the main `/api/events` endpoint which provides:
- Consistent data structure
- Authentication context
- More complete data relationships
- Modern JSON API conventions

This endpoint is maintained for backward compatibility with existing components that rely on the legacy format.