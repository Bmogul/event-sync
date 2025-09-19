import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// POST - Create new guests
export async function POST(request, { params }) {
  try {
    const { eventID } = params;
    const body = await request.json();
    const { guests, event } = body;
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

    // Get event details and verify it exists
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

    if (!guests || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { error: 'No guests provided' },
        { status: 400 }
      );
    }

    console.log(`Creating ${guests.length} guests for event ${eventID} by user ${userProfile.id}`);

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

    // Helper function to get gender ID from string
    const getGenderIdFromString = (genderString) => {
      if (!genderString || !genderString.trim()) return null;
      
      const normalizedGender = genderString.toLowerCase().trim();
      
      if (normalizedGender === 'male' || normalizedGender === 'm') return genderMap['male'];
      if (normalizedGender === 'female' || normalizedGender === 'f') return genderMap['female'];
      if (normalizedGender === 'other') return genderMap['other'];
      
      return genderMap[normalizedGender] || null;
    };

    // Helper function to get age group ID from string
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
    const calculateGuestLimit = (guestTypeId, providedGuestLimit, guestName = "") => {
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
            throw new Error(`Guest limit is required for multiple guest type and must be >= 0${guestName ? ` (guest: ${guestName})` : ''}`);
          }
          return parseInt(providedGuestLimit);
        default:
          return 1; // Default to single behavior
      }
    };

    // Process guests to create groups first
    const groupsToCreate = new Map();
    const guestsToCreate = [];

    for (const guest of guests) {
      const groupTitle = guest.group || `${guest.name} (Individual)`;
      
      if (!groupsToCreate.has(groupTitle)) {
        groupsToCreate.set(groupTitle, {
          title: groupTitle,
          event_id: eventData.id, // Use verified event ID
          size_limit: -1,
          status_id: 1, // draft status
          details: {
            color: "#7c3aed",
            description: guest.group ? "Group" : "Individual guest"
          }
        });
      }
    }

    // Create groups
    const { data: createdGroups, error: groupError } = await supabase
      .from("guest_groups")
      .insert([...groupsToCreate.values()])
      .select();

    if (groupError) {
      console.error("Error creating groups:", groupError);
      return NextResponse.json(
        { error: 'Failed to create groups' },
        { status: 500 }
      );
    }

    // Create group mapping
    const groupMap = createdGroups.reduce((acc, group) => {
      acc[group.title] = group.id;
      return acc;
    }, {});

    // Process guests
    for (const guest of guests) {
      const groupTitle = guest.group || `${guest.name} (Individual)`;
      const groupId = groupMap[groupTitle];

      if (!groupId) {
        console.error(`No group ID found for: ${groupTitle}`);
        continue;
      }

      const genderId = getGenderIdFromString(guest.gender);
      const ageGroupId = getAgeGroupIdFromString(guest.ageGroup);
      const guestTypeId = getGuestTypeIdFromString(guest.guestType);
      
      let calculatedGuestLimit;
      try {
        calculatedGuestLimit = calculateGuestLimit(guestTypeId, guest.guestLimit, guest.name);
      } catch (error) {
        console.error(`Validation error for guest ${guest.name}:`, error.message);
        return NextResponse.json(
          { error: `Validation error for guest ${guest.name}: ${error.message}` },
          { status: 400 }
        );
      }

      const guestPayload = {
        group_id: groupId,
        public_id: crypto.randomUUID(),
        name: guest.name,
        email: guest.email && guest.email.trim() ? guest.email.trim() : null,
        phone: guest.phone && guest.phone.trim() ? guest.phone.trim() : null,
        tag: guest.tag || null,
        gender_id: genderId,
        age_group_id: ageGroupId,
        guest_type_id: guestTypeId,
        guest_limit: calculatedGuestLimit,
        point_of_contact: guest.isPointOfContact || false
      };

      guestsToCreate.push(guestPayload);
    }

    // Insert guests
    const { data: createdGuests, error: guestError } = await supabase
      .from("guests")
      .insert(guestsToCreate)
      .select();

    if (guestError) {
      console.error("Error creating guests:", guestError);
      return NextResponse.json(
        { error: 'Failed to create guests' },
        { status: 500 }
      );
    }

    console.log(`Successfully created ${createdGuests.length} guests`);

    // Create RSVP entries for sub-event invitations (backward compatible)
    const hasInvitations = guests.some(g => g.subEventInvitations && g.subEventInvitations.length > 0);
    
    if (hasInvitations) {
      const rsvpEntries = [];
      
      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i];
        const createdGuest = createdGuests[i];
        
        if (guest.subEventInvitations && guest.subEventInvitations.length > 0) {
          for (const subEventId of guest.subEventInvitations) {
            rsvpEntries.push({
              guest_id: createdGuest.id,
              subevent_id: parseInt(subEventId),
              status_id: 1, // 1 = "invited" status
              created_at: new Date().toISOString()
            });
          }
        }
      }
      
      if (rsvpEntries.length > 0) {
        const { error: rsvpError } = await supabase
          .from("rsvps")
          .insert(rsvpEntries);
          
        if (rsvpError) {
          console.error("Error creating RSVP entries:", rsvpError);
          // Don't fail the entire operation, just log the error
        } else {
          console.log(`Created ${rsvpEntries.length} RSVP invitations`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      guests: createdGuests,
      groups: createdGroups
    });

  } catch (error) {
    console.error('Error in guest creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}