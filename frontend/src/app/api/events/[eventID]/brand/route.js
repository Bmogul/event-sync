import { NextResponse } from 'next/server';
import { BrandManager } from '../../../../lib/brandManager.js';

export async function GET(request, { params }) {
  try {
    const eventId = params.eventID;
    const { searchParams } = new URL(request.url);
    const includePresets = searchParams.get('includePresets') === 'true';
    
    const brandSettings = await BrandManager.getBrandSettings(eventId);
    
    const response = { settings: brandSettings };
    
    if (includePresets) {
      response.presets = BrandManager.getBrandPresets();
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Get brand settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const eventId = params.eventID;
    const body = await request.json();
    
    const {
      logo_url,
      logo_alt_text,
      primary_color,
      background_color,
      sender_name,
      sender_email,
      custom_message,
      preset // Special field for applying presets
    } = body;

    // If a preset is specified, apply it
    if (preset) {
      const settings = await BrandManager.applyBrandPreset(eventId, preset);
      return NextResponse.json({ settings }, { status: 200 });
    }

    // Validate colors
    if (primary_color && !BrandManager.isValidHexColor(primary_color)) {
      return NextResponse.json(
        { error: 'Invalid primary color format' },
        { status: 400 }
      );
    }

    if (background_color && !BrandManager.isValidHexColor(background_color)) {
      return NextResponse.json(
        { error: 'Invalid background color format' },
        { status: 400 }
      );
    }

    const updateData = {};
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (logo_alt_text !== undefined) updateData.logo_alt_text = logo_alt_text;
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (background_color !== undefined) updateData.background_color = background_color;
    if (sender_name !== undefined) updateData.sender_name = sender_name;
    if (sender_email !== undefined) updateData.sender_email = sender_email;
    if (custom_message !== undefined) updateData.custom_message = custom_message;

    const settings = await BrandManager.updateBrandSettings(eventId, updateData);
    
    // Include color palette if primary color was updated
    let colorPalette = null;
    if (primary_color) {
      colorPalette = BrandManager.generateColorPalette(primary_color);
    }

    return NextResponse.json({ 
      settings,
      colorPalette 
    }, { status: 200 });

  } catch (error) {
    console.error('Update brand settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to update brand settings', details: error.message },
      { status: 500 }
    );
  }
}