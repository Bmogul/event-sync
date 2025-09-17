import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

// Supported image formats
const SUPPORTED_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Image type configurations
const IMAGE_TYPES = {
  logo: { bucket: 'event-assets', folder: 'logos', maxSize: 5 * 1024 * 1024 },
  'sub-event': { bucket: 'event-assets', folder: 'sub-events', maxSize: 10 * 1024 * 1024 },
  background: { bucket: 'event-assets', folder: 'backgrounds', maxSize: 10 * 1024 * 1024 }
};

function validateImageFile(file, imageType = 'logo') {
  const errors = [];
  
  // Check if file exists
  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  // Check file type
  if (!SUPPORTED_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
  }

  // Check file size based on image type
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

function generateFileName(originalName, eventId, imageType) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop().toLowerCase();
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  return `${eventId}/${imageType}/${timestamp}_${sanitizedName}`;
}

export async function POST(request) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');
    const eventId = formData.get('eventId');
    const imageType = formData.get('imageType') || 'logo';
    const isTemporary = formData.get('isTemporary') === 'true'; // New flag for temporary uploads

    console.log("Upload request:", { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type, 
      eventId, 
      imageType,
      isTemporary 
    });

    // Validate required fields
    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    if (!IMAGE_TYPES[imageType]) {
      return NextResponse.json({ 
        error: `Invalid image type. Supported types: ${Object.keys(IMAGE_TYPES).join(', ')}` 
      }, { status: 400 });
    }

    // Validate the file
    const validationErrors = validateImageFile(file, imageType);
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: "File validation failed", 
        details: validationErrors 
      }, { status: 400 });
    }

    // Verify user has access to this event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, user_id")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      console.error("Event not found:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get user profile to check ownership
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile || userProfile.id !== eventData.user_id) {
      console.error("Unauthorized access to event:", { userProfile: userProfile?.id, eventUserId: eventData.user_id });
      return NextResponse.json({ error: "Unauthorized access to event" }, { status: 403 });
    }

    // Generate file path
    const typeConfig = IMAGE_TYPES[imageType];
    const fileName = generateFileName(file.name, eventId, typeConfig.folder);
    
    // Use temporary folder for unsaved events
    const folderPath = isTemporary ? `temp/${typeConfig.folder}` : typeConfig.folder;
    const filePath = `${folderPath}/${fileName}`;

    console.log("Uploading to storage:", { bucket: typeConfig.bucket, path: filePath });

    // Convert File to ArrayBuffer for Supabase
    const fileBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(typeConfig.bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ 
        error: "Failed to upload image", 
        details: uploadError.message 
      }, { status: 500 });
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(typeConfig.bucket)
      .getPublicUrl(filePath);

    console.log("Upload successful:", { path: uploadData.path, publicUrl });

    // Store image metadata in database
    const imageMetadata = {
      event_id: parseInt(eventId),
      image_type: imageType,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
      public_url: publicUrl,
      uploaded_by: userProfile.id,
      subevent_id: null, // TODO: Add subevent_id parameter for sub-event images
      created_at: new Date().toISOString(),
    };

    // Only store metadata and update tables for permanent uploads
    if (!isTemporary) {
      // Store metadata in event_images table (if table exists)
      try {
        const { error: metadataError } = await supabase
          .from("event_images")
          .insert(imageMetadata);

        if (metadataError) {
          console.warn("Failed to store image metadata (table may not exist yet):", metadataError);
        }
      } catch (metadataStoreError) {
        console.warn("Image metadata storage failed:", metadataStoreError);
      }

      // Update the main table URLs for faster access
      try {
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
        // TODO: Handle sub-event images when subevent_id is available
      } catch (updateError) {
        console.warn("Failed to update main table URLs:", updateError);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      url: publicUrl,
      isTemporary: isTemporary,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        imageType: imageType,
        uploadPath: filePath,
        folderPath: folderPath,
      }
    });

  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error.message 
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
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