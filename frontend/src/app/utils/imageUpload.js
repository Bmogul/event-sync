/**
 * Image upload utilities for handling file uploads to the server
 */

// Supported image formats for validation
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  logo: 5 * 1024 * 1024,        // 5MB
  'sub-event': 10 * 1024 * 1024, // 10MB
  background: 10 * 1024 * 1024   // 10MB
};

/**
 * Validate an image file before upload
 * @param {File} file - The file to validate
 * @param {string} imageType - Type of image (logo, sub-event, background)
 * @returns {object} - Validation result with isValid boolean and errors array
 */
export function validateImageFile(file, imageType = 'logo') {
  const errors = [];
  
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }

  // Check file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file format. Please use: JPG, PNG, WebP, GIF, or SVG`);
  }

  // Check file size
  const maxSize = FILE_SIZE_LIMITS[imageType] || FILE_SIZE_LIMITS.logo;
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    errors.push(`File too large. Maximum size: ${maxSizeMB}MB`);
  }

  // Check for empty file
  if (file.size === 0) {
    errors.push('File is empty');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Compress and resize image before upload (client-side optimization)
 * @param {File} file - Original image file
 * @param {object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export function compressImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'image/jpeg'
    } = options;

    // Skip compression for SVG files
    if (file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file from compressed blob
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        format,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload an image file to the server
 * @param {File} file - Image file to upload
 * @param {string} eventId - ID of the event
 * @param {string} imageType - Type of image (logo, sub-event, background)
 * @param {object} options - Upload options
 * @returns {Promise<object>} - Upload result with URL and metadata
 */
export async function uploadImage(file, eventId, imageType = 'logo', options = {}) {
  const {
    compress = true,
    onProgress = null,
    signal = null, // AbortController signal for cancellation
    isTemporary = true // Default to temporary uploads during editing
  } = options;

  try {
    // Validate file first
    const validation = validateImageFile(file, imageType);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
    }

    // Compress image if enabled and not SVG
    let fileToUpload = file;
    if (compress && file.type !== 'image/svg+xml') {
      try {
        fileToUpload = await compressImage(file, {
          maxWidth: imageType === 'logo' ? 800 : 1920,
          maxHeight: imageType === 'logo' ? 600 : 1080,
          quality: 0.85
        });
        console.log(`Image compressed: ${file.size} -> ${fileToUpload.size} bytes`);
      } catch (compressionError) {
        console.warn('Image compression failed, using original file:', compressionError);
        fileToUpload = file;
      }
    }

    // Create form data
    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('eventId', eventId);
    formData.append('imageType', imageType);
    formData.append('isTemporary', isTemporary.toString());

    // Upload to server
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal, // For request cancellation
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return {
      success: true,
      url: result.url,
      metadata: result.metadata,
      originalSize: file.size,
      compressedSize: fileToUpload.size,
      compressionRatio: file.size > 0 ? (fileToUpload.size / file.size) : 1
    };

  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files
 * @param {string} eventId - ID of the event
 * @param {string} imageType - Type of images
 * @param {object} options - Upload options
 * @returns {Promise<object[]>} - Array of upload results
 */
export async function uploadMultipleImages(files, eventId, imageType = 'sub-event', options = {}) {
  const {
    concurrent = 3, // Number of concurrent uploads
    onProgress = null
  } = options;

  const results = [];
  const errors = [];

  // Process files in batches
  for (let i = 0; i < files.length; i += concurrent) {
    const batch = files.slice(i, i + concurrent);
    
    const batchPromises = batch.map(async (file, index) => {
      try {
        const result = await uploadImage(file, eventId, imageType, {
          ...options,
          onProgress: (progress) => {
            if (onProgress) {
              onProgress({
                fileIndex: i + index,
                fileName: file.name,
                progress,
                totalFiles: files.length
              });
            }
          }
        });
        return { success: true, file: file.name, ...result };
      } catch (error) {
        return { success: false, file: file.name, error: error.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return {
    results,
    successful: results.filter(r => r.success),
    failed: results.filter(r => !r.success),
    totalUploaded: results.filter(r => r.success).length,
    totalFailed: results.filter(r => !r.success).length
  };
}

/**
 * Get file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a preview URL for an image file
 * @param {File} file - Image file
 * @returns {string} - Preview URL (blob URL)
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 * @param {string} url - Preview URL to revoke
 */
export function revokePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Finalize temporary images by moving them to permanent storage
 * @param {string} eventId - ID of the event
 * @param {Array} imageData - Array of image data objects with tempUrl, imageType, fileName, subeventId
 * @returns {Promise<object>} - Result of finalization
 */
export async function finalizeImages(eventId, imageData) {
  try {
    const response = await fetch('/api/finalize-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
        imageUrls: imageData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Finalization failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Finalization failed');
    }

    return result;

  } catch (error) {
    console.error('Image finalization error:', error);
    throw error;
  }
}

/**
 * Extract image data from event data for finalization
 * @param {object} eventData - Event data object
 * @returns {Array} - Array of image data for finalization
 */
export function extractImageDataForFinalization(eventData) {
  const imageData = [];

  // Extract logo
  if (eventData.rsvpSettings?.logo && eventData.rsvpSettings?.logoFile) {
    imageData.push({
      tempUrl: eventData.rsvpSettings.logo,
      imageType: 'logo',
      fileName: eventData.rsvpSettings.logoFile.name || 'logo.jpg',
      subeventId: null
    });
  }

  // Extract background image
  if (eventData.rsvpSettings?.backgroundImage && eventData.rsvpSettings?.backgroundImageFile) {
    imageData.push({
      tempUrl: eventData.rsvpSettings.backgroundImage,
      imageType: 'background',
      fileName: eventData.rsvpSettings.backgroundImageFile.name || 'background.jpg',
      subeventId: null
    });
  }

  // Extract sub-event images
  if (eventData.subEvents) {
    eventData.subEvents.forEach((subEvent, index) => {
      if (subEvent.image && subEvent.imageFile) {
        imageData.push({
          tempUrl: subEvent.image,
          imageType: 'sub-event',
          fileName: subEvent.imageFile.name || `subevent-${index}.jpg`,
          subeventId: subEvent.id || null // Use actual subevent ID when available
        });
      }
    });
  }

  return imageData;
}

/**
 * Clean up temporary images that were never finalized
 * @param {Array} imageUrls - Array of temporary image URLs to clean up
 * @returns {Promise<object>} - Result of cleanup
 */
export async function cleanupTempImages(imageUrls) {
  try {
    const response = await fetch('/api/cleanup-temp-images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrls
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Cleanup failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Cleanup failed');
    }

    return result;

  } catch (error) {
    console.error('Temp image cleanup error:', error);
    throw error;
  }
}

/**
 * Extract temporary image URLs from event data for cleanup
 * @param {object} eventData - Event data object
 * @returns {Array} - Array of temporary image URLs
 */
export function extractTempImageUrls(eventData) {
  const tempUrls = [];

  // Extract logo URL if it's temporary (stored in supabase temp folder)
  if (eventData.rsvpSettings?.logo && eventData.rsvpSettings.logo.includes('/temp/')) {
    tempUrls.push(eventData.rsvpSettings.logo);
  }

  // Extract background image URL if it's temporary
  if (eventData.rsvpSettings?.backgroundImage && eventData.rsvpSettings.backgroundImage.includes('/temp/')) {
    tempUrls.push(eventData.rsvpSettings.backgroundImage);
  }

  // Extract sub-event image URLs if they're temporary
  if (eventData.subEvents) {
    eventData.subEvents.forEach((subEvent) => {
      if (subEvent.image && subEvent.image.includes('/temp/')) {
        tempUrls.push(subEvent.image);
      }
    });
  }

  return tempUrls;
}