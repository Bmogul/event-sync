import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

// Clean up temporary images that were never finalized
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
    const { imageUrls } = await request.json();

    if (!imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json({ error: "Image URLs array is required" }, { status: 400 });
    }

    console.log("Cleaning up temporary images:", { imageCount: imageUrls.length });

    const cleanedUrls = [];
    const errors = [];

    // Process each image URL
    for (const imageUrl of imageUrls) {
      try {
        // Extract the temp path from the URL
        const urlPath = new URL(imageUrl).pathname;
        const fileName = urlPath.split('/').pop();
        
        // Construct the full temp path - need to determine the correct folder
        let tempFilePath = null;
        
        // Try different temp folder structures
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

        if (!tempFilePath) {
          console.warn("Temp file not found:", fileName);
          errors.push({ url: imageUrl, error: "File not found" });
          continue;
        }

        // Delete the temporary file
        const { error: deleteError } = await supabase.storage
          .from('event-assets')
          .remove([tempFilePath]);

        if (deleteError) {
          console.error("Failed to delete temp file:", deleteError);
          errors.push({ url: imageUrl, error: deleteError.message });
          continue;
        }

        cleanedUrls.push({
          url: imageUrl,
          path: tempFilePath,
          success: true
        });

        console.log("Temp image cleaned successfully:", tempFilePath);

      } catch (error) {
        console.error("Error cleaning temp image:", error);
        errors.push({ url: imageUrl, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      cleanedUrls,
      errors,
      message: `Cleaned ${cleanedUrls.length} images, ${errors.length} errors`
    });

  } catch (error) {
    console.error("Cleanup temp images API error:", error);
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