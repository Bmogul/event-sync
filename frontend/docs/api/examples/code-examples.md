# API Code Examples

This document provides practical code examples for integrating with Event Sync API endpoints. Examples include both JavaScript/TypeScript implementations and common usage patterns.

## Table of Contents

1. [Setup and Authentication](#setup-and-authentication)
2. [Event Management Examples](#event-management-examples)
3. [Change Tracking and Incremental Updates](#change-tracking-and-incremental-updates)
4. [Guest Management Examples](#guest-management-examples)
5. [RSVP System Examples](#rsvp-system-examples)
6. [Email Communication Examples](#email-communication-examples)
7. [Image Upload Examples](#image-upload-examples)
8. [Error Handling Patterns](#error-handling-patterns)
9. [React Integration Examples](#react-integration-examples)

## Setup and Authentication

### Authentication Setup
```javascript
// Authentication utility
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Get authentication token
async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// Authenticated API request wrapper
async function authenticatedRequest(url, options = {}) {
  const token = await getAuthToken();
  
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}
```

### API Response Handler
```javascript
// Generic API response handler
async function handleApiResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }
  
  return data;
}

// Usage example
try {
  const response = await authenticatedRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
  
  const result = await handleApiResponse(response);
  console.log('Success:', result);
} catch (error) {
  console.error('API Error:', error.message);
}
```

## Event Management Examples

### Creating a New Event
```javascript
async function createEvent(eventData) {
  const payload = {
    title: eventData.title,
    description: eventData.description,
    startDate: eventData.startDate,
    endDate: eventData.endDate,
    location: eventData.location,
    eventType: eventData.eventType || 'event',
    isPrivate: eventData.isPrivate || false,
    requireRSVP: eventData.requireRSVP || true,
    timezone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    status: 'draft', // Start as draft
    
    // Sub-events
    subEvents: eventData.subEvents || [],
    
    // Guest groups and guests
    guestGroups: eventData.guestGroups || [],
    guests: eventData.guests || [],
    
    // RSVP page settings
    rsvpSettings: {
      pageTitle: eventData.rsvpSettings?.pageTitle || "You're Invited!",
      subtitle: eventData.rsvpSettings?.subtitle || "Join us for our special event",
      welcomeMessage: eventData.rsvpSettings?.welcomeMessage || "Welcome!",
      theme: eventData.rsvpSettings?.theme || "elegant",
      fontFamily: eventData.rsvpSettings?.fontFamily || "Playfair Display",
      backgroundColor: eventData.rsvpSettings?.backgroundColor || "#faf5ff",
      textColor: eventData.rsvpSettings?.textColor || "#581c87",
      primaryColor: eventData.rsvpSettings?.primaryColor || "#7c3aed",
      customQuestions: eventData.rsvpSettings?.customQuestions || ["dietary", "message"]
    }
  };

  const response = await authenticatedRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return handleApiResponse(response);
}

// Usage
const newEvent = await createEvent({
  title: "Summer Wedding",
  description: "Join us for our special day",
  startDate: "2024-07-15T15:00:00Z",
  endDate: "2024-07-15T23:00:00Z",
  location: "Garden Venue",
  eventType: "wedding",
  subEvents: [
    {
      title: "Ceremony",
      date: "2024-07-15",
      startTime: "15:00",
      endTime: "16:00",
      location: "Garden Chapel",
      isRequired: true
    },
    {
      title: "Reception",
      date: "2024-07-15", 
      startTime: "18:00",
      endTime: "23:00",
      location: "Main Hall",
      isRequired: false
    }
  ]
});
```

### Loading an Existing Event
```javascript
async function loadEvent(publicId) {
  const response = await authenticatedRequest(`/api/events?public_id=${encodeURIComponent(publicId)}`);
  return handleApiResponse(response);
}

// Usage
const event = await loadEvent("wedding-2024");
console.log('Event loaded:', event.event.title);
console.log('Sub-events:', event.event.subEvents.length);
console.log('Guests:', event.event.guests.length);
```

### Publishing an Event
```javascript
async function publishEvent(eventData) {
  const publishPayload = {
    ...eventData,
    status: 'published'
  };

  const response = await authenticatedRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify(publishPayload)
  });

  return handleApiResponse(response);
}
```

### Handling Duplicate Guests
```javascript
async function createEventWithDuplicateHandling(eventData) {
  try {
    // First attempt without allowing duplicates
    const response = await authenticatedRequest('/api/events', {
      method: 'POST',
      body: JSON.stringify({
        ...eventData,
        allowDuplicates: false
      })
    });

    return await handleApiResponse(response);
  } catch (error) {
    const errorData = JSON.parse(error.message);
    
    if (errorData.duplicatesFound) {
      // Handle duplicate guests
      console.log('Duplicates found:', errorData.duplicates);
      
      const shouldProceed = confirm(
        `Found ${errorData.duplicates.length} duplicate guests. Continue anyway?`
      );
      
      if (shouldProceed) {
        // Retry with duplicates allowed
        const retryResponse = await authenticatedRequest('/api/events', {
          method: 'POST',
          body: JSON.stringify({
            ...eventData,
            allowDuplicates: true
          })
        });
        
        return await handleApiResponse(retryResponse);
      }
    }
    
    throw error;
  }
}
```

## Change Tracking and Incremental Updates

### Setting Up Change Tracking

```javascript
import { useChangeTracking } from '../hooks/useChangeTracking';

function EventEditor({ initialEventData }) {
  const [eventData, setEventData] = useState(initialEventData);
  const changeTracking = useChangeTracking();
  
  // Initialize change tracking when event data loads
  useEffect(() => {
    if (initialEventData) {
      changeTracking.initializeTracking(initialEventData);
      setEventData(initialEventData);
    }
  }, [initialEventData]);
  
  // Update both local state and change tracking
  const updateEventData = (updates) => {
    setEventData(prev => ({ ...prev, ...updates }));
    changeTracking.updateData(updates);
  };
  
  return (
    <div>
      {/* Your event editing UI */}
      <EventForm eventData={eventData} onUpdate={updateEventData} />
      
      {/* Show unsaved changes indicator */}
      {changeTracking.hasUnsavedChanges() && (
        <div className="unsaved-changes">
          Unsaved changes detected
        </div>
      )}
    </div>
  );
}
```

### Incremental Update (Recommended for Edits)

```javascript
async function saveIncrementalChanges(eventData, changeTracking) {
  const changes = changeTracking.getChanges();
  
  if (!changes) {
    console.log('No changes to save');
    return;
  }
  
  // Get payload size comparison for monitoring
  const { reduction, fullSize, incrementalSize } = changeTracking.getPayloadSizeComparison();
  console.log(`Incremental update: ${reduction}% smaller (${fullSize} → ${incrementalSize} chars)`);
  
  try {
    const response = await authenticatedRequest('/api/events', {
      method: 'PATCH',
      body: JSON.stringify({
        ...changes.changes,
        public_id: eventData.public_id,
        status: 'draft',
        isPartialUpdate: true,
        conflictToken: changes.metadata.conflictToken
      })
    });
    
    const result = await handleApiResponse(response);
    
    // Mark changes as saved
    changeTracking.markAsSaved();
    
    console.log(`✅ Incremental save successful (${reduction}% payload reduction)`);
    return result;
    
  } catch (error) {
    console.error('Incremental update failed:', error);
    
    // Fallback to full update
    console.log('Falling back to full update...');
    return saveFullEvent(eventData);
  }
}
```

### Full Update with Fallback Support

```javascript
async function saveFullEvent(eventData) {
  console.log('Performing full event update');
  
  const response = await authenticatedRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify({
      ...eventData,
      status: 'draft',
      isPartialUpdate: false
    })
  });
  
  return handleApiResponse(response);
}
```

### Smart Save Function (Chooses Best Method)

```javascript
async function smartSaveEvent(eventData, changeTracking, isEditMode = false) {
  // Use incremental updates for edits, full updates for new events
  if (isEditMode && changeTracking.hasUnsavedChanges()) {
    try {
      return await saveIncrementalChanges(eventData, changeTracking);
    } catch (error) {
      console.warn('Incremental update failed, using full update as fallback');
      return await saveFullEvent(eventData);
    }
  } else {
    return await saveFullEvent(eventData);
  }
}
```

### Monitoring Payload Size Reduction

```javascript
function PayloadSizeMonitor({ changeTracking }) {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    if (changeTracking.hasUnsavedChanges()) {
      const comparison = changeTracking.getPayloadSizeComparison();
      setMetrics(comparison);
    } else {
      setMetrics(null);
    }
  }, [changeTracking]);
  
  if (!metrics || !metrics.hasChanges) {
    return null;
  }
  
  return (
    <div className="payload-metrics">
      <span>Incremental update ready:</span>
      <span className="size-reduction">
        {metrics.reduction}% smaller payload
      </span>
      <span className="size-details">
        ({metrics.fullSize} → {metrics.incrementalSize} chars)
      </span>
    </div>
  );
}
```

### Change Detection Examples

```javascript
// Example: Only save main event changes
const changes = changeTracking.getChanges();
if (changes && changes.changes.mainEvent) {
  console.log('Main event fields changed:', Object.keys(changes.changes.mainEvent));
}

// Example: Check specific change types
if (changes?.changes.subEvents) {
  const { added, modified, removed } = changes.changes.subEvents;
  console.log(`Sub-events: +${added.length} ~${Object.keys(modified).length} -${removed.length}`);
}

// Example: Get debug information
const debugInfo = changeTracking.getDebugInfo();
console.log('Change tracking status:', debugInfo);
```

### Conflict Resolution Example

```javascript
async function saveWithConflictResolution(eventData, changeTracking) {
  try {
    return await saveIncrementalChanges(eventData, changeTracking);
  } catch (error) {
    // Check if this is a conflict error
    if (error.conflictDetected) {
      const resolution = await handleConflict(error);
      
      if (resolution === 'retry') {
        // User chose to retry with current changes
        return await saveIncrementalChanges(eventData, changeTracking);
      } else if (resolution === 'reload') {
        // User chose to reload and lose changes
        window.location.reload();
      }
    }
    
    throw error;
  }
}

async function handleConflict(conflictError) {
  const userChoice = await showConflictDialog({
    message: conflictError.message,
    conflictingFields: conflictError.conflictingFields,
    lastModified: conflictError.lastModified
  });
  
  return userChoice; // 'retry', 'reload', 'merge', etc.
}
```

## Guest Management Examples

### Adding Guests to Event
```javascript
async function addGuests(eventID, guests) {
  const payload = {
    guests: guests.map(guest => ({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      group: guest.group || 'General',
      gender: guest.gender || '',
      ageGroup: guest.ageGroup || '',
      guestType: guest.guestType || 'single',
      guestLimit: guest.guestType === 'multiple' ? (guest.guestLimit || 1) : undefined,
      isPointOfContact: guest.isPointOfContact || false,
      subEventInvitations: guest.subEventInvitations || []
    }))
  };

  const response = await authenticatedRequest(`/api/${eventID}/guests`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return handleApiResponse(response);
}

// Usage
const newGuests = await addGuests('wedding-2024', [
  {
    name: 'John Smith',
    email: 'john@example.com',
    group: 'Family',
    guestType: 'multiple',
    guestLimit: 2,
    isPointOfContact: true,
    subEventInvitations: [1, 2] // Sub-event IDs
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    group: 'Family',
    guestType: 'single',
    subEventInvitations: [1, 2]
  }
]);
```

### Loading Guest List
```javascript
async function loadGuestList(eventID) {
  const response = await authenticatedRequest(`/api/${eventID}/guestList`);
  const data = await handleApiResponse(response);
  
  return {
    guests: data.allUsers,
    totalGuests: data.total_guests,
    event: data.event
  };
}

// Usage with filtering
const { guests, totalGuests } = await loadGuestList('wedding-2024');

// Filter guests by RSVP status
const attendingGuests = guests.filter(guest => 
  Object.values(guest.rsvp_status).some(status => status.status_name === 'attending')
);

const pendingGuests = guests.filter(guest =>
  Object.values(guest.rsvp_status).some(status => status.status_name === 'pending')
);

console.log(`${attendingGuests.length} attending, ${pendingGuests.length} pending`);
```

### Updating Guest Information
```javascript
async function updateGuest(eventID, guestId, updates) {
  const response = await authenticatedRequest(`/api/${eventID}/guests/${guestId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });

  return handleApiResponse(response);
}

// Usage
await updateGuest('wedding-2024', 123, {
  email: 'newemail@example.com',
  phone: '+1-555-0123',
  guestType: 'multiple',
  guestLimit: 3
});
```

### CSV Guest Import
```javascript
async function importGuestsFromCSV(eventID, csvData) {
  const guests = csvData.map(row => ({
    name: `${row.firstName} ${row.lastName}`.trim(),
    email: row.email,
    phone: row.phone,
    group: row.group || 'Imported',
    gender: row.gender,
    guestType: row.guestType || 'single',
    guestLimit: row.guestLimit ? parseInt(row.guestLimit) : undefined
  }));

  return addGuests(eventID, guests);
}
```

## RSVP System Examples

### Loading RSVP Data
```javascript
async function loadRSVPData(eventID, groupId) {
  const response = await fetch(`/api/${eventID}/rsvp?guestId=${groupId}`, {
    cache: 'no-store'
  });
  
  return handleApiResponse(response);
}

// Usage
const rsvpData = await loadRSVPData('wedding-2024', 'group-123');
console.log('Party members:', rsvpData.party.length);
console.log('Sub-events:', rsvpData.subEvents.length);
```

### Submitting RSVP Responses
```javascript
async function submitRSVP(eventID, rsvpData) {
  const payload = {
    party: rsvpData.party.map(member => ({
      id: member.id,
      public_id: member.public_id,
      guestType: member.guestType,
      guestLimit: member.guestLimit,
      responses: member.responses
    })),
    guestDetails: rsvpData.guestDetails || {},
    customQuestionResponses: rsvpData.customQuestions || {}
  };

  const response = await fetch(`/api/${eventID}/rsvp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleApiResponse(response);
}

// Usage for different guest types
const rsvpResponses = {
  party: [
    {
      id: 123,
      guestType: 'single',
      responses: {
        'Ceremony': 'attending',
        'Reception': 'attending'
      }
    },
    {
      id: 124,
      guestType: 'multiple',
      guestLimit: 4,
      responses: {
        'Ceremony': 2, // 2 people attending
        'Reception': 4, // 4 people attending
        'After Party': 0 // Not attending
      }
    }
  ],
  guestDetails: {
    'guest-uuid-123': {
      email: 'updated@example.com',
      phone: '+1-555-0123'
    }
  },
  customQuestions: {
    dietary_requirements: 'Vegetarian',
    message: 'Looking forward to celebrating!'
  }
};

await submitRSVP('wedding-2024', rsvpResponses);
```

### RSVP Form Component
```javascript
// React component for RSVP form
import React, { useState, useEffect } from 'react';

function RSVPForm({ eventID, groupId }) {
  const [rsvpData, setRsvpData] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRSVPData(eventID, groupId)
      .then(data => {
        setRsvpData(data);
        // Initialize responses
        const initialResponses = {};
        data.party.forEach(member => {
          initialResponses[member.id] = {};
          data.subEvents.forEach(subEvent => {
            if (member.invites[subEvent.title]) {
              initialResponses[member.id][subEvent.title] = 
                member.guestType === 'single' ? 'pending' : 0;
            }
          });
        });
        setResponses(initialResponses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventID, groupId]);

  const handleResponseChange = (memberId, subEventTitle, value) => {
    setResponses(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [subEventTitle]: value
      }
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      party: rsvpData.party.map(member => ({
        id: member.id,
        guestType: member.guestType,
        guestLimit: member.guestLimit,
        responses: responses[member.id] || {}
      }))
    };

    try {
      await submitRSVP(eventID, payload);
      alert('RSVP submitted successfully!');
    } catch (error) {
      alert('Error submitting RSVP: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{rsvpData.event.title}</h2>
      {rsvpData.party.map(member => (
        <div key={member.id}>
          <h3>{member.name}</h3>
          {rsvpData.subEvents.map(subEvent => {
            if (!member.invites[subEvent.title]) return null;
            
            return (
              <div key={subEvent.id}>
                <label>{subEvent.title}</label>
                {member.guestType === 'single' ? (
                  <select
                    value={responses[member.id]?.[subEvent.title] || 'pending'}
                    onChange={(e) => handleResponseChange(member.id, subEvent.title, e.target.value)}
                  >
                    <option value="pending">Please select</option>
                    <option value="attending">Attending</option>
                    <option value="not_attending">Not attending</option>
                  </select>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max={member.guestLimit || undefined}
                    value={responses[member.id]?.[subEvent.title] || 0}
                    onChange={(e) => handleResponseChange(member.id, subEvent.title, parseInt(e.target.value))}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
      <button onClick={handleSubmit}>Submit RSVP</button>
    </div>
  );
}
```

## Email Communication Examples

### Sending Invitations
```javascript
async function sendInvitations(eventID, guests, templateId = null) {
  const payload = {
    guestList: guests.map(guest => ({
      name: guest.name,
      email: guest.email,
      group_id: guest.group_id
    })),
    emailType: 'invitation'
  };

  if (templateId) {
    payload.templateId = templateId;
  }

  const response = await authenticatedRequest(`/api/${eventID}/sendMail`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  return handleApiResponse(response);
}

// Usage
const emailResults = await sendInvitations('wedding-2024', selectedGuests, 42);
console.log(`Sent ${emailResults.results.successful} emails, ${emailResults.results.failed} failed`);
```

### Sending Reminders (Legacy System)
```javascript
async function sendReminders(eventID, eventData, guests) {
  const payload = {
    password: eventData.password,
    event: {
      eventID: eventID,
      eventTitle: eventData.title,
      sheetID: eventData.sheetID,
      logo: eventData.logo,
      email_message: 'Don\'t forget to RSVP for our special event!'
    },
    guestList: guests
  };

  const response = await fetch(`/api/${eventID}/sendReminder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return handleApiResponse(response);
}
```

### Email Campaign Management
```javascript
class EmailCampaignManager {
  constructor(eventID, authToken) {
    this.eventID = eventID;
    this.authToken = authToken;
  }

  async sendBatchEmails(guests, templateId, batchSize = 10) {
    const results = {
      successful: [],
      failed: [],
      total: guests.length
    };

    // Process in batches to avoid overwhelming the email service
    for (let i = 0; i < guests.length; i += batchSize) {
      const batch = guests.slice(i, i + batchSize);
      
      try {
        const batchResult = await sendInvitations(this.eventID, batch, templateId);
        results.successful.push(...batchResult.results.details.successful);
        results.failed.push(...batchResult.results.details.failed);
        
        // Add delay between batches
        if (i + batchSize < guests.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        results.failed.push(...batch.map(guest => ({
          guest,
          error: error.message
        })));
      }
    }

    return results;
  }

  async sendTargetedCampaign(filterFn, templateId) {
    // Load guest list
    const { guests } = await loadGuestList(this.eventID);
    
    // Filter guests based on criteria
    const targetGuests = guests.filter(filterFn);
    
    // Send emails
    return this.sendBatchEmails(targetGuests, templateId);
  }
}

// Usage
const campaignManager = new EmailCampaignManager('wedding-2024', authToken);

// Send to guests who haven't responded
await campaignManager.sendTargetedCampaign(
  guest => Object.values(guest.rsvp_status).every(status => status.status_name === 'pending'),
  reminderTemplateId
);

// Send to confirmed attendees
await campaignManager.sendTargetedCampaign(
  guest => Object.values(guest.rsvp_status).some(status => status.status_name === 'attending'),
  confirmationTemplateId
);
```

## Image Upload Examples

### Single Image Upload
```javascript
async function uploadImage(file, eventId, imageType, isTemporary = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('eventId', eventId);
  formData.append('imageType', imageType);
  formData.append('isTemporary', isTemporary.toString());

  const response = await authenticatedRequest('/api/upload', {
    method: 'POST',
    body: formData,
    headers: {} // Let browser set Content-Type for FormData
  });

  return handleApiResponse(response);
}

// Usage
const logoFile = document.getElementById('logo-input').files[0];
const result = await uploadImage(logoFile, '123', 'logo', true);
console.log('Uploaded to:', result.url);
```

### Image Upload with Progress
```javascript
function uploadImageWithProgress(file, eventId, imageType, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', eventId);
    formData.append('imageType', imageType);
    formData.append('isTemporary', 'true');

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('POST', '/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
    xhr.send(formData);
  });
}

// Usage
await uploadImageWithProgress(file, eventId, 'logo', (progress) => {
  console.log(`Upload progress: ${progress.toFixed(1)}%`);
});
```

### Image Management Component
```javascript
import React, { useState } from 'react';

function ImageUploadManager({ eventId }) {
  const [tempImages, setTempImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (file, imageType) => {
    setUploading(true);
    
    try {
      const result = await uploadImage(file, eventId, imageType, true);
      
      setTempImages(prev => [
        ...prev,
        {
          id: Date.now(),
          url: result.url,
          type: imageType,
          fileName: result.metadata.fileName,
          isTemporary: true
        }
      ]);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const finalizeImages = async () => {
    if (tempImages.length === 0) return;

    try {
      const response = await authenticatedRequest('/api/finalize-images', {
        method: 'POST',
        body: JSON.stringify({
          eventId,
          imageUrls: tempImages.map(img => ({
            tempUrl: img.url,
            imageType: img.type,
            fileName: img.fileName
          }))
        })
      });

      const result = await handleApiResponse(response);
      console.log('Images finalized:', result.finalizedUrls.length);
      
      // Clear temp images
      setTempImages([]);
    } catch (error) {
      console.error('Finalization failed:', error);
    }
  };

  const cleanupTempImages = async () => {
    if (tempImages.length === 0) return;

    try {
      await authenticatedRequest('/api/cleanup-temp-images', {
        method: 'POST',
        body: JSON.stringify({
          imageUrls: tempImages.map(img => img.url)
        })
      });

      setTempImages([]);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files[0], 'logo')}
        disabled={uploading}
      />
      
      {tempImages.map(img => (
        <div key={img.id}>
          <img src={img.url} alt={img.fileName} style={{ width: 100, height: 100 }} />
          <span>{img.fileName}</span>
        </div>
      ))}
      
      <button onClick={finalizeImages} disabled={tempImages.length === 0}>
        Finalize Images
      </button>
      
      <button onClick={cleanupTempImages} disabled={tempImages.length === 0}>
        Clear Images
      </button>
    </div>
  );
}
```

## Error Handling Patterns

### Retry Logic
```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await authenticatedRequest(url, options);
      return await handleApiResponse(response);
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.message.includes('400') || error.message.includes('404')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}
```

### Global Error Handler
```javascript
class APIError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }
}

async function handleApiCall(apiFunction, fallbackValue = null) {
  try {
    return await apiFunction();
  } catch (error) {
    console.error('API call failed:', error);
    
    // Log to monitoring service
    if (typeof window !== 'undefined' && window.analytics) {
      window.analytics.track('API Error', {
        error: error.message,
        stack: error.stack
      });
    }
    
    // Show user-friendly message
    if (error.status >= 500) {
      alert('Service temporarily unavailable. Please try again later.');
    } else if (error.status === 401) {
      alert('Please log in to continue.');
      // Redirect to login
    } else {
      alert(error.message || 'An error occurred. Please try again.');
    }
    
    return fallbackValue;
  }
}

// Usage
const events = await handleApiCall(
  () => loadGuestList('wedding-2024'),
  { guests: [], totalGuests: 0 }
);
```

## React Integration Examples

### Custom Hook for API State
```javascript
import { useState, useCallback } from 'react';

function useApiCall(apiFunction) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Usage
function EventManager({ eventId }) {
  const { data: guestList, loading, error, execute: loadGuests } = useApiCall(loadGuestList);

  useEffect(() => {
    loadGuests(eventId);
  }, [eventId, loadGuests]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Guests ({guestList?.totalGuests || 0})</h2>
      {guestList?.guests.map(guest => (
        <div key={guest.id}>{guest.name}</div>
      ))}
    </div>
  );
}
```

### Context for API State Management
```javascript
import React, { createContext, useContext, useReducer } from 'react';

const EventContext = createContext();

function eventReducer(state, action) {
  switch (action.type) {
    case 'LOAD_EVENT_START':
      return { ...state, loading: true, error: null };
    case 'LOAD_EVENT_SUCCESS':
      return { ...state, loading: false, event: action.payload };
    case 'LOAD_EVENT_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_GUESTS':
      return { 
        ...state, 
        event: { 
          ...state.event, 
          guests: action.payload 
        } 
      };
    default:
      return state;
  }
}

export function EventProvider({ children, eventId }) {
  const [state, dispatch] = useReducer(eventReducer, {
    event: null,
    loading: false,
    error: null
  });

  const loadEvent = useCallback(async () => {
    dispatch({ type: 'LOAD_EVENT_START' });
    try {
      const event = await loadEvent(eventId);
      dispatch({ type: 'LOAD_EVENT_SUCCESS', payload: event });
    } catch (error) {
      dispatch({ type: 'LOAD_EVENT_ERROR', payload: error });
    }
  }, [eventId]);

  const addGuests = useCallback(async (guests) => {
    const result = await addGuests(eventId, guests);
    // Reload guest list
    const updatedEvent = await loadEvent(eventId);
    dispatch({ type: 'UPDATE_GUESTS', payload: updatedEvent.guests });
    return result;
  }, [eventId]);

  return (
    <EventContext.Provider value={{ ...state, loadEvent, addGuests }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within EventProvider');
  }
  return context;
}
```

This comprehensive set of examples should provide developers with practical guidance for integrating with all Event Sync API endpoints, handling common scenarios, and implementing robust error handling and state management patterns.