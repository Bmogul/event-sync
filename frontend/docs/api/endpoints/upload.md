# Upload API Endpoint

**Endpoint**: `/api/upload`

**Description**: Handles image uploads for events including logos, backgrounds, and sub-event images. Supports both temporary uploads for unsaved events and permanent uploads with comprehensive file validation and storage management.

## Endpoints

### POST /api/upload

Uploads an image file to Supabase Storage with metadata tracking.

**Authentication**: Required (Bearer token + Event ownership)

**Content Type**: `multipart/form-data`

**Form Data Parameters**:
- `file` (File, required): The image file to upload
- `eventId` (string, required): The event ID the image belongs to
- `imageType` (string, required): Type of image - "logo", "sub-event", or "background"
- `isTemporary` (boolean, optional): Whether this is a temporary upload (default: false)

**Supported Image Types**:
- `logo`: Event logos (max 5MB)
- `sub-event`: Sub-event images (max 10MB)  
- `background`: Background images (max 10MB)

**Supported File Formats**:
- `image/jpeg`, `image/jpg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/svg+xml`

**Request Example**:
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('eventId', '123');
formData.append('imageType', 'logo');
formData.append('isTemporary', 'true');

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "url": "string", // Public URL of uploaded image
  "isTemporary": "boolean", // Whether image is in temporary storage
  "metadata": {
    "fileName": "string", // Original file name
    "fileSize": "number", // File size in bytes
    "fileType": "string", // MIME type
    "imageType": "string", // Image category
    "uploadPath": "string", // Storage path
    "folderPath": "string" // Storage folder
  }
}
```

**Frontend Usage**:
- `src/app/utils/imageUpload.js:15` - Utility function for image uploads
- Event creation forms and image management interfaces

## File Validation

### Size Limits by Image Type
```javascript
const IMAGE_TYPES = {
  logo: { bucket: 'event-assets', folder: 'logos', maxSize: 5 * 1024 * 1024 },
  'sub-event': { bucket: 'event-assets', folder: 'sub-events', maxSize: 10 * 1024 * 1024 },
  background: { bucket: 'event-assets', folder: 'backgrounds', maxSize: 10 * 1024 * 1024 }
};
```

### Validation Function
```javascript
function validateImageFile(file, imageType = 'logo') {
  const errors = [];
  
  // Check file existence
  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check file size
  const typeConfig = IMAGE_TYPES[imageType] || IMAGE_TYPES.logo;
  if (file.size > typeConfig.maxSize) {
    errors.push(`File size too large. Maximum size for ${imageType}: ${(typeConfig.maxSize / 1024 / 1024).toFixed(1)}MB`);
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return errors;
}
```

## Storage Management

### File Path Generation
```javascript
function generateFileName(originalName, eventId, imageType) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop().toLowerCase();
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  return `${eventId}/${imageType}/${timestamp}_${sanitizedName}`;
}
```

### Temporary vs Permanent Storage
- **Temporary**: Stored in `temp/{imageType}/` folders for unsaved events
- **Permanent**: Stored in `{imageType}/` folders for saved events
- **Migration**: Temporary files moved to permanent storage when events are saved

### Storage Buckets
All images stored in `event-assets` bucket with organized folder structure:
```
event-assets/
├── temp/
│   ├── logos/
│   ├── sub-events/
│   └── backgrounds/
├── logos/
├── sub-events/
└── backgrounds/
```

## Authentication & Authorization

### Access Control Flow
1. **User Authentication**: Validates Bearer token with Supabase
2. **Event Ownership**: Verifies user owns the specified event
3. **Permission Check**: Ensures user can upload images for the event

### Authorization Validation
```javascript
// Verify user has access to this event
const { data: eventData, error: eventError } = await supabase
  .from("events")
  .select("id, user_id")
  .eq("id", eventId)
  .single();

// Get user profile to check ownership
const { data: userProfile, error: profileError } = await supabase
  .from("users")
  .select("id")
  .eq("supa_id", user.id)
  .single();

if (userProfile.id !== eventData.user_id) {
  return NextResponse.json({ error: "Unauthorized access to event" }, { status: 403 });
}
```

## Business Logic

### Upload Process Flow
1. **Authentication**: Validate user and event access
2. **File Validation**: Check file type, size, and format
3. **Path Generation**: Create unique file path with timestamp
4. **Storage Upload**: Upload to Supabase Storage bucket
5. **URL Generation**: Get public URL for the uploaded file
6. **Metadata Storage**: Store file metadata (if permanent upload)
7. **Table Updates**: Update main event/sub-event tables with URLs

### Metadata Management
For permanent uploads, metadata is stored in `event_images` table:
```javascript
const imageMetadata = {
  event_id: parseInt(eventId),
  image_type: imageType,
  file_name: file.name,
  file_path: filePath,
  file_size: file.size,
  mime_type: file.type,
  public_url: publicUrl,
  uploaded_by: userProfile.id,
  subevent_id: null, // TODO: Add subevent_id parameter
  created_at: new Date().toISOString(),
};
```

### Main Table Updates
Direct URL updates for faster access:
```javascript
// Update event table based on image type
if (imageType === 'logo') {
  await supabase
    .from("events")
    .update({ logo_url: publicUrl })
    .eq("id", eventId);
} else if (imageType === 'background') {
  await supabase
    .from("events")
    .update({ background_image_url: publicUrl })
    .eq("id", eventId);
}
```

## Error Handling

**Authentication Errors**:
```javascript
{
  "error": "Unauthorized"
}
```

**Validation Errors**:
```javascript
{
  "error": "File validation failed",
  "details": [
    "File size too large. Maximum size for logo: 5.0MB",
    "Unsupported file format. Supported formats: image/jpeg, image/png, ..."
  ]
}
```

**Event Access Errors**:
```javascript
{
  "error": "Event not found"
}
```

**Storage Errors**:
```javascript
{
  "error": "Failed to upload image",
  "details": "Storage bucket error message"
}
```

**Missing Parameters**:
```javascript
{
  "error": "Event ID is required"
}
```

## Performance Considerations

### File Processing
- **Streaming Upload**: Files uploaded as ArrayBuffer for efficiency
- **Size Validation**: Early validation prevents unnecessary processing
- **Path Optimization**: Organized folder structure for faster access

### Storage Optimization
- **CDN Integration**: Supabase Storage provides CDN acceleration
- **Compression**: Consider client-side compression for large images
- **Format Optimization**: WebP support for modern browsers

### Database Operations
- **Metadata Separation**: Optional metadata storage doesn't block main flow
- **Table Updates**: Direct URL updates to main tables for faster queries
- **Error Isolation**: Storage errors don't prevent URL generation

## Security Considerations

### File Security
- **Type Validation**: Strict MIME type checking
- **Size Limits**: Prevents DoS attacks via large files
- **Path Sanitization**: Filename sanitization prevents path traversal
- **Access Control**: Event ownership validation required

### Storage Security
- **Public URLs**: Generated for legitimate uploads only
- **Bucket Permissions**: Proper Supabase RLS policies
- **Temporary Cleanup**: Temporary files cleaned up automatically

## Integration Notes

### Frontend Utility
The upload process is wrapped in a utility function:
```javascript
// src/app/utils/imageUpload.js
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

### Event Creation Workflow
1. **Temporary Upload**: Images uploaded as temporary during event creation
2. **Event Save**: When event is saved, temporary images are finalized
3. **URL Assignment**: Public URLs assigned to event/sub-event records
4. **Cleanup**: Temporary files cleaned up after finalization

## CORS Support

### OPTIONS Handler
```javascript
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

## Database Tables Affected

**Read Operations**:
- `events` - Event ownership verification
- `users` - User profile lookup

**Write Operations**:
- `event_images` - Image metadata storage (optional)
- `events` - Logo and background URL updates
- `subevents` - Sub-event image URL updates (future)

## Related Endpoints

- [`POST /api/finalize-images`](./finalize-images.md) - Move temporary images to permanent storage
- [`POST /api/cleanup-temp-images`](./cleanup-temp-images.md) - Clean up unused temporary images
- [`POST /api/events`](./events.md) - Event creation with image URLs

## Best Practices

### File Handling
- Validate files on both client and server
- Provide upload progress feedback
- Support drag-and-drop interfaces
- Implement retry logic for failed uploads

### Storage Management
- Regular cleanup of unused temporary files
- Monitor storage quota usage
- Implement image optimization pipelines
- Consider backup strategies for important images

### User Experience
- Show upload progress and status
- Provide clear error messages
- Support multiple image formats
- Allow image preview before upload