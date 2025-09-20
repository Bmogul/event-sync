# Cleanup Temp Images API Endpoint

**Endpoint**: `/api/cleanup-temp-images`

**Description**: Removes unused temporary images from storage. This endpoint helps maintain storage efficiency by cleaning up temporary images that were uploaded but never finalized, typically when users abandon event creation or when images are replaced.

## Endpoints

### POST /api/cleanup-temp-images

Removes specified temporary images from storage.

**Authentication**: Required (Bearer token)

**Request Body Schema**:
```javascript
{
  "imageUrls": [
    "string" // Array of temporary image URLs to clean up
  ]
}
```

**Request Example**:
```javascript
const response = await fetch('/api/cleanup-temp-images', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    imageUrls: [
      "https://storage.com/temp/logos/timestamp_logo.png",
      "https://storage.com/temp/backgrounds/timestamp_bg.jpg",
      "https://storage.com/temp/sub-events/timestamp_ceremony.png"
    ]
  })
});
```

**Response Schema**:
```javascript
{
  "success": true,
  "cleanedUrls": [
    {
      "url": "string", // Original URL
      "path": "string", // Storage path that was cleaned
      "success": true
    }
  ],
  "errors": [
    {
      "url": "string", // Failed URL
      "error": "string" // Error message
    }
  ],
  "message": "string" // Summary: "Cleaned X images, Y errors"
}
```

**Frontend Usage**:
- `src/app/utils/imageUpload.js:56` - Cleaning up temporary images
- `src/app/create-event/page.js:179` - Page unload cleanup using `navigator.sendBeacon`

## Business Logic

### Cleanup Process Flow
1. **Authentication**: Validate user session
2. **URL Processing**: For each image URL:
   - Extract filename from URL
   - Search across temporary folders
   - Locate file in storage
   - Delete file from storage
   - Track success/failure
3. **Response Compilation**: Return cleanup results

### File Location Discovery
The endpoint searches across multiple temporary folder structures:
```javascript
const tempFolders = ['temp/logos', 'temp/sub-events', 'temp/backgrounds'];

for (const folder of tempFolders) {
  const testPath = `${folder}/${fileName}`;
  
  // Check if file exists in this folder
  const { data, error } = await supabase.storage
    .from('event-assets')
    .list(folder, {
      search: fileName
    });

  if (!error && data && data.some(file => file.name === fileName)) {
    tempFilePath = testPath;
    break;
  }
}
```

### File Deletion
```javascript
if (tempFilePath) {
  // Delete the temporary file
  const { error: deleteError } = await supabase.storage
    .from('event-assets')
    .remove([tempFilePath]);

  if (!deleteError) {
    cleanedUrls.push({
      url: imageUrl,
      path: tempFilePath,
      success: true
    });
  }
}
```

### Error Handling Per File
Each file is processed independently:
```javascript
for (const imageUrl of imageUrls) {
  try {
    // Process individual file cleanup...
  } catch (error) {
    errors.push({ 
      url: imageUrl, 
      error: error.message 
    });
  }
}
```

## Use Cases

### Event Creation Abandonment
When users start creating an event but don't complete it:
```javascript
// On page unload or navigation away
window.addEventListener('beforeunload', () => {
  if (tempImageUrls.length > 0) {
    navigator.sendBeacon('/api/cleanup-temp-images', JSON.stringify({
      imageUrls: tempImageUrls
    }));
  }
});
```

### Image Replacement
When users upload new images to replace existing temporary ones:
```javascript
// Before uploading new image, clean up old one
if (previousTempUrl) {
  await cleanupTempImages([previousTempUrl]);
}
```

### Batch Cleanup
Cleaning up multiple unused images at once:
```javascript
const unusedImages = tempImages.filter(img => !img.isUsed);
await cleanupTempImages(unusedImages.map(img => img.url));
```

## Authentication & Authorization

### Access Control
```javascript
// Get the current user
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError || !user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Permission Model
- **User Authentication**: Requires valid session token
- **No Event Ownership Check**: Any authenticated user can clean up temporary images
- **Temporary Files Only**: Only operates on files in `temp/` folders

### Security Considerations
- Only temporary folders are searched to prevent deletion of permanent images
- File existence is verified before deletion attempts
- No access to permanent storage paths

## Performance Considerations

### Sequential Processing
Files are processed one at a time to:
- Avoid storage API rate limits
- Provide detailed error tracking per file
- Handle large cleanup batches gracefully

### Storage API Efficiency
- **List Operations**: Uses targeted folder searches
- **Batch Potential**: Could be optimized for batch deletions
- **Error Isolation**: Individual failures don't stop the entire process

### Memory Usage
- Processes URLs one at a time rather than loading all into memory
- No file content download required - only deletion operations
- Minimal memory footprint for large cleanup operations

## Error Handling

### Common Error Scenarios
1. **File Not Found**: Temporary file already cleaned up or moved
2. **Storage Permissions**: Insufficient permissions to delete files
3. **Network Issues**: Temporary connectivity problems
4. **Invalid URLs**: Malformed or inaccessible URLs

### Error Response Examples
```javascript
// File not found (warning, not error)
{
  "url": "https://storage.com/temp/image.jpg",
  "error": "File not found"
}

// Storage permission error
{
  "url": "https://storage.com/temp/image.jpg", 
  "error": "Insufficient permissions to delete file"
}

// Invalid URL format
{
  "url": "invalid-url",
  "error": "Invalid URL format"
}
```

### Non-Blocking Errors
File not found errors are treated as warnings since:
- File may have already been cleaned up
- File may have been moved to permanent storage
- Multiple cleanup attempts are common in frontend workflows

## Integration Patterns

### Page Unload Cleanup
```javascript
// In event creation page
useEffect(() => {
  const handleUnload = () => {
    if (tempImageUrls.length > 0) {
      // Use sendBeacon for reliable cleanup on page unload
      navigator.sendBeacon('/api/cleanup-temp-images', JSON.stringify({
        imageUrls: tempImageUrls
      }));
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  return () => window.removeEventListener('beforeunload', handleUnload);
}, [tempImageUrls]);
```

### Form Reset Cleanup
```javascript
// When user resets form or starts over
const handleFormReset = async () => {
  if (tempImageUrls.length > 0) {
    await cleanupTempImages(tempImageUrls);
    setTempImageUrls([]);
  }
};
```

### Utility Function
```javascript
// src/app/utils/imageUpload.js
export const cleanupTempImages = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return;

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

## Database Tables

**No Database Operations**: This endpoint only interacts with Supabase Storage, not database tables.

**Storage Operations**:
- List files in temporary folders
- Delete files from temporary storage
- No metadata updates required

## Monitoring & Maintenance

### Storage Monitoring
Consider implementing:
- Regular automated cleanup of old temporary files
- Storage usage monitoring and alerts
- Cleanup operation logging for auditing

### Performance Metrics
Track:
- Cleanup operation success rates
- Average cleanup response times
- Storage space recovered
- Common error patterns

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

## Related Endpoints

- [`POST /api/upload`](./upload.md) - Upload images to temporary storage
- [`POST /api/finalize-images`](./finalize-images.md) - Move temporary images to permanent storage
- [`POST /api/events`](./events.md) - Event creation that may trigger cleanup

## Best Practices

### Frontend Integration
- Call cleanup when user navigation abandons event creation
- Clean up replaced images immediately
- Use `navigator.sendBeacon` for reliable cleanup on page unload
- Implement retry logic for failed cleanup operations

### Storage Management
- Regular automated cleanup of old temporary files
- Monitor temporary storage usage
- Set up alerts for storage quota issues
- Consider implementing file age-based cleanup

### Error Handling
- Treat "file not found" as success for cleanup operations
- Log all cleanup operations for auditing
- Don't fail application flow for cleanup failures
- Provide user feedback for successful cleanup operations

### Performance
- Batch cleanup operations when possible
- Avoid excessive cleanup API calls
- Consider debouncing cleanup requests
- Monitor cleanup operation performance