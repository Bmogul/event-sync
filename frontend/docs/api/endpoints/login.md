# Login API Endpoint

**Endpoint**: `/api/[eventID]/login`

**Description**: Validates event access and password authentication for public event pages. This endpoint handles access control for private events and ensures only authorized users can access event details and RSVP functionality.

## Endpoints

### POST /api/[eventID]/login

Validates access to a specific event, checking if the event is published and handling password authentication for private events.

**Authentication**: None required (public endpoint)

**URL Parameters**:
- `eventID` (string, required): The public identifier of the event

**Request Body Schema**:
```javascript
{
  "password": "string" // Required for private events, ignored for public events
}
```

**Request Example**:
```javascript
const response = await fetch(`/api/${eventID}/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    password: "guest-access-123"
  })
});
```

**Response Schema**:
```javascript
{
  "validated": "boolean", // Whether access is granted
  "event": {
    "id": "number", // Internal event ID
    "public_id": "string", // Public event identifier
    "title": "string", // Event title
    "is_private": "boolean" // Whether event requires password
  },
  "message": "string" // Error message if validation fails
}
```

**Success Response Example**:
```javascript
{
  "validated": true,
  "event": {
    "id": 123,
    "public_id": "wedding-2024",
    "title": "John & Jane's Wedding",
    "is_private": true
  }
}
```

**Error Response Examples**:
```javascript
// Invalid password
{
  "validated": false,
  "message": "Invalid password"
}

// Event not published
{
  "validated": false,
  "message": "Event is not available"
}

// Event not found
{
  "error": "Event not found"
}
```

**Frontend Usage**: This endpoint would typically be used on public event access pages, though specific frontend usage is not visible in the current codebase.

## Business Logic

### Event Validation Flow
1. **Event Lookup**: Retrieve event by public ID
2. **Publication Check**: Verify event is published (status_id = 2)
3. **Privacy Check**: Determine if password is required
4. **Password Validation**: Validate password for private events
5. **Access Grant**: Return event information if validation passes

### Event Status Validation
```javascript
// Check if event is published
if (event.status_id !== 2) { // 2 = published
  return NextResponse.json({ 
    validated: false, 
    message: "Event is not available" 
  }, { status: 200 });
}
```

### Privacy and Password Handling
```javascript
// If event is not private, no password needed
if (!event.is_private) {
  return NextResponse.json({ 
    validated: true,
    event: {
      id: event.id,
      public_id: event.public_id,
      title: event.title,
      is_private: event.is_private
    }
  }, { status: 200 });
}

// For private events, check password
const isValidPassword = event.access_password === password;
```

### Response Data Structure
The endpoint returns minimal event information to prevent data leakage:
```javascript
const eventResponse = {
  id: event.id,
  public_id: event.public_id,
  title: event.title,
  is_private: event.is_private
};
```

## Access Control Model

### Public Events
- **No Password Required**: Anyone with the event URL can access
- **Published Status Required**: Event must be published by organizer
- **Immediate Access**: Returns event information directly

### Private Events  
- **Password Protected**: Requires correct password for access
- **Password Storage**: Passwords stored as plain text in `access_password` field
- **Security Note**: Current implementation uses plain text password comparison

### Event Status Requirements
- **Draft Events**: Not accessible via this endpoint (status_id = 1)
- **Published Events**: Accessible based on privacy settings (status_id = 2)
- **Other Statuses**: Treated as unavailable

## Security Considerations

### Current Implementation
```javascript
// Direct password comparison (plain text)
const isValidPassword = event.access_password === password;
```

### Security Limitations
- **Plain Text Storage**: Passwords are stored and compared as plain text
- **No Rate Limiting**: No protection against brute force attacks
- **No Session Management**: Each request requires password re-entry
- **No Audit Logging**: Failed attempts are not tracked

### Recommended Security Enhancements
1. **Password Hashing**: Hash passwords using bcrypt or similar
2. **Rate Limiting**: Implement attempt limits per IP/event
3. **Session Tokens**: Issue short-lived tokens after successful authentication
4. **Audit Logging**: Log all authentication attempts
5. **Password Complexity**: Enforce minimum password requirements

## Database Schema

### Events Table Fields Used
```sql
-- Fields accessed by this endpoint
events {
  id: integer,
  public_id: varchar,
  title: varchar,
  access_password: varchar, -- Plain text password
  is_private: boolean,
  status_id: integer -- 1=draft, 2=published
}
```

### No Session Storage
The current implementation doesn't store session information, requiring password validation on each request.

## Error Handling

### Event Not Found
```javascript
if (eventError || !event) {
  return NextResponse.json({ 
    error: "Event not found" 
  }, { status: 404 });
}
```

### Event Not Available
```javascript
if (event.status_id !== 2) {
  return NextResponse.json({ 
    validated: false, 
    message: "Event is not available" 
  }, { status: 200 });
}
```

### Invalid Password
```javascript
if (!isValidPassword) {
  return NextResponse.json({ 
    validated: false,
    message: "Invalid password"
  }, { status: 200 });
}
```

### Missing Data
```javascript
if (!password || !eventID) {
  return NextResponse.json({ 
    error: "Missing password or event ID" 
  }, { status: 400 });
}
```

## Integration Patterns

### Typical Usage Flow
1. **Landing Page**: User visits public event URL
2. **Privacy Check**: System checks if event requires password
3. **Password Prompt**: Show password form for private events
4. **Validation**: Call this endpoint with password
5. **Access Grant**: Redirect to event details/RSVP if successful
6. **Error Handling**: Show error message if validation fails

### Frontend Integration Example
```javascript
const validateEventAccess = async (eventID, password = '') => {
  try {
    const response = await fetch(`/api/${eventID}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password })
    });

    const result = await response.json();
    
    if (result.validated) {
      // Access granted - proceed to event content
      return { success: true, event: result.event };
    } else {
      // Access denied - show error message
      return { success: false, message: result.message };
    }
  } catch (error) {
    return { success: false, message: 'Connection error' };
  }
};
```

### State Management
```javascript
// Typical frontend state for event access
const [accessState, setAccessState] = useState({
  isValidated: false,
  isPrivate: null,
  requiresPassword: false,
  event: null,
  error: null
});
```

## Performance Considerations

### Database Queries
- **Single Query**: Only one database lookup per request
- **Minimal Data**: Returns only essential event information
- **No Complex Joins**: Simple event table lookup

### Response Time
- **Fast Validation**: Simple password comparison
- **Lightweight Response**: Minimal data transfer
- **No External Dependencies**: Self-contained validation

## Use Cases

### Public Event Access
```javascript
// For public events, password can be empty
const result = await validateEventAccess(eventID, '');
if (result.success && !result.event.is_private) {
  // Direct access to event content
}
```

### Private Event Access  
```javascript
// For private events, password is required
const result = await validateEventAccess(eventID, userPassword);
if (result.success) {
  // Access granted - show event content
} else {
  // Show password prompt with error message
}
```

### Event Status Checking
```javascript
// Check if event is available without password
const result = await validateEventAccess(eventID, '');
if (!result.success && result.message === "Event is not available") {
  // Event is not published or doesn't exist
}
```

## Related Endpoints

- [`GET /api/events/[eventID]`](./events-detail.md) - Get public event information
- [`GET /api/[eventID]/rsvp`](./rsvp.md) - Access RSVP form (may require prior login validation)

## Best Practices

### Frontend Implementation
- Cache validation results for session duration
- Provide clear feedback for password requirements
- Handle network errors gracefully
- Implement password visibility toggle for user experience

### Security Best Practices
- Implement rate limiting for password attempts
- Use HTTPS for all authentication requests
- Consider implementing session tokens
- Log authentication attempts for security monitoring

### User Experience
- Show loading states during validation
- Provide helpful error messages
- Remember successful validation during session
- Implement password strength requirements for event creation

## Future Enhancements

### Security Improvements
- Hash password storage with salt
- Implement session token system
- Add rate limiting and IP blocking
- Audit logging for access attempts

### Feature Additions
- Multiple password support (different access levels)
- Time-based access control (event availability windows)
- Guest list-based access (invite-only events)
- Social authentication integration

### Performance Optimizations
- Cache validation results
- Implement CDN for static event information
- Add response compression
- Optimize database queries with indexes