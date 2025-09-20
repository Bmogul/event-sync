# API Request & Response Schemas

This document provides comprehensive schemas for all Event Sync API endpoints, including request payloads, response structures, and data type definitions.

## Table of Contents

1. [Common Types](#common-types)
2. [Event Management Schemas](#event-management-schemas)
3. [Guest Management Schemas](#guest-management-schemas)
4. [RSVP System Schemas](#rsvp-system-schemas)
5. [Email Communication Schemas](#email-communication-schemas)
6. [Image Management Schemas](#image-management-schemas)
7. [Authentication Schemas](#authentication-schemas)

## Common Types

### Base Response
```typescript
interface BaseResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string; // Development mode only
  timestamp?: string; // ISO 8601 format
}
```

### Authenticated Request Headers
```typescript
interface AuthHeaders {
  "Authorization": `Bearer ${string}`; // JWT token
  "Content-Type": "application/json";
}
```

### Pagination (Future Use)
```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Error Response
```typescript
interface ErrorResponse {
  error: string;
  details?: string;
  message?: string;
  validated?: boolean; // For auth endpoints
  timestamp?: string;
}
```

## Event Management Schemas

### Event Object
```typescript
interface Event {
  public_id: string;
  title: string;
  description?: string;
  location?: string;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  logo_url?: string;
  maxGuests?: number;
  eventType: "wedding" | "birthday" | "corporate" | "other";
  isPrivate: boolean;
  requireRSVP: boolean;
  allowPlusOnes: boolean;
  rsvpDeadline?: string; // ISO 8601
  timezone: string;
}
```

### Sub-Event Object
```typescript
interface SubEvent {
  id?: number; // Include for updates
  title: string;
  description?: string;
  date?: string; // ISO 8601 date
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  location?: string;
  maxGuests?: number;
  timezone?: string;
  isRequired: boolean;
  image?: string; // URL
}
```

### Guest Group Object
```typescript
interface GuestGroup {
  id?: number; // Include for updates
  name: string;
  title?: string; // Alias for name
  description?: string;
  maxSize?: number | string; // Empty string for unlimited
  size?: number; // Current count (read-only)
  color: string; // Hex color code
  point_of_contact?: string; // Guest public_id
}
```

### Guest Object
```typescript
interface Guest {
  id?: number; // Database ID
  public_id?: string; // UUID
  name: string; // Required
  email?: string;
  phone?: string;
  tag?: string;
  group?: string; // Group name
  group_id?: number;
  gender?: "male" | "female" | "other";
  ageGroup?: string;
  guestType: "single" | "multiple" | "variable";
  guestLimit?: number | null; // null for variable type
  isPointOfContact: boolean;
  subEventRSVPs?: Record<string, string>; // Sub-event ID/title to status
}
```

### RSVP Settings Object
```typescript
interface RSVPSettings {
  pageTitle: string;
  subtitle: string;
  welcomeMessage: string;
  theme: "elegant" | "modern" | "classic";
  fontFamily: string;
  backgroundColor: string; // Hex color
  textColor: string; // Hex color
  primaryColor: string; // Hex color
  customQuestions: string[];
  backgroundImage?: string; // URL
  backgroundOverlay: number; // 0-100
  logo?: string; // URL
}
```

### Email Template Object
```typescript
interface EmailTemplate {
  id?: number; // Include for updates
  title: string;
  subtitle?: string;
  body?: string;
  greeting?: string;
  signoff?: string;
  sender_name?: string;
  sender_email?: string;
  reply_to?: string;
  subject_line: string;
  template_key?: string;
  category: "invitation" | "reminder" | "update" | "confirmation";
  status: "draft" | "active" | "archived";
  description?: string;
  is_default: boolean;
  primary_color: string; // Hex color
  secondary_color: string; // Hex color
  text_color: string; // Hex color
}
```

### Events API Schemas

#### GET /api/events Request
```typescript
interface GetEventRequest {
  query: {
    public_id: string;
  };
  headers: AuthHeaders;
}
```

#### POST /api/events Request
```typescript
interface CreateEventRequest {
  headers: AuthHeaders;
  body: {
    public_id?: string; // For updates
    title: string; // Required
    description?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    logo_url?: string;
    maxGuests?: number;
    eventType?: string;
    isPrivate?: boolean;
    requireRSVP?: boolean;
    allowPlusOnes?: boolean;
    rsvpDeadline?: string;
    timezone?: string;
    status: "draft" | "published";
    subEvents?: SubEvent[];
    guestGroups?: GuestGroup[];
    guests?: Guest[];
    rsvpSettings?: RSVPSettings;
    emailTemplates?: EmailTemplate[];
    allowDuplicates?: boolean;
  };
}
```

#### Event Response
```typescript
interface EventResponse extends BaseResponse {
  event: Event & {
    subEvents: SubEvent[];
    guestGroups: GuestGroup[];
    guests: Guest[];
    rsvpSettings: RSVPSettings;
    emailTemplates: EmailTemplate[];
  };
}
```

#### Duplicate Detection Response
```typescript
interface DuplicateResponse {
  success: false;
  duplicatesFound: true;
  duplicates: Array<{
    type: "within_new_list" | "existing_guest";
    guestName: string;
    groupTitle: string;
    existingGuestId?: number;
    existingGuestPOC?: boolean;
    newGuestFrontendIndex?: number;
    firstGuestIndex?: number;
    currentIndex?: number;
  }>;
  message: string;
}
```

## Guest Management Schemas

### Guest Creation Request
```typescript
interface CreateGuestsRequest {
  headers: AuthHeaders;
  body: {
    guests: Array<{
      name: string; // Required
      email?: string;
      phone?: string;
      tag?: string;
      group?: string;
      gender?: string;
      ageGroup?: string;
      guestType?: "single" | "multiple" | "variable";
      guestLimit?: number;
      isPointOfContact?: boolean;
      subEventInvitations?: number[]; // Sub-event IDs
    }>;
    event?: Record<string, any>; // Optional context
  };
}
```

### Guest Creation Response
```typescript
interface CreateGuestsResponse extends BaseResponse {
  guests: Array<{
    id: number;
    group_id: number;
    public_id: string;
    name: string;
    email?: string;
    phone?: string;
    tag?: string;
    gender_id?: number;
    age_group_id?: number;
    guest_type_id: number;
    guest_limit?: number;
    point_of_contact: boolean;
  }>;
  groups: Array<{
    id: number;
    event_id: number;
    title: string;
    size_limit: number;
    status_id: number;
    details: {
      color: string;
      description: string;
    };
  }>;
}
```

### Guest List Response
```typescript
interface GuestListResponse {
  validated: true;
  allUsers: Array<{
    id: number;
    public_id: string;
    name: string;
    email?: string;
    phone?: string;
    tag?: string;
    point_of_contact: boolean;
    group: string;
    group_id: number;
    gender?: string;
    gender_id?: number;
    ageGroup?: string;
    age_group_id?: number;
    guest_type: string;
    guest_limit?: number;
    rsvp_status: Record<string, {
      status_id: number;
      status_name: string;
      response?: number;
    }>;
    total_rsvps: number;
  }>;
  event: {
    id: number;
    public_id: string;
    title: string;
    status_id: number;
  };
  total_guests: number;
}
```

## RSVP System Schemas

### RSVP Get Request
```typescript
interface RSVPGetRequest {
  query: {
    guestId: string; // Group ID
  };
}
```

### RSVP Get Response
```typescript
interface RSVPGetResponse {
  party: Array<{
    id: number;
    public_id: string;
    name: string;
    email?: string;
    phone?: string;
    tag?: string;
    point_of_contact: boolean;
    group: string;
    group_id: number;
    gender?: string;
    ageGroup?: string;
    guestType: string;
    guestLimit?: number;
    invites: Record<string, number>; // Sub-event title to status ID
    rsvps: Array<{
      subevent_id: number;
      status_id: number;
      response?: number;
      details?: Record<string, any>;
    }>;
    hasInvitations: boolean;
  }>;
  event: Event & {
    landing_page_configs: Array<{
      id: number;
      title: string;
      logo?: string;
      greeting_config: Record<string, any>;
      rsvp_config: Record<string, any>;
      status: string;
    }>;
  };
  subEvents: SubEvent[];
  group: {
    id: number;
    title: string;
  };
}
```

### RSVP Submit Request
```typescript
interface RSVPSubmitRequest {
  body: {
    party: Array<{
      id: number;
      public_id?: string;
      responses: Record<string, string | number>; // Sub-event to response
      guestType?: string;
      guestLimit?: number;
    }>;
    responses?: Record<string, any>; // Legacy format
    guestDetails?: Record<string, {
      email?: string;
      phone?: string;
    }>;
    customQuestionResponses?: Record<string, any>;
  };
}
```

### RSVP Submit Response
```typescript
interface RSVPSubmitResponse extends BaseResponse {
  updated: {
    guests: number; // Count of guest contact updates
    rsvps: number; // Count of RSVP responses updated
  };
}
```

## Email Communication Schemas

### Send Mail Request
```typescript
interface SendMailRequest {
  headers: AuthHeaders;
  body: {
    guestList: Array<{
      name: string;
      email: string;
      group_id: number;
      [key: string]: any; // Additional guest properties
    }>;
    emailType?: "invitation";
    templateId?: number; // Database template ID
  };
}
```

### Send Mail Response
```typescript
interface SendMailResponse {
  validated: true;
  success: true;
  results: {
    total: number;
    successful: number;
    failed: number;
    details: {
      successful: Array<{
        guest: Record<string, any>;
        email: string;
      }>;
      failed: Array<{
        guest: Record<string, any>;
        error: string;
      }>;
    };
  };
  guestList: Array<Record<string, any> & {
    emailSent?: boolean;
    lastEmailSent?: string;
  }>;
}
```

### Legacy Email Request (Reminders/Countdown)
```typescript
interface LegacyEmailRequest {
  body: {
    password: string;
    event: {
      eventID: string;
      eventTitle: string;
      sheetID: string;
      logo?: string;
      email_message: string;
    };
    guestList: Array<{
      GUID: string;
      UID: string;
      Email: string;
      Sent: string;
      [key: string]: any;
    }>;
  };
}
```

### Legacy Email Response
```typescript
interface LegacyEmailResponse {
  validated: true;
  guestList: Array<{
    GUID: string;
    UID: string;
    Email: string;
    Sent: "Yes" | string;
    [key: string]: any;
  }>;
}
```

## Image Management Schemas

### Upload Request
```typescript
interface UploadRequest {
  headers: {
    "Authorization": `Bearer ${string}`;
  };
  body: FormData & {
    file: File;
    eventId: string;
    imageType: "logo" | "sub-event" | "background";
    isTemporary?: "true" | "false";
  };
}
```

### Upload Response
```typescript
interface UploadResponse extends BaseResponse {
  url: string; // Public URL of uploaded image
  isTemporary: boolean;
  metadata: {
    fileName: string;
    fileSize: number;
    fileType: string;
    imageType: string;
    uploadPath: string;
    folderPath: string;
  };
}
```

### Finalize Images Request
```typescript
interface FinalizeImagesRequest {
  headers: AuthHeaders;
  body: {
    eventId: string;
    imageUrls: Array<{
      tempUrl: string;
      imageType: "logo" | "sub-event" | "background";
      fileName: string;
      subeventId?: number;
    }>;
  };
}
```

### Finalize Images Response
```typescript
interface FinalizeImagesResponse extends BaseResponse {
  finalizedUrls: Array<{
    originalUrl: string;
    finalUrl: string;
    imageType: string;
    success: true;
  }>;
  errors: Array<{
    url: string;
    error: string;
  }>;
  message: string;
}
```

### Cleanup Temp Images Request
```typescript
interface CleanupTempImagesRequest {
  headers: AuthHeaders;
  body: {
    imageUrls: string[]; // Array of temporary image URLs
  };
}
```

### Cleanup Temp Images Response
```typescript
interface CleanupTempImagesResponse extends BaseResponse {
  cleanedUrls: Array<{
    url: string;
    path: string;
    success: true;
  }>;
  errors: Array<{
    url: string;
    error: string;
  }>;
  message: string;
}
```

## Authentication Schemas

### Event Login Request
```typescript
interface EventLoginRequest {
  body: {
    password: string;
  };
}
```

### Event Login Response
```typescript
interface EventLoginResponse {
  validated: boolean;
  event?: {
    id: number;
    public_id: string;
    title: string;
    is_private: boolean;
  };
  message?: string; // Error message if validation fails
}
```

## Validation Rules

### Required Fields by Endpoint

#### Event Creation
- `title` - Always required
- `guestLimit` - Required when `guestType` is "multiple"
- `password` - Required for private events

#### Guest Creation
- `name` - Always required for guests
- `guestLimit` - Required when `guestType` is "multiple"

#### RSVP Submission
- `party` - Array must not be empty
- `id` or `public_id` - Required for each party member

#### Image Upload
- `file` - File object required
- `eventId` - Event ID required
- `imageType` - Must be valid image type

### Data Type Constraints

#### Strings
- Event titles: 1-200 characters
- Descriptions: 0-1000 characters
- Email addresses: Valid email format
- Phone numbers: Flexible format validation

#### Numbers
- Guest limits: 0 or positive integers
- Event capacity: Positive integers
- Image file sizes: Per type limits (5MB logos, 10MB others)

#### Dates
- All dates in ISO 8601 format
- Times in HH:MM format
- Timezones as IANA timezone strings

#### Colors
- Hex color codes with # prefix
- 6-character hex values (e.g., #7c3aed)

### File Upload Constraints

#### Supported Formats
- Images: JPEG, PNG, WebP, GIF, SVG
- MIME types validated server-side
- File extensions checked

#### Size Limits
- Logo images: 5MB maximum
- Sub-event images: 10MB maximum
- Background images: 10MB maximum

### Response Status Codes

#### Success Codes
- `200` - Success with data
- `201` - Resource created

#### Client Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)

#### Server Error Codes
- `500` - Internal Server Error (unexpected errors)

### Common Validation Patterns

#### Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

#### Phone Validation
```typescript
// Flexible international phone format
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
```

#### Color Validation
```typescript
const colorRegex = /^#[0-9A-Fa-f]{6}$/;
```

#### UUID Validation
```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
```