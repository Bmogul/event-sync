import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Create new guests
export async function POST(request, { params }) {
  try {
    const { eventID } = params;
    const body = await request.json();
    const { guests, event } = body;

    if (!guests || !Array.isArray(guests) || guests.length === 0) {
      return NextResponse.json(
        { error: 'No guests provided' },
        { status: 400 }
      );
    }

    console.log(`Creating ${guests.length} guests for event ${eventID}`);

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

    // Process guests to create groups first
    const groupsToCreate = new Map();
    const guestsToCreate = [];

    for (const guest of guests) {
      const groupTitle = guest.group || `${guest.name} (Individual)`;
      
      if (!groupsToCreate.has(groupTitle)) {
        groupsToCreate.set(groupTitle, {
          title: groupTitle,
          event_id: parseInt(eventID),
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

      const guestPayload = {
        group_id: groupId,
        public_id: crypto.randomUUID(),
        name: guest.name,
        email: guest.email && guest.email.trim() ? guest.email.trim() : null,
        phone: guest.phone && guest.phone.trim() ? guest.phone.trim() : null,
        tag: guest.tag || null,
        gender_id: genderId,
        age_group_id: ageGroupId,
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