import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// DELETE - Remove a guest
export async function DELETE(request, { params }) {
  try {
    const { eventID, guestId } = params;

    console.log(`Deleting guest ${guestId} from event ${eventID}`);

    // Get guest info before deletion to handle group cleanup
    const { data: guestToDelete, error: fetchError } = await supabase
      .from("guests")
      .select(`
        id,
        name,
        group_id,
        point_of_contact,
        guest_groups(id, title, event_id)
      `)
      .eq("id", guestId)
      .single();

    if (fetchError || !guestToDelete) {
      console.error("Error fetching guest:", fetchError);
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Verify the guest belongs to the correct event
    if (guestToDelete.guest_groups.event_id !== parseInt(eventID)) {
      return NextResponse.json(
        { error: 'Guest does not belong to this event' },
        { status: 403 }
      );
    }

    // Delete the guest
    const { error: deleteError } = await supabase
      .from("guests")
      .delete()
      .eq("id", guestId);

    if (deleteError) {
      console.error("Error deleting guest:", deleteError);
      return NextResponse.json(
        { error: 'Failed to delete guest' },
        { status: 500 }
      );
    }

    // Check if this was the last guest in the group
    const { data: remainingGuests, error: countError } = await supabase
      .from("guests")
      .select("id")
      .eq("group_id", guestToDelete.group_id);

    if (countError) {
      console.error("Error counting remaining guests:", countError);
    } else if (remainingGuests.length === 0) {
      // Delete the empty group
      const { error: groupDeleteError } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", guestToDelete.group_id);

      if (groupDeleteError) {
        console.error("Error deleting empty group:", groupDeleteError);
      } else {
        console.log(`Deleted empty group ${guestToDelete.group_id}`);
      }
    } else if (guestToDelete.point_of_contact) {
      // If the deleted guest was POC, assign POC to the first remaining member
      const { error: pocUpdateError } = await supabase
        .from("guests")
        .update({ point_of_contact: true })
        .eq("id", remainingGuests[0].id);

      if (pocUpdateError) {
        console.error("Error updating POC:", pocUpdateError);
      } else {
        console.log(`Transferred POC status to guest ${remainingGuests[0].id}`);
      }
    }

    console.log(`Successfully deleted guest ${guestId}`);

    return NextResponse.json({
      success: true,
      message: 'Guest deleted successfully'
    });

  } catch (error) {
    console.error('Error in guest deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a guest
export async function PUT(request, { params }) {
  try {
    const { eventID, guestId } = params;
    const body = await request.json();
    const { guest } = body;

    console.log(`Updating guest ${guestId} in event ${eventID}`);

    // Fetch lookup tables for gender and age group
    const { data: genderLookup, error: genderError } = await supabase
      .from("guest_gender")
      .select("id, state");
    
    const { data: ageGroupLookup, error: ageGroupError } = await supabase
      .from("guest_age_group")
      .select("id, state");

    if (genderError || ageGroupError) {
      console.error("Error fetching lookup tables:", genderError || ageGroupError);
      return NextResponse.json(
        { error: 'Failed to fetch lookup tables' },
        { status: 500 }
      );
    }

    // Create lookup mappings
    const genderMap = genderLookup.reduce((acc, item) => {
      acc[item.state.toLowerCase()] = item.id;
      return acc;
    }, {});

    const ageGroupMap = ageGroupLookup.reduce((acc, item) => {
      acc[item.state.toLowerCase()] = item.id;
      return acc;
    }, {});

    // Helper functions
    const getGenderIdFromString = (genderString) => {
      if (!genderString || !genderString.trim()) return null;
      const normalizedGender = genderString.toLowerCase().trim();
      if (normalizedGender === 'male' || normalizedGender === 'm') return genderMap['male'];
      if (normalizedGender === 'female' || normalizedGender === 'f') return genderMap['female'];
      if (normalizedGender === 'other') return genderMap['other'];
      return genderMap[normalizedGender] || null;
    };

    const getAgeGroupIdFromString = (ageGroupString) => {
      if (!ageGroupString || !ageGroupString.trim()) return null;
      const normalizedAgeGroup = ageGroupString.toLowerCase().trim();
      return ageGroupMap[normalizedAgeGroup] || null;
    };

    const genderId = getGenderIdFromString(guest.gender);
    const ageGroupId = getAgeGroupIdFromString(guest.ageGroup);

    // Update guest
    const { data: updatedGuest, error: updateError } = await supabase
      .from("guests")
      .update({
        name: guest.name,
        email: guest.email && guest.email.trim() ? guest.email.trim() : null,
        phone: guest.phone && guest.phone.trim() ? guest.phone.trim() : null,
        tag: guest.tag || null,
        gender_id: genderId,
        age_group_id: ageGroupId,
        point_of_contact: guest.isPointOfContact || false
      })
      .eq("id", guestId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating guest:", updateError);
      return NextResponse.json(
        { error: 'Failed to update guest' },
        { status: 500 }
      );
    }

    console.log(`Successfully updated guest ${guestId}`);

    return NextResponse.json({
      success: true,
      guest: updatedGuest
    });

  } catch (error) {
    console.error('Error in guest update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}