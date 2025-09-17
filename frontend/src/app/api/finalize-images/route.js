import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

// Move images from temporary to permanent storage when event is saved
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

    // Parse the request data
    const { eventId, imageUrls } = await request.json();

    if (!eventId || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: "Event ID and image URLs are required" }, { status: 400 });
    }

    console.log("Finalizing images for event:", { eventId, imageCount: imageUrls.length });

    // Get user profile to verify ownership
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("User profile not found:", profileError);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const finalizedUrls = [];
    const errors = [];

    // Process each image URL
    for (const imageData of imageUrls) {
      const { tempUrl, imageType, fileName, subeventId = null } = imageData;
      
      try {
        // Extract the temp path from the URL
        const tempPath = new URL(tempUrl).pathname.split('/').pop();
        const tempFilePath = `temp/${imageType}/${tempPath}`;
        const permanentFilePath = `${imageType}/${tempPath}`;

        console.log("Moving image:", { tempFilePath, permanentFilePath });

        // Copy from temp to permanent location
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('event-assets')
          .download(tempFilePath);

        if (downloadError) {
          console.error("Failed to download temp image:", downloadError);
          errors.push({ url: tempUrl, error: downloadError.message });
          continue;
        }

        // Upload to permanent location
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-assets')
          .upload(permanentFilePath, fileData, {
            upsert: false
          });

        if (uploadError) {
          console.error("Failed to upload to permanent location:", uploadError);
          errors.push({ url: tempUrl, error: uploadError.message });
          continue;
        }

        // Get the new public URL
        const { data: { publicUrl } } = supabase.storage
          .from('event-assets')
          .getPublicUrl(permanentFilePath);

        // Store metadata in event_images table
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

        try {
          const { error: metadataError } = await supabase
            .from("event_images")
            .insert(imageMetadata);

          if (metadataError) {
            console.warn("Failed to store image metadata:", metadataError);
          }
        } catch (metadataStoreError) {
          console.warn("Image metadata storage failed:", metadataStoreError);
        }

        // Update main table URLs
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
          } else if (imageType === 'sub-event' && subeventId) {
            await supabase
              .from("subevents")
              .update({ image_url: publicUrl })
              .eq("id", subeventId);
          }
        } catch (updateError) {
          console.warn("Failed to update main table URLs:", updateError);
        }

        // Delete the temporary file
        try {
          await supabase.storage
            .from('event-assets')
            .remove([tempFilePath]);
        } catch (deleteError) {
          console.warn("Failed to delete temp file:", deleteError);
        }

        finalizedUrls.push({
          originalUrl: tempUrl,
          finalUrl: publicUrl,
          imageType: imageType,
          success: true
        });

        console.log("Image finalized successfully:", { tempPath, permanentPath: permanentFilePath, publicUrl });

      } catch (error) {
        console.error("Error processing image:", error);
        errors.push({ url: tempUrl, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      finalizedUrls,
      errors,
      message: `Finalized ${finalizedUrls.length} images, ${errors.length} errors`
    });

  } catch (error) {
    console.error("Finalize images API error:", error);
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