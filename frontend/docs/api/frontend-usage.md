# Frontend API Usage Mapping

This document provides a comprehensive mapping of how each API endpoint is used throughout the frontend application, including the specific components, files, and usage patterns.

## Table of Contents

1. [Core Event Management](#core-event-management)
2. [Change Tracking Integration](#change-tracking-integration)
3. [Guest Management](#guest-management) 
4. [RSVP System](#rsvp-system)
5. [Email Communication](#email-communication)
6. [Image Management](#image-management)
7. [Authentication](#authentication)
8. [Usage Patterns](#usage-patterns)

## Core Event Management

### `/api/events` - Event CRUD Operations

**Frontend Files:**
- `src/app/create-event/page.js` - Primary event creation and editing interface
- `src/app/[eventID]/components/emailPortal.js` - Loading event data for email operations
- `src/app/[eventID]/components/EmailTemplateEditor.jsx` - Template management

**Usage Patterns:**

#### Event Loading (GET)
```javascript
// Loading existing event for editing
// File: src/app/create-event/page.js:163
const response = await fetch(`/api/events?public_id=${encodeURIComponent(publicId)}`);
```

#### Draft Saving (POST/PATCH - Adaptive)
```javascript
// Auto-save draft with incremental updates when editing
// File: src/app/create-event/page.js:402-459
const changes = useIncrementalUpdates ? changeTracking.getChanges() : null;
const shouldUseIncremental = changes && isEditMode;

const response = await fetch('/api/events', {
  method: shouldUseIncremental ? 'PATCH' : 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(shouldUseIncremental ? {
    ...changes.changes,
    public_id: eventData.public_id,
    status: 'draft',
    isPartialUpdate: true,
    conflictToken: changes.metadata.conflictToken
  } : {
    ...eventData,
    status: 'draft',
    isPartialUpdate: false
  })
});
```

#### Event Publishing (POST/PATCH - Adaptive)
```javascript
// Publishing completed event with incremental updates when editing
// File: src/app/create-event/page.js:461-536
const changes = useIncrementalUpdates ? changeTracking.getChanges() : null;
const shouldUseIncremental = changes && isEditMode;

const response = await fetch('/api/events', {
  method: shouldUseIncremental ? 'PATCH' : 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(shouldUseIncremental ? {
    ...changes.changes,
    public_id: eventData.public_id,
    status: 'published',
    isPartialUpdate: true,
    conflictToken: changes.metadata.conflictToken
  } : {
    ...eventData,
    status: 'published',
    isPartialUpdate: false
  })
});
```

#### Form Submission (POST)
```javascript
// Handle form submissions with validation
// File: src/app/create-event/page.js:283
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
});
```

### `/api/events/[eventID]` - Event Details

**Frontend Files:**
- `src/app/[eventID]/portal/page.js` - Event portal dashboard
- `src/app/[eventID]/components/GuestForm.js` - Guest management forms

**Usage Patterns:**

#### Portal Data Loading
```javascript
// Loading event details for portal
// File: src/app/[eventID]/portal/page.js:59
const response = await fetch(`/api/events/${params.eventID}`);
```

#### Guest Form Context
```javascript
// Getting event context for guest forms
// File: src/app/[eventID]/components/GuestForm.js:43
const response = await fetch(`/api/events/${eventID}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## Change Tracking Integration

### `useChangeTracking` Hook Usage

**Frontend Files:**
- `src/app/create-event/hooks/useChangeTracking.js` - Main change tracking implementation
- `src/app/create-event/page.js` - Integration with event creation/editing flow

**Usage Patterns:**

#### Hook Initialization
```javascript
// Setting up change tracking in main create-event component
// File: src/app/create-event/page.js:119-120
const changeTracking = useChangeTracking();
const [useIncrementalUpdates, setUseIncrementalUpdates] = useState(true);
```

#### Data Synchronization
```javascript
// Keeping change tracking synchronized with event data updates
// File: src/app/create-event/page.js:134-147
const updateEventData = (updates) => {
  setEventData((prev) => {
    const newData = { ...prev, ...updates };
    // Handle deep merging for nested objects
    if (updates.rsvpSettings) {
      newData.rsvpSettings = {
        ...prev.rsvpSettings,
        ...updates.rsvpSettings,
      };
    }
    return newData;
  });
  
  // Update change tracking
  if (changeTracking.currentData) {
    changeTracking.updateData(updates);
  }
};
```

#### Event Loading Integration
```javascript
// Initialize change tracking when event data is loaded for editing
// File: src/app/create-event/page.js:171-173
setEventData(result.event);
// Initialize change tracking with loaded data
changeTracking.initializeTracking(result.event);
```

#### Performance Monitoring
```javascript
// Monitor payload size reduction during development
// File: src/app/create-event/page.js:407-409 (in saveDraft)
if (shouldUseIncremental) {
  const payloadComparison = changeTracking.getPayloadSizeComparison();
  console.log(`Payload reduction: ${payloadComparison.reduction}% (${payloadComparison.fullSize} → ${payloadComparison.incrementalSize} chars)`);
}
```

#### Success Feedback with Metrics
```javascript
// Show success message with performance metrics
// File: src/app/create-event/page.js:470-477 (in saveDraft)
if (shouldUseIncremental) {
  changeTracking.markAsSaved();
  toast.success(`Draft saved! (${changeTracking.getPayloadSizeComparison().reduction}% smaller payload)`, {
    position: "top-center",
    autoClose: 2000,
  });
}
```

**Key Features:**
- **Automatic Fallback**: Falls back to full updates if incremental updates fail
- **Performance Monitoring**: Tracks payload size reduction in real-time
- **State Synchronization**: Keeps change tracking aligned with component state
- **User Feedback**: Shows payload reduction percentages to users
- **Edit Mode Detection**: Only uses incremental updates when editing existing events

## Guest Management

### `/api/[eventID]/guests` - Guest Creation

**Frontend Files:**
- `src/app/[eventID]/components/emailPortal.js` - Bulk guest creation from CSV
- `src/app/[eventID]/components/GuestForm.js` - Individual guest creation

**Usage Patterns:**

#### Bulk Guest Creation
```javascript
// Creating multiple guests from CSV import
// File: src/app/[eventID]/components/emailPortal.js:465
const response = await fetch(`/api/${eventID}/guests`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guests: csvGuestData,
    event: eventContext
  })
});
```

#### Individual Guest Creation
```javascript
// Adding single guest through form
// File: src/app/[eventID]/components/GuestForm.js:129
const response = await fetch(`/api/${eventID}/guests`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    guests: [guestData]
  })
});
```

### `/api/[eventID]/guests/[guestId]` - Individual Guest Management

**Frontend Files:**
- `src/app/[eventID]/components/emailPortal.js` - Guest detail operations
- `src/app/[eventID]/components/GuestForm.js` - Guest editing

**Usage Patterns:**

#### Guest Detail Retrieval
```javascript
// Getting guest details for email operations
// File: src/app/[eventID]/components/emailPortal.js:411
const response = await fetch(`/api/${params.eventID}/guests/${guestId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Guest Updates
```javascript
// Updating existing guest information
// File: src/app/[eventID]/components/GuestForm.js:99
const response = await fetch(`/api/${eventID}/guests/${guest.id}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});
```

### `/api/[eventID]/guestList` - Complete Guest Lists

**Frontend Files:**
- `src/app/[eventID]/portal/page.js` - Main portal guest list display

**Usage Patterns:**

#### Initial Guest List Loading
```javascript
// Loading guest list for portal dashboard
// File: src/app/[eventID]/portal/page.js:28
const res = await fetch(`/api/${params.eventID}/guestList`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Guest List Refresh
```javascript
// Refreshing after guest operations
// File: src/app/[eventID]/portal/page.js:94
const res = await fetch(`/api/${params.eventID}/guestList`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## RSVP System

### `/api/[eventID]/rsvp` - RSVP Management

**Frontend Files:**
- `src/app/[eventID]/rsvp/page.js` - Public RSVP page

**Usage Patterns:**

#### RSVP Data Loading
```javascript
// Loading guest party data for RSVP form
// File: src/app/[eventID]/rsvp/page.js:35
const response = await fetch(
  `/api/${params.eventID}/rsvp?${queryParams}`,
  { cache: 'no-store' }
);
```

#### RSVP Submission
```javascript
// Submitting RSVP responses
// File: src/app/[eventID]/rsvp/page.js:130
const response = await fetch(`/api/${params.eventID}/rsvp`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    party: partyData,
    responses: responseData,
    guestDetails: contactUpdates,
    customQuestionResponses: customResponses
  }),
});
```

## Email Communication

### `/api/[eventID]/sendMail` - Invitation Emails

**Frontend Files:**
- `src/app/[eventID]/components/emailPortal.js` - Email portal interface

**Usage Patterns:**

#### Sending Invitations
```javascript
// Sending invitation emails to selected guests
// File: src/app/[eventID]/components/emailPortal.js:219
const res = await fetch(`/api/${params.eventID}/sendMail`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    guestList: selectedGuests,
    emailType: 'invitation',
    templateId: selectedTemplateId
  }),
});
```

### `/api/[eventID]/sendReminder` - Reminder Emails

**Frontend Files:**
- `src/app/[eventID]/components/emailPortal.js` - Email portal for reminders

**Usage Patterns:**

#### Legacy Reminder System
```javascript
// Sending reminders via legacy Google Sheets system
// File: src/app/[eventID]/components/emailPortal.js:244
const res = await fetch(`/api/${params.eventID}/sendReminder`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    password: eventPassword,
    event: eventData,
    guestList: selectedGuests
  }),
});
```

### `/api/[eventID]/remindeCountDown` - Countdown Reminders

**Frontend Files:**
- `src/app/[eventID]/components/emailPortal.js` - Countdown reminder functionality

**Usage Patterns:**

#### Countdown Email Campaign
```javascript
// Sending countdown reminders
// File: src/app/[eventID]/components/emailPortal.js:269
const res = await fetch(`/api/${params.eventID}/sendReminder`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    password: eventPassword,
    event: eventData,
    guestList: selectedGuests
  }),
});
```

### `/api/[eventID]/sendUpdate` - Event Updates

**Frontend Files:**
- `src/app/[eventID]/components/emailPortal.js` - Update email functionality

**Usage Patterns:**

#### Event Update Emails
```javascript
// Sending event updates (endpoint not implemented)
// File: src/app/[eventID]/components/emailPortal.js:295
const res = await fetch(`/api/${params.eventID}/sendUpdate`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    guestList: selectedGuests,
    updateMessage: updateContent
  }),
});
```

## Image Management

### `/api/upload` - Image Upload

**Frontend Files:**
- `src/app/utils/imageUpload.js` - Utility functions for image handling

**Usage Patterns:**

#### Image Upload Utility
```javascript
// Uploading images with type and temporary flag
// File: src/app/utils/imageUpload.js:15
export const uploadImage = async (file, eventId, imageType, isTemporary = false) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', eventId);
  formData.append('imageType', imageType);
  formData.append('isTemporary', isTemporary.toString());

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  return response.json();
};
```

### `/api/finalize-images` - Image Finalization

**Frontend Files:**
- `src/app/utils/imageUpload.js` - Image finalization utility

**Usage Patterns:**

#### Finalizing Temporary Images
```javascript
// Moving temporary images to permanent storage
// File: src/app/utils/imageUpload.js:32
export const finalizeImages = async (eventId, imageUrls) => {
  const response = await fetch('/api/finalize-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventId,
      imageUrls
    })
  });

  return response.json();
};
```

### `/api/cleanup-temp-images` - Temporary Image Cleanup

**Frontend Files:**
- `src/app/utils/imageUpload.js` - Cleanup utility
- `src/app/create-event/page.js` - Page unload cleanup

**Usage Patterns:**

#### Cleanup Utility Function
```javascript
// Cleaning up unused temporary images
// File: src/app/utils/imageUpload.js:56
export const cleanupTempImages = async (imageUrls) => {
  const response = await fetch('/api/cleanup-temp-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageUrls })
  });

  return response.json();
};
```

#### Page Unload Cleanup
```javascript
// Cleanup on page unload using sendBeacon
// File: src/app/create-event/page.js:179
navigator.sendBeacon('/api/cleanup-temp-images', JSON.stringify({
  imageUrls: tempImageUrls
}));
```

## Authentication

### `/api/[eventID]/login` - Event Access Validation

**Frontend Files:**
Currently not directly used in visible frontend code, but designed for public event access pages.

**Expected Usage Patterns:**

#### Event Access Validation
```javascript
// Validating access to private events
const validateEventAccess = async (eventID, password = '') => {
  const response = await fetch(`/api/${eventID}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password })
  });

  return response.json();
};
```

## Usage Patterns

### Common Authentication Pattern
Most authenticated endpoints follow this pattern:
```javascript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### Error Handling Pattern
```javascript
try {
  const response = await fetch('/api/endpoint', options);
  const result = await response.json();
  
  if (response.ok) {
    // Handle success
    return result;
  } else {
    // Handle API errors
    throw new Error(result.error || 'Unknown error');
  }
} catch (error) {
  // Handle network errors
  console.error('API Error:', error);
  throw error;
}
```

### Loading State Management
```javascript
const [loading, setLoading] = useState(false);

const apiCall = async () => {
  setLoading(true);
  try {
    const result = await fetch('/api/endpoint');
    // Handle result
  } finally {
    setLoading(false);
  }
};
```

### Token Management
```javascript
// Getting auth token from Supabase
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Using token in API calls
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Component Integration Patterns

### Event Creation Flow
1. **Initial Load** → `GET /api/events` (if editing existing)
2. **Draft Save** → `POST /api/events` (with status: 'draft')
3. **Image Upload** → `POST /api/upload` (temporary)
4. **Final Save** → `POST /api/events` (with status: 'published')
5. **Image Finalization** → `POST /api/finalize-images`
6. **Cleanup** → `POST /api/cleanup-temp-images`

### Guest Management Flow
1. **Load Guests** → `GET /api/[eventID]/guestList`
2. **Add Guests** → `POST /api/[eventID]/guests`
3. **Edit Guest** → `PUT /api/[eventID]/guests/[guestId]`
4. **Refresh List** → `GET /api/[eventID]/guestList`

### Email Campaign Flow
1. **Load Event Data** → `GET /api/events`
2. **Load Guest List** → `GET /api/[eventID]/guestList`
3. **Send Emails** → `POST /api/[eventID]/sendMail`
4. **Send Reminders** → `POST /api/[eventID]/sendReminder`

### RSVP Flow
1. **Load Party Data** → `GET /api/[eventID]/rsvp`
2. **Submit Responses** → `POST /api/[eventID]/rsvp`
3. **Update Contact Info** → (included in RSVP submission)

## Performance Considerations

### Batching Operations
- Guest creation supports bulk operations
- Image cleanup handles multiple URLs
- Email sending processes multiple recipients

### Caching Strategies
- Event data cached during creation process
- Guest lists refreshed after modifications
- RSVP data loaded fresh for each session

### Error Recovery
- Individual guest creation failures don't stop batch
- Email sending continues on individual failures
- Image operations isolated to prevent cascade failures

### Loading States
- Most components implement loading indicators
- Progressive data loading for large datasets
- Optimistic UI updates where appropriate