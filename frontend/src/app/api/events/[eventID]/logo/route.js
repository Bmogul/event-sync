import { NextResponse } from 'next/server';
import { BrandManager } from '../../../../lib/brandManager.js';

export async function POST(request, { params }) {
  try {
    const eventId = params.eventID;
    const formData = await request.formData();
    const file = formData.get('logo');
    const userId = formData.get('userId') || 'anonymous';

    if (!file) {
      return NextResponse.json(
        { error: 'No logo file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = BrandManager.validateLogoFile(file);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Invalid logo file', details: validation.errors },
        { status: 400 }
      );
    }

    // Upload and set logo
    const result = await BrandManager.uploadAndSetLogo(file, eventId, userId);

    return NextResponse.json({
      success: true,
      logoUrl: result.url,
      fileName: result.fileName,
      settings: result.settings
    }, { status: 200 });

  } catch (error) {
    console.error('Logo upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const eventId = params.eventID;
    
    // Get current settings to find logo to delete
    const brandSettings = await BrandManager.getBrandSettings(eventId);
    
    if (!brandSettings.logo_url) {
      return NextResponse.json(
        { error: 'No logo to delete' },
        { status: 404 }
      );
    }

    // Extract file path from URL
    const filePath = BrandManager.extractPathFromUrl(brandSettings.logo_url);
    
    if (filePath) {
      await BrandManager.deleteLogo(filePath);
    }

    // Remove logo from settings
    await BrandManager.updateBrandSettings(eventId, {
      ...brandSettings,
      logo_url: null,
      logo_alt_text: 'Event Logo'
    });

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Logo delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete logo', details: error.message },
      { status: 500 }
    );
  }
}