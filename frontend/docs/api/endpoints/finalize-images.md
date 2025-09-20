# Finalize Images API Endpoint

**Endpoint**: `/api/finalize-images`

**Description**: Moves images from temporary storage to permanent storage when an event is saved. This endpoint handles the migration of temporarily uploaded images to their final storage locations with proper metadata management and table updates.

## Endpoints

### POST /api/finalize-images

Moves temporary images to permanent storage and updates database records.

**Authentication**: Required (Bearer token)

**Request Body Schema**:
```javascript
{
  "eventId": "string", // Required - Event ID for ownership verification
  "imageUrls": [
    {
      "tempUrl": "string", // Temporary image URL
      "imageType": "string", // "logo", "sub-event", "background"
      "fileName": "string", // Original filename
      "subeventId": "number" // Optional - for sub-event images
    }
  ]
}
```

**Request Example**:
```javascript
const response = await fetch('/api/finalize-images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventId: "123",
    imageUrls: [
      {
        tempUrl: "https://storage.com/temp/logos/timestamp_logo.png",
        imageType: "logo",
        fileName: "wedding-logo.png"
      },
      {
        tempUrl: "https://storage.com/temp/sub-events/timestamp_ceremony.jpg",
        imageType: "sub-event", 
        fileName: "ceremony-photo.jpg",
        subeventId: 456
      }
    ]
  })
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "finalizedUrls": [
    {
      "originalUrl": "string", // Original temporary URL
      "finalUrl": "string", // New permanent URL
      "imageType": "string", // Image category
      "success": true
    }
  ],
  "errors": [
    {
      "url": "string", // Failed URL
      "error": "string" // Error message
    }
  ],
  "message": "string" // Summary message
}
```

**Frontend Usage**:
- `src/app/utils/imageUpload.js:32` - Finalizing images after event save

## Business Logic

### Migration Process Flow
1. **Authentication**: Validate user access
2. **Event Ownership**: Verify user owns the event
3. **File Processing**: For each image URL:
   - Extract temporary file path
   - Download from temporary location
   - Upload to permanent location
   - Generate new public URL
   - Store metadata in database
   - Update main table references
   - Delete temporary file

### Path Transformation
```javascript
// Extract path from temporary URL
const tempPath = new URL(tempUrl).pathname.split('/').pop();
const tempFilePath = `temp/${imageType}/${tempPath}`;
const permanentFilePath = `${imageType}/${tempPath}`;
```

### File Migration
```javascript
// Download from temporary location
const { data: fileData, error: downloadError } = await supabase.storage
  .from('event-assets')
  .download(tempFilePath);

// Upload to permanent location  
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('event-assets')
  .upload(permanentFilePath, fileData, {
    upsert: false
  });

// Get new public URL
const { data: { publicUrl } } = supabase.storage
  .from('event-assets')
  .getPublicUrl(permanentFilePath);
```

### Metadata Storage
Creates comprehensive metadata records:
```javascript
const imageMetadata = {
  event_id: parseInt(eventId),
  image_type: imageType,
  file_name: fileName,
  file_path: permanentFilePath,
  file_size: fileData.size,
  mime_type: fileData.type || 'image/jpeg',
  public_url: publicUrl,
  uploaded_by: userProfile.id,
  subevent_id: subeventId ? parseInt(subeventId) : null,
  created_at: new Date().toISOString(),
};

await supabase
  .from("event_images")
  .insert(imageMetadata);
```

### Table Updates
Updates main tables for faster access:
```javascript
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
} else if (imageType === 'sub-event' && subeventId) {
  await supabase
    .from("subevents")
    .update({ image_url: publicUrl })
    .eq("id", subeventId);
}
```

### Cleanup Process
```javascript
// Delete temporary file after successful migration
try {
  await supabase.storage
    .from('event-assets')
    .remove([tempFilePath]);
} catch (deleteError) {
  console.warn("Failed to delete temp file:", deleteError);
}
```

## Authentication & Authorization

### Access Control
```javascript
// Get user profile to verify ownership
const { data: userProfile, error: profileError } = await supabase
  .from("users")
  .select("id")
  .eq("supa_id", user.id)
  .single();
```

### Event Ownership Verification
Only the event owner can finalize images for their events. This prevents unauthorized users from finalizing images for events they don't own.

## Error Handling

### Individual Image Processing
Each image is processed independently with error isolation:
```javascript
for (const imageData of imageUrls) {
  try {
    // Process individual image...
    finalizedUrls.push({
      originalUrl: tempUrl,
      finalUrl: publicUrl,
      imageType: imageType,
      success: true
    });
  } catch (error) {
    errors.push({ 
      url: tempUrl, 
      error: error.message 
    });
  }
}
```

### Common Error Scenarios
- **Download Failures**: Temporary file not found or corrupted
- **Upload Failures**: Storage quota exceeded or permissions issues
- **Database Failures**: Metadata storage or table update failures
- **Cleanup Failures**: Temporary file deletion issues (non-blocking)

### Error Response Examples
```javascript
// Authentication error
{
  "error": "Unauthorized"
}

// Missing parameters
{
  "error": "Event ID and image URLs are required"
}

// Processing errors (partial success)
{
  "success": true,
  "finalizedUrls": [...],
  "errors": [
    {
      "url": "https://temp-url.com/image.jpg",
      "error": "Failed to download temp image: File not found"
    }
  ],
  "message": "Finalized 2 images, 1 error"
}
```

## Performance Considerations

### Sequential Processing
Images are processed sequentially to:
- Prevent storage API rate limiting
- Ensure proper error tracking
- Maintain transaction consistency
- Avoid concurrent access issues

### Optimization Opportunities
- **Batch Operations**: Could implement batch metadata inserts
- **Parallel Downloads**: For independent images from different sources
- **Compression**: Optimize images during migration
- **CDN Warming**: Pre-warm CDN cache for new URLs

### Storage Efficiency
- **Duplicate Detection**: Could check for existing files with same content
- **Format Optimization**: Convert to optimal formats during migration
- **Size Optimization**: Implement image resizing if needed

## Use Cases

### Event Creation Workflow
1. **Draft Phase**: Images uploaded to temporary storage
2. **Event Save**: User finalizes event creation
3. **Image Finalization**: This endpoint moves images to permanent storage
4. **URL Updates**: Event records updated with permanent URLs
5. **Cleanup**: Temporary files removed

### Image Management
- **Bulk Migration**: Move multiple images in single operation
- **Type Organization**: Maintain organized folder structure
- **Metadata Tracking**: Complete audit trail of image operations

## Database Tables Affected

**Read Operations**:
- `users` - User profile verification

**Write Operations**:
- `event_images` - Metadata storage for all finalized images
- `events` - Logo and background URL updates
- `subevents` - Sub-event image URL updates

**Storage Operations**:
- Download from `temp/` folders
- Upload to permanent folders
- Delete temporary files

## Integration Notes

### Frontend Integration
Called after successful event creation:
```javascript
// After event is successfully saved
if (tempImageUrls.length > 0) {
  await finalizeImages(eventId, tempImageUrls);
}
```

### Error Recovery
If finalization fails partially:
- Successfully migrated images remain in permanent storage
- Failed images remain in temporary storage
- Frontend can retry failed images individually
- Temporary cleanup happens in separate process

### Atomic Operations
While individual images are processed separately, the overall operation maintains consistency:
- Database metadata only created for successful migrations
- Table updates only happen for successful uploads
- Temporary cleanup only happens after successful migration

## Security Considerations

### Access Control
- User must own the event to finalize its images
- Temporary URLs must be valid and accessible
- File validation during download process

### Storage Security
- Proper bucket permissions for read/write operations
- Path validation to prevent directory traversal
- File type verification during migration

## Related Endpoints

- [`POST /api/upload`](./upload.md) - Initial image upload to temporary storage
- [`POST /api/cleanup-temp-images`](./cleanup-temp-images.md) - Clean up unused temporary images
- [`POST /api/events`](./events.md) - Event creation that triggers finalization

## Best Practices

### Implementation
- Always validate user ownership before processing
- Handle each image independently to isolate failures
- Maintain detailed error logs for debugging
- Implement retry logic for transient failures

### Storage Management
- Regular cleanup of old temporary files
- Monitor storage usage and quotas
- Implement backup strategies for permanent images
- Consider image optimization during migration

### Error Handling
- Provide detailed error information for debugging
- Don't fail entire operation for individual image failures
- Log all operations for audit purposes
- Implement rollback for critical failures