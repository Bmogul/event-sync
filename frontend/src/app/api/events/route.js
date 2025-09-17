import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

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

    console.log("Authenticated user:", user.id);

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    console.log("User profile found:", userProfile.id);

    const { eventData, action } = await request.json();

    // Validate required fields
    if (!eventData.title || !eventData.description) {
      return NextResponse.json(
        { error: "Event title and description are required" },
        { status: 400 },
      );
    }

    // Prepare event payload
    const eventPayload = {
      title: eventData.title,
      description: eventData.description,
      start_date: eventData.startDate,
      end_date: eventData.endDate,
      capacity: eventData.maxGuests ? parseInt(eventData.maxGuests) : null,
      status_id: action === "publish" ? 2 : 1, // active or draft
      details: {
        location: eventData.location,
        timezone: eventData.timezone,
        event_type: eventData.eventType,
        is_private: eventData.isPrivate,
        require_rsvp: eventData.requireRSVP,
        allow_plus_ones: eventData.allowPlusOnes,
        rsvp_deadline: eventData.rsvpDeadline,
      },
    };

    let eventResult;
    if (eventData.id) {
      // Update existing event
      const { data, error } = await supabase
        .from("events")
        .update(eventPayload)
        .eq("id", eventData.id)
        .select()
        .single();

      if (error) throw error;
      eventResult = data;
    } else {
      // Create new event
      console.log("Creating new event with payload:", eventPayload);
      console.log("Current user context:", user.id);

      const { data, error } = await supabase
        .from("events")
        .insert([eventPayload])
        .select()
        .single();

      if (error) {
        console.error("Event creation error:", error);
        throw error;
      }
      console.log("Event created successfully:", data.id);
      eventResult = data;

      // Create event manager relationship
      const { error: managerError } = await supabase
        .from("event_managers")
        .insert({
          user_id: userProfile.id,
          event_id: eventResult.id,
          role_id: 1, // owner role
          status_id: 2, // accepted status
        });

      if (managerError) {
        // If manager creation fails, clean up the event
        await supabase.from("events").delete().eq("id", eventResult.id);
        throw managerError;
      }
    }

    // Handle sub-events
    if (eventData.subEvents && eventData.subEvents.length > 0) {
      // Delete existing sub-events
      await supabase.from("subevents").delete().eq("event_id", eventResult.id);

      // Insert new sub-events
      const subEventPayloads = eventData.subEvents
        .map((subEvent) => ({
          event_id: eventResult.id,
          title: subEvent.title,
          event_date: subEvent.date,
          start_time: subEvent.startTime || null, // Handle empty strings
          end_time: subEvent.endTime || null, // Handle empty strings
          venue_address: subEvent.location || null,
          capacity: subEvent.maxGuests ? parseInt(subEvent.maxGuests) : null,
          status_id: action === "publish" ? 2 : 1, // active or draft
          details: {
            description: subEvent.description || "",
            is_required: subEvent.isRequired || false,
          },
        }))
        .filter((subEvent) => subEvent.title && subEvent.event_date); // Only include valid sub-events

      if (subEventPayloads.length > 0) {
        console.log("Creating sub-events:", subEventPayloads);
        const { error: subEventError } = await supabase
          .from("subevents")
          .insert(subEventPayloads);

        if (subEventError) {
          console.error("Sub-event creation error:", subEventError);
          throw subEventError;
        }
        console.log("Sub-events created successfully");
      } else {
        console.log("No valid sub-events to create");
      }
    }

    // Handle landing page configuration
    if (eventData.landingPageConfig || eventData.rsvpSettings) {
      console.log("Processing landing page config:", eventData.landingPageConfig || eventData.rsvpSettings);

      // Use new structure if available, fallback to legacy rsvpSettings
      const config = eventData.landingPageConfig || {};
      const rsvp = eventData.rsvpSettings || {};

      const landingConfigPayload = {
        event_id: eventResult.id,
        title: config.title || rsvp.pageTitle || "You're Invited!",
        logo: config.logo || rsvp.logo || null,
        greeting_config: config.greeting_config || {
          message: rsvp.welcomeMessage,
          subtitle: rsvp.subtitle,
          theme: rsvp.theme,
          font_family: rsvp.fontFamily,
          background_color: rsvp.backgroundColor,
          text_color: rsvp.textColor,
          primary_color: rsvp.primaryColor,
          background_image: rsvp.backgroundImage,
          background_overlay: rsvp.backgroundOverlay,
        },
        rsvp_config: config.rsvp_config || {
          custom_questions: rsvp.customQuestions || [],
        },
        status: action === "publish" ? "published" : "draft",
      };

      console.log("Landing config payload:", landingConfigPayload);

      // Upsert landing page config
      const { error: configError } = await supabase
        .from("landing_page_configs")
        .upsert(landingConfigPayload, {
          onConflict: "event_id",
        });

      if (configError) {
        console.error("Landing page config error:", configError);
        throw configError;
      }
      console.log("Landing page config created successfully");
    } else {
      console.log("No landing page config or rsvpSettings found in eventData");
    }

    // Handle guest groups
    if (eventData.guestGroups && eventData.guestGroups.length > 0) {
      console.log("Processing guest groups:", eventData.guestGroups.length);

      // Delete existing guest groups for this event
      await supabase
        .from("guest_groups")
        .delete()
        .eq("event_id", eventResult.id);

      // Insert new guest groups
      const guestGroupPayloads = eventData.guestGroups.map((group) => {
        // Find point of contact from guests in this group
        const groupGuests = eventData.guests?.filter(guest => guest.groupName === group.name) || [];
        const pointOfContact = groupGuests[0]; // Use first guest as point of contact
        
        return {
          event_id: eventResult.id,
          title: group.name || group.title || (pointOfContact?.name) || 'Unnamed Group',
          size_limit: group.maxSize || -1, // -1 means unlimited
          status_id: 1, // draft status initially
          details: {
            description: group.description,
            color: group.color || "#7c3aed",
            ...Object.fromEntries(
              Object.entries(group).filter(([key]) => 
                !['name', 'title', 'maxSize', 'description', 'color'].includes(key)
              )
            )
          }
        };
      });

      if (guestGroupPayloads.length > 0) {
        const { data: createdGroups, error: groupError } = await supabase
          .from("guest_groups")
          .insert(guestGroupPayloads)
          .select();

        if (groupError) {
          console.error("Guest group creation error:", groupError);
          throw groupError;
        }
        console.log("Guest groups created successfully:", createdGroups.length);
      }
    }

    // Handle guests
    if (eventData.guests && eventData.guests.length > 0) {
      console.log("Processing guests:", eventData.guests.length);

      // Get group mappings if they exist
      const { data: groups } = await supabase
        .from("guest_groups")
        .select("id, title")
        .eq("event_id", eventResult.id);

      const groupMap = groups
        ? groups.reduce((acc, group) => {
          acc[group.title] = group.id;
          return acc;
        }, {})
        : {};

      // Create a default group if no groups exist but guests are present
      let defaultGroupId = null;
      if (Object.keys(groupMap).length === 0) {
        console.log("No guest groups found, creating default group");
        const { data: defaultGroup, error: defaultGroupError } = await supabase
          .from("guest_groups")
          .insert({
            event_id: eventResult.id,
            title: "All Guests",
            size_limit: -1,
            status_id: 1,
            details: {
              description: "Default group for all guests",
              color: "#7c3aed"
            }
          })
          .select()
          .single();

        if (defaultGroupError) {
          console.error("Default group creation error:", defaultGroupError);
          throw defaultGroupError;
        }
        defaultGroupId = defaultGroup.id;
        groupMap["All Guests"] = defaultGroupId;
      }

      // Insert new guests
      const guestPayloads = eventData.guests.map((guest) => {
        const groupId = guest.groupName ? groupMap[guest.groupName] : (defaultGroupId || Object.values(groupMap)[0]);
        
        return {
          group_id: groupId, // Required field
          name: guest.name || [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "Guest",
          email: guest.email || null,
          phone: guest.phone || null,
          tag: guest.tag || null
          // Note: guests table doesn't have a details column, so extra fields are not stored
        };
      }).filter(guest => guest.group_id); // Only include guests with valid group_id

      if (guestPayloads.length > 0) {
        const { data: createdGuests, error: guestError } = await supabase
          .from("guests")
          .insert(guestPayloads)
          .select();

        if (guestError) {
          console.error("Guest creation error:", guestError);
          throw guestError;
        }
        console.log("Guests created successfully:", createdGuests.length);

        // Update guest groups with point_of_contact_id
        for (const group of eventData.guestGroups || []) {
          const groupGuests = createdGuests.filter(guest => 
            groupMap[group.name] === guest.group_id
          );
          
          if (groupGuests.length > 0) {
            const pointOfContactId = groupGuests[0].id;
            
            await supabase
              .from("guest_groups")
              .update({ point_of_contact_id: pointOfContactId })
              .eq("id", groupMap[group.name]);
          }
        }
        console.log("Point of contact relationships updated");
      }
    }

    return NextResponse.json({
      success: true,
      event: eventResult,
      message:
        action === "publish"
          ? "Event published successfully!"
          : "Draft saved successfully!",
    });
  } catch (error) {
    console.error("Event creation error:", error);
    return NextResponse.json(
      { error: "Failed to save event. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
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

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const { eventId } = await request.json();
    console.log('DELETE request received with eventId:', eventId); // Debug log

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // Check if user is the owner of the event
    const { data: eventManager, error: managerError } = await supabase
      .from("event_managers")
      .select("role_id")
      .eq("user_id", userProfile.id)
      .eq("event_id", eventId)
      .eq("role_id", 1) // owner role
      .single();

    if (managerError || !eventManager) {
      console.error("Authorization check error:", managerError);
      return NextResponse.json(
        { error: "Unauthorized: Only event owners can delete events" },
        { status: 403 },
      );
    }

    // Delete the event (cascading deletes will handle related records)
    const { error: deleteError } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (deleteError) {
      console.error("Event deletion error:", deleteError);
      throw deleteError;
    }

    console.log("Event deleted successfully:", eventId);

    return NextResponse.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Event deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete event. Please try again." },
      { status: 500 },
    );
  }
}
