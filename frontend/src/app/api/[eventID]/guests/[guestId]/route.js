import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// DELETE - Remove a guest
export async function DELETE(request, { params }) {
  try {
    const { eventID, guestId } = params;
    const supabase = getSupabaseClient();

    // Authentication check - extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { validated: false, message: "Missing authorization token" },
        { status: 401 }
      );
    }

    // Get the current user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { validated: false, message: "Invalid user" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { validated: false, message: "Invalid user profile" },
        { status: 401 }
      );
    }

    console.log(`Deleting guest ${guestId} from event ${eventID} by user ${userProfile.id}`);

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

    // Get event details and verify access
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, public_id, title")
      .eq("public_id", eventID)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Verify the guest belongs to the correct event
    if (guestToDelete.guest_groups.event_id !== eventData.id) {
      return NextResponse.json(
        { error: 'Guest does not belong to this event' },
        { status: 403 }
      );
    }

    // Check access permissions using event_managers table
    const { data: managers, error: managerError } = await supabase
      .from("event_managers")
      .select("*")
      .eq("event_id", eventData.id)
      .eq("user_id", userProfile.id)
      .limit(1);

    if (managerError || !managers || managers.length === 0) {
      return NextResponse.json(
        { validated: false, message: "Access denied - you are not a manager of this event" },
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
    const supabase = getSupabaseClient();

    // Authentication check - extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { validated: false, message: "Missing authorization token" },
        { status: 401 }
      );
    }

    // Get the current user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { validated: false, message: "Invalid user" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { validated: false, message: "Invalid user profile" },
        { status: 401 }
      );
    }

    // Get event details and verify access
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, public_id, title")
      .eq("public_id", eventID)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check access permissions using event_managers table
    const { data: managers, error: managerError } = await supabase
      .from("event_managers")
      .select("*")
      .eq("event_id", eventData.id)
      .eq("user_id", userProfile.id)
      .limit(1);

    if (managerError || !managers || managers.length === 0) {
      return NextResponse.json(
        { validated: false, message: "Access denied - you are not a manager of this event" },
        { status: 403 }
      );
    }

    console.log(`Updating guest ${guestId} in event ${eventID} by user ${userProfile.id}`);

    // Fetch lookup tables for gender, age group, and guest type
    const { data: genderLookup, error: genderError } = await supabase
      .from("guest_gender")
      .select("id, state");
    
    const { data: ageGroupLookup, error: ageGroupError } = await supabase
      .from("guest_age_group")
      .select("id, state");

    const { data: guestTypeLookup, error: guestTypeError } = await supabase
      .from("guest_type")
      .select("id, name, description");

    if (genderError || ageGroupError || guestTypeError) {
      console.error("Error fetching lookup tables:", genderError || ageGroupError || guestTypeError);
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

    const guestTypeMap = guestTypeLookup.reduce((acc, item) => {
      acc[item.name.toLowerCase()] = item.id;
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

    // Helper function to get guest type ID from string
    const getGuestTypeIdFromString = (guestTypeString) => {
      if (!guestTypeString || !guestTypeString.trim()) {
        return guestTypeMap['single']; // Default to 'single' type
      }
      
      const normalizedGuestType = guestTypeString.toLowerCase().trim();
      return guestTypeMap[normalizedGuestType] || guestTypeMap['single'];
    };

    // Helper function to calculate guest limit based on guest type
    const calculateGuestLimit = (guestTypeId, providedGuestLimit) => {
      const guestType = guestTypeLookup.find(type => type.id === guestTypeId);
      if (!guestType) return 1; // Default to single behavior
      
      switch (guestType.name.toLowerCase()) {
        case 'single':
          return 1; // Always 1 for single type
        case 'variable':
          return null; // NULL for infinite
        case 'multiple':
          // Require a positive integer limit for multiple type
          if (providedGuestLimit === null || providedGuestLimit === undefined || providedGuestLimit < 0) {
            throw new Error('Guest limit is required for multiple guest type and must be >= 0');
          }
          return parseInt(providedGuestLimit);
        default:
          return 1; // Default to single behavior
      }
    };

    const genderId = getGenderIdFromString(guest.gender);
    const ageGroupId = getAgeGroupIdFromString(guest.ageGroup);
    const guestTypeId = getGuestTypeIdFromString(guest.guestType);
    
    let calculatedGuestLimit;
    try {
      calculatedGuestLimit = calculateGuestLimit(guestTypeId, guest.guestLimit);
    } catch (error) {
      console.error(`Validation error for guest update:`, error.message);
      return NextResponse.json(
        { error: `Validation error: ${error.message}` },
        { status: 400 }
      );
    }

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
        guest_type_id: guestTypeId,
        guest_limit: calculatedGuestLimit,
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

    // Update RSVP entries for sub-event invitations with preservation (backward compatible)
    if (guest.subEventInvitations !== undefined) {
      try {
        console.log(`Updating RSVP invitations for guest ${guestId} with preservation...`);
        
        // Get existing RSVPs for this guest to preserve responses
        const { data: existingRSVPs, error: existingRSVPError } = await supabase
          .from("rsvps")
          .select("id, subevent_id, status_id, created_at, updated_at")
          .eq("guest_id", parseInt(guestId));
        
        if (existingRSVPError) {
          console.error("Error fetching existing RSVPs:", existingRSVPError);
          return NextResponse.json({
            success: true,
            guest: updatedGuest,
            warning: "Guest updated but RSVP update failed"
          });
        }
        
        const existingRSVPMap = new Map();
        if (existingRSVPs) {
          existingRSVPs.forEach(rsvp => {
            existingRSVPMap.set(rsvp.subevent_id, rsvp);
          });
          console.log(`Found ${existingRSVPs.length} existing RSVPs to consider`);
        }

        if (guest.subEventInvitations && guest.subEventInvitations.length > 0) {
          const newSubEventIds = new Set(guest.subEventInvitations.map(id => parseInt(id)));
          const rsvpsToCreate = [];
          let rsvpsPreserved = 0;
          
          // Process each invitation
          for (const subEventId of guest.subEventInvitations) {
            const subEventIdInt = parseInt(subEventId);
            const existingRSVP = existingRSVPMap.get(subEventIdInt);
            
            if (existingRSVP) {
              // RSVP already exists, preserve it
              rsvpsPreserved++;
              console.log(`Preserving existing RSVP for subevent ${subEventIdInt} with status ${existingRSVP.status_id}`);
            } else {
              // New RSVP needed
              rsvpsToCreate.push({
                guest_id: parseInt(guestId),
                subevent_id: subEventIdInt,
                status_id: 1, // "invited"
                created_at: new Date().toISOString()
              });
            }
          }
          
          // Remove RSVPs for subevents no longer in the invitation list
          const rsvpsToRemove = existingRSVPs?.filter(rsvp => 
            !newSubEventIds.has(rsvp.subevent_id)
          ) || [];
          
          if (rsvpsToRemove.length > 0) {
            console.log(`Removing ${rsvpsToRemove.length} RSVPs for subevents no longer invited`);
            for (const rsvpToRemove of rsvpsToRemove) {
              await supabase
                .from("rsvps")
                .delete()
                .eq("id", rsvpToRemove.id);
            }
          }
          
          // Create new RSVPs
          if (rsvpsToCreate.length > 0) {
            const { error: rsvpError } = await supabase
              .from("rsvps")
              .insert(rsvpsToCreate);
              
            if (rsvpError) {
              console.error("Error creating new RSVP entries:", rsvpError);
            } else {
              console.log(`Created ${rsvpsToCreate.length} new RSVP invitations for guest ${guestId}`);
            }
          }
          
          console.log(`RSVP update summary: ${rsvpsPreserved} preserved, ${rsvpsToCreate.length} created, ${rsvpsToRemove.length} removed`);
        } else {
          // No invitations provided, remove all RSVPs
          if (existingRSVPs && existingRSVPs.length > 0) {
            console.log(`Removing all ${existingRSVPs.length} RSVP invitations for guest ${guestId}`);
            await supabase
              .from("rsvps")
              .delete()
              .eq("guest_id", parseInt(guestId));
          }
        }
      } catch (rsvpError) {
        console.error("Error managing RSVP entries:", rsvpError);
        // Don't fail the guest update operation
      }
    }

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