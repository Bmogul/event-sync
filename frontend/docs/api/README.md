# Event Sync API Documentation

## Overview

Event Sync is a Next.js application that provides a comprehensive event management platform. This documentation covers all API endpoints, their usage patterns, and integration points within the frontend application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Frontend Usage](#frontend-usage)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)

## Quick Start

All API endpoints are built using Next.js API routes and follow RESTful conventions where applicable. The base URL for all endpoints is relative to your application domain.

### Base URL Structure
```
/api/[endpoint]
/api/[eventID]/[endpoint]
```

### Common Headers
```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>" // Required for authenticated endpoints
}
```

## Authentication

Event Sync uses Supabase authentication. Most endpoints require authentication via:

1. **Bearer Token**: Include in Authorization header
2. **Event Access**: User must be an event manager or have proper access rights
3. **Event Password**: Some public endpoints require event password for private events

### Authentication Flow
```javascript
// Get user token from Supabase auth
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Include in API requests
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## API Endpoints

### Core Event Management
- [`GET/POST/PATCH/DELETE /api/events`](./endpoints/events.md) - Event CRUD operations with incremental updates
- [`GET /api/events/[eventID]`](./endpoints/events-detail.md) - Get specific event details

### Update Methods
Event Sync supports two update strategies:

#### Full Updates (Traditional)
- **Method**: `POST /api/events`
- **Payload**: Complete event data
- **Use Case**: New events, complete overwrites, fallback option
- **Performance**: Higher payload size, complete data replacement

#### Incremental Updates (Optimized)
- **Method**: `PATCH /api/events`
- **Payload**: Only changed fields
- **Use Case**: Event editing, frequent saves, large events
- **Performance**: Up to 90% smaller payloads, preserves unchanged data

```javascript
// Example: Incremental update (recommended for edits)
const changes = {
  mainEvent: { title: "Updated Title" },
  subEvents: { 
    modified: { 1: { location: "New Venue" } },
    added: [{ title: "New Session" }]
  },
  isPartialUpdate: true,
  conflictToken: "abc123"
};

await fetch('/api/events', {
  method: 'PATCH',
  body: JSON.stringify(changes)
});
```

### Guest Management
- [`POST /api/[eventID]/guests`](./endpoints/guests.md) - Create guests and groups
- [`GET /api/[eventID]/guests/[guestId]`](./endpoints/guests-detail.md) - Get/update specific guest
- [`GET/POST /api/[eventID]/guestList`](./endpoints/guest-list.md) - Manage complete guest lists

### RSVP System
- [`GET/POST /api/[eventID]/rsvp`](./endpoints/rsvp.md) - Handle RSVP responses and guest data

### Email Communication
- [`POST /api/[eventID]/sendMail`](./endpoints/send-mail.md) - Send invitations using templates
- [`POST /api/[eventID]/sendReminder`](./endpoints/send-reminder.md) - Send reminder emails
- [`POST /api/[eventID]/sendUpdate`](./endpoints/send-update.md) - Send event updates
- [`POST /api/[eventID]/remindeCountDown`](./endpoints/reminder-countdown.md) - Send countdown reminders

### Image Management
- [`POST /api/upload`](./endpoints/upload.md) - Upload event images (logos, backgrounds, sub-event images)
- [`POST /api/finalize-images`](./endpoints/finalize-images.md) - Move temporary images to permanent storage
- [`POST /api/cleanup-temp-images`](./endpoints/cleanup-temp-images.md) - Clean up unused temporary images

### Authentication & Access
- [`POST /api/[eventID]/login`](./endpoints/login.md) - Validate event access and passwords

## Frontend Usage

The API endpoints are called from various components throughout the frontend:

### Key Components Using APIs
- **Event Creation**: `/src/app/create-event/page.js` - Creates and updates events
- **Event Portal**: `/src/app/[eventID]/portal/page.js` - Manages guest lists
- **RSVP Pages**: `/src/app/[eventID]/rsvp/page.js` - Handles guest responses
- **Email Portal**: `/src/app/[eventID]/components/emailPortal.js` - Sends communications

### Common Usage Patterns

1. **Event Management Flow**:
   ```
   Create Event → Upload Images → Add Guests → Send Invitations → Manage RSVPs
   ```

2. **Guest RSVP Flow**:
   ```
   Event Access → Guest Lookup → RSVP Submission → Response Processing
   ```

3. **Image Upload Flow**:
   ```
   Temporary Upload → Event Save → Image Finalization → Cleanup
   ```

4. **Incremental Update Flow** (Recommended for edits):
   ```
   Load Event → Track Changes → Send Only Changes → Merge Updates → Update Local State
   ```

### Performance Considerations

#### Change Tracking
Event Sync implements client-side change tracking to optimize update operations:

- **Memory Usage**: Maintains original data copy for comparison
- **Network Efficiency**: Reduces payload sizes by 60-90% for large events
- **Conflict Detection**: Prevents overwrites from concurrent edits
- **Fallback Support**: Automatically falls back to full updates when needed

#### Best Practices
1. **Use incremental updates for event editing** (automatic in create-event flow)
2. **Enable change tracking early** in component lifecycle
3. **Monitor payload sizes** in development using debug info
4. **Handle conflicts gracefully** with user-friendly resolution options

```javascript
// Example: Using change tracking in components
const { getChanges, hasUnsavedChanges, markAsSaved } = useChangeTracking(eventData);

// Check for changes before navigation
if (hasUnsavedChanges()) {
  // Prompt user or auto-save
}

// Get performance metrics
const { reduction, fullSize, incrementalSize } = getPayloadSizeComparison();
console.log(`Payload reduction: ${reduction}%`);
```

## Data Models

### Core Entities
- **Events**: Main event data with details, dates, and settings
- **Sub-events**: Individual functions within an event
- **Guests**: Individual attendees with contact info and preferences
- **Guest Groups**: Collections of guests for organization
- **RSVPs**: Response data linking guests to sub-events
- **Email Templates**: Customizable email content for communications

### Key Relationships
```
Events (1) → (N) Sub-events
Events (1) → (N) Guest Groups (1) → (N) Guests
Guests (N) ← → (N) Sub-events (via RSVPs)
Events (1) → (N) Email Templates
```

## Error Handling

### Standard HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

### Error Response Format
```javascript
{
  "error": "Human readable error message",
  "details": "Additional error details (development only)",
  "validated": false, // For authentication endpoints
  "message": "Specific error context"
}
```

### Success Response Format
```javascript
{
  "success": true,
  "data": {}, // Response data
  "message": "Operation completed successfully"
}
```

## Development Notes

### Database Integration
- Uses Supabase as the backend database
- Row Level Security (RLS) policies enforce access control
- Real-time subscriptions available for live updates

### File Storage
- Images stored in Supabase Storage
- Temporary upload system for unsaved events
- Automatic cleanup of unused resources

### Email System
- SendGrid integration for email delivery
- Handlebars templating for email content
- Template management with database storage

## Getting Help

For questions about specific endpoints, refer to the detailed documentation in the `endpoints/` directory. Each endpoint includes:
- Request/response schemas
- Authentication requirements
- Code examples
- Frontend integration points
- Error scenarios

## Version History

- **v1.0** - Initial API implementation with core event management
- **Current** - Full feature set with advanced guest management and communications