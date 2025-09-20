import { createClient } from "../../utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("❌ Profile error:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    // Get public_id from query params
    const url = new URL(request.url);
    const publicId = url.searchParams.get("public_id");

    if (!publicId) {
      return NextResponse.json(
        { error: "public_id is required" },
        { status: 400 },
      );
    }

    console.log("Fetching event details for public_id:", publicId);

    // Fetch main event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        *,
        event_managers!inner(user_id, role_id)
      `,
      )
      .eq("public_id", publicId)
      .eq("event_managers.user_id", userProfile.id)
      .single();

    if (eventError || !event) {
      console.error("❌ Event not found or unauthorized:", eventError);
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 },
      );
    }

    // Fetch sub-events
    const { data: subEvents, error: subEventsError } = await supabase
      .from("subevents")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at");

    // Fetch guest groups
    const { data: guestGroups, error: groupsError } = await supabase
      .from("guest_groups")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at");

    // Fetch guests
    let guests = [];
    let guestsError = null;

    console.log("Fetching guests for event ID:", event.id);

    if (guestGroups && guestGroups.length > 0) {
      const guestGroupIds = guestGroups.map((g) => g.id);
      console.log("Guest group IDs to fetch guests for:", guestGroupIds);

      const { data: guestData, error: guestFetchError } = await supabase
        .from("guests")
        .select(
          `
          *,
          guest_groups(id, title),
          guest_gender(id, state),
          guest_age_group(id, state),
          guest_type(id, name),
          rsvps(subevent_id, status_id, response)
        `,
        )
        .in("group_id", guestGroupIds)
        .order("created_at");

      guests = guestData || [];
      guestsError = guestFetchError;

      console.log("Guest fetch result:", {
        success: !guestFetchError,
        count: guests.length,
        error: guestFetchError?.message,
      });

      if (guestFetchError) {
        console.error("Guest fetch error:", guestFetchError);
      }
    } else {
      console.log("No guest groups found, skipping guest fetch");
    }

    // Fetch landing page config
    const { data: landingConfig, error: landingError } = await supabase
      .from("landing_page_configs")
      .select("*")
      .eq("event_id", event.id)
      .single();

    // Fetch email templates
    const { data: emailTemplates, error: emailTemplatesError } = await supabase
      .from("email_templates")
      .select(`
        *,
        email_template_categories(name),
        email_template_status(name)
      `)
      .eq("event_id", event.id)
      .order("created_at");

    // Transform data to match frontend format
    const eventData = {
      public_id: event.public_id,
      title: event.title || "",
      description: event.description || "",
      location: event.details?.location || "",
      startDate: event.start_date || "",
      endDate: event.end_date || "",
      logo_url: event.logo_url || "",
      maxGuests: event.capacity || "",
      eventType: event.details?.event_type || "wedding",
      isPrivate: event.details?.is_private || false,
      requireRSVP: event.details?.require_rsvp || true,
      allowPlusOnes: event.details?.allow_plus_ones || false,
      rsvpDeadline: event.details?.rsvp_deadline || "",
      timezone:
        event.details?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,

      // Transform sub-events
      subEvents: subEvents?.map((se, index) => ({
        id: se.id,
        title: se.title || "",
        description: se.details?.description || "",
        date: se.event_date || "",
        startTime: se.start_time || "",
        endTime: se.end_time || "",
        location: se.venue_address || "",
        maxGuests: se.capacity || "",
        timezone:
          event.details?.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        isRequired: se.details?.is_required || true,
        image: se.image_url || null,
      })) || [
        {
          id: 1,
          title: "",
          description: "",
          date: "",
          startTime: "",
          endTime: "",
          location: "",
          maxGuests: "",
          timezone:
            event.details?.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
          isRequired: true,
        },
      ],

      // Transform guest groups
      guestGroups:
        guestGroups?.map((group) => {
          // Calculate actual size by counting guests in this group
          // Check both guest_groups.id and direct group_id for flexibility
          const groupGuests =
            guests?.filter(
              (guest) =>
                guest.group_id === group.id ||
                guest.guest_groups?.id === group.id,
            ) || [];

          // Find point of contact - now stored as boolean on individual guests
          const pocGuest = groupGuests.find(
            (guest) => guest.point_of_contact === true,
          );

          console.log(
            `Group "${group.title}" (ID: ${group.id}) has ${groupGuests.length} guests, POC: ${pocGuest ? pocGuest.name + " (" + pocGuest.public_id + ")" : "none"}`,
          );

          return {
            id: group.id,
            name: group.title, // Frontend uses 'name' for display/input
            title: group.title, // Frontend also uses 'title' for lookups
            description: group.details?.description || "",
            maxSize: group.size_limit === -1 ? "" : group.size_limit,
            size: groupGuests.length, // Actual count of guests in this group
            color: group.details?.color || "#7c3aed",
            point_of_contact: pocGuest ? pocGuest.public_id : null, // POC public_id if exists
          };
        }) || [],

      // Transform guests
      guests:
        guests?.map((guest) => {
          // Transform RSVPs back to frontend format
          const subEventRSVPs = {};
          if (guest.rsvps && guest.rsvps.length > 0) {
            guest.rsvps.forEach((rsvp) => {
              // Status 1 = pending, which means they were invited
              if (rsvp.status_id === 1) {
                subEventRSVPs[rsvp.subevent_id] = "invited";
              }
            });
          }

          // Calculate guest limit based on guest type for frontend
          let frontendGuestLimit = guest.guest_limit;
          const guestTypeName = guest.guest_type?.name?.toLowerCase() || "single";
          
          if (guestTypeName === "single") {
            frontendGuestLimit = 1;
          } else if (guestTypeName === "variable") {
            frontendGuestLimit = null; // Infinite
          } else if (guestTypeName === "multiple") {
            frontendGuestLimit = guest.guest_limit || 1;
          }

          const guestData = {
            id: guest.id,
            public_id: guest.public_id, // Include public_id for frontend POC matching
            name: guest.name,
            email: guest.email || "",
            phone: guest.phone || "",
            tag: guest.tag || "",
            group: guest.guest_groups?.title || "",
            group_id: guest.group_id,
            gender: guest.guest_gender?.state || "",
            ageGroup: guest.guest_age_group?.state || "",
            guestType: guest.guest_type?.name || "single", // Map to frontend format
            guestLimit: frontendGuestLimit,
            isPointOfContact: guest.point_of_contact || false, // Include POC boolean status
            subEventRSVPs: subEventRSVPs, // Include transformed RSVPs
          };

          console.log(
            `Guest "${guest.name}" -> Group: "${guestData.group}" (group_id: ${guest.group_id}, public_id: ${guest.public_id}, POC: ${guest.point_of_contact}) -> RSVPs: ${Object.keys(subEventRSVPs).length}`,
          );
          return guestData;
        }) || [],

      // Transform RSVP settings
      rsvpSettings: landingConfig
        ? {
            pageTitle: landingConfig.title || "You're Invited!",
            subtitle:
              landingConfig.greeting_config?.subtitle ||
              "Join us for our special event",
            welcomeMessage:
              landingConfig.greeting_config?.message || "Welcome!",
            theme: landingConfig.greeting_config?.theme || "elegant",
            fontFamily:
              landingConfig.greeting_config?.font_family || "Playfair Display",
            backgroundColor:
              landingConfig.greeting_config?.background_color || "#faf5ff",
            textColor: landingConfig.greeting_config?.text_color || "#581c87",
            primaryColor:
              landingConfig.greeting_config?.primary_color || "#7c3aed",
            customQuestions: landingConfig.rsvp_config?.custom_questions || [
              "dietary",
              "message",
            ],
            backgroundImage:
              landingConfig.greeting_config?.background_image || null,
            backgroundOverlay:
              landingConfig.greeting_config?.background_overlay || 20,
            logo: landingConfig.logo || null,
          }
        : {
            pageTitle: "You're Invited!",
            subtitle: "Join us for our special celebration",
            welcomeMessage:
              "We're so excited to celebrate with you! Please let us know if you can make it.",
            theme: "elegant",
            fontFamily: "Playfair Display",
            backgroundColor: "#faf5ff",
            textColor: "#581c87",
            primaryColor: "#7c3aed",
            customQuestions: ["dietary", "message"],
            backgroundImage: null,
            backgroundOverlay: 20,
          },

      // Transform email templates
      emailTemplates: emailTemplates?.map((template) => ({
        id: template.id,
        title: template.name,
        subtitle: template.subtitle || "",
        body: template.body || "",
        greeting: template.greeting || "",
        signoff: template.signoff || "",
        sender_name: template.sender_name || "",
        sender_email: template.sender_email || "",
        reply_to: template.reply_to || "",
        subject_line: template.subject_line || "",
        template_key: template.template_key || "",
        category: template.email_template_categories?.name || "invitation",
        status: template.email_template_status?.name || "draft",
        description: template.description || "",
        is_default: template.is_default || false,
        primary_color: template.primary_color || "#ffffff",
        secondary_color: template.secondary_color || "#e1c0b7",
        text_color: template.font_color || "#333333",
      })) || [],
    };

    console.log("✓ Event data loaded successfully");
    console.log("Debug: Raw database results:");
    console.log("  - Event:", event?.title || "No event");
    console.log("  - Sub-events count:", subEvents?.length || 0);
    console.log("  - Guest groups count:", guestGroups?.length || 0);
    console.log("  - Guests count:", guests?.length || 0);
    console.log("  - Email templates count:", emailTemplates?.length || 0);
    console.log("  - Landing config:", !!landingConfig);

    if (guestGroups?.length > 0) {
      console.log(
        "Raw guest groups:",
        guestGroups.map((g) => ({ id: g.id, title: g.title })),
      );
    }

    if (guests?.length > 0) {
      console.log(
        "Raw guests:",
        guests.map((g) => ({
          id: g.id,
          name: g.name,
          group_id: g.group_id,
          guest_groups: g.guest_groups,
        })),
      );
    }

    console.log("Transformed event data structure:");
    console.log("  - Guest groups:", eventData.guestGroups?.length || 0);
    console.log("  - Guests:", eventData.guests?.length || 0);

    return NextResponse.json({
      success: true,
      event: eventData,
    });
  } catch (error) {
    console.error("=== EVENT FETCH FAILED ===");
    console.error("Error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch event details. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// Helper function to apply partial updates to event data
const applyPartialUpdate = (existingData, changes) => {
  const updated = { ...existingData };
  
  // Apply main event field changes
  if (changes.mainEvent) {
    Object.assign(updated, changes.mainEvent);
  }
  
  return updated;
};

// Helper function to merge sub-event changes
const mergeSubEventChanges = async (supabase, eventId, subEventChanges, action) => {
  if (!subEventChanges) return;
  
  const { added = [], modified = {}, removed = [] } = subEventChanges;
  
  // Handle removals first
  if (removed.length > 0) {
    console.log(`Removing ${removed.length} sub-events:`, removed);
    const { error: deleteError } = await supabase
      .from("subevents")
      .delete()
      .in("id", removed);
    
    if (deleteError) {
      console.error("Error removing sub-events:", deleteError);
      throw deleteError;
    }
  }
  
  // Handle modifications
  for (const [subEventId, changes] of Object.entries(modified)) {
    console.log(`Updating sub-event ${subEventId}:`, changes);
    const updatePayload = {
      title: changes.title,
      event_date: changes.date || null,
      start_time: changes.startTime || null,
      end_time: changes.endTime || null,
      venue_address: changes.location || null,
      capacity: changes.maxGuests ? parseInt(changes.maxGuests) : null,
      status_id: action === "published" ? 2 : 1,
      details: {
        description: changes.description || null,
        is_required: changes.isRequired || false,
      },
    };
    
    const { error: updateError } = await supabase
      .from("subevents")
      .update(updatePayload)
      .eq("id", subEventId);
    
    if (updateError) {
      console.error(`Error updating sub-event ${subEventId}:`, updateError);
      throw updateError;
    }
  }
  
  // Handle additions
  if (added.length > 0) {
    console.log(`Adding ${added.length} new sub-events:`, added);
    const insertPayloads = added.map((subEvent) => ({
      event_id: eventId,
      title: subEvent.title,
      event_date: subEvent.date || null,
      start_time: subEvent.startTime || null,
      end_time: subEvent.endTime || null,
      venue_address: subEvent.location || null,
      capacity: subEvent.maxGuests ? parseInt(subEvent.maxGuests) : null,
      status_id: action === "published" ? 2 : 1,
      details: {
        description: subEvent.description || null,
        is_required: subEvent.isRequired || false,
      },
    }));
    
    const { error: insertError } = await supabase
      .from("subevents")
      .insert(insertPayloads);
    
    if (insertError) {
      console.error("Error adding new sub-events:", insertError);
      throw insertError;
    }
  }
};

export async function PATCH(request) {
  console.log("=== PATCH EVENTS API (INCREMENTAL UPDATE) START ===");
  
  try {
    const supabase = createClient();

    // Get authenticated user
    console.log("Step 1: Getting authenticated user...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✓ Authenticated user:", user.id);

    // Get user profile
    console.log("Step 2: Getting user profile...");
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("❌ Profile error:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    console.log("✓ User profile found:", userProfile.id);

    // Parse request data
    console.log("Step 3: Parsing incremental update data...");
    const updateData = await request.json();
    const action = updateData.status || "draft";
    const publicId = updateData.public_id;
    const conflictToken = updateData.conflictToken;

    console.log("✓ Incremental update data received:");
    console.log("  - Public ID:", publicId);
    console.log("  - Action:", action);
    console.log("  - Conflict Token:", conflictToken);
    console.log("  - Changes:", Object.keys(updateData).filter(k => !['status', 'public_id', 'isPartialUpdate', 'conflictToken'].includes(k)));

    if (!publicId) {
      console.error("❌ Public ID required for incremental updates");
      return NextResponse.json(
        { error: "Public ID is required for incremental updates" },
        { status: 400 },
      );
    }

    // Find existing event
    console.log("Step 4: Finding existing event...");
    const { data: existingEvent, error: existingEventError } = await supabase
      .from("events")
      .select("id")
      .eq("public_id", publicId)
      .eq("event_managers.user_id", userProfile.id)
      .single();

    if (existingEventError || !existingEvent) {
      console.error("❌ Event not found or unauthorized:", existingEventError);
      return NextResponse.json(
        { error: "Event not found or unauthorized" },
        { status: 404 },
      );
    }

    console.log("✓ Found existing event:", existingEvent.id);

    // Apply incremental updates
    console.log("Step 5: Applying incremental updates...");

    // Update main event fields if provided
    if (updateData.mainEvent) {
      console.log("Updating main event fields:", Object.keys(updateData.mainEvent));
      const mainEventPayload = {};
      
      // Map frontend fields to database fields
      const fieldMappings = {
        title: 'title',
        description: 'description',
        startDate: 'start_date',
        endDate: 'end_date',
        maxGuests: 'capacity',
        logo_url: 'logo_url'
      };
      
      Object.entries(updateData.mainEvent).forEach(([key, value]) => {
        if (fieldMappings[key]) {
          if (key === 'maxGuests') {
            mainEventPayload[fieldMappings[key]] = value ? parseInt(value) : null;
          } else {
            mainEventPayload[fieldMappings[key]] = value;
          }
        }
      });
      
      // Handle details object fields
      const detailsFields = ['location', 'timezone', 'eventType', 'isPrivate', 'requireRSVP', 'allowPlusOnes', 'rsvpDeadline'];
      const detailsUpdates = {};
      let hasDetailsUpdates = false;
      
      detailsFields.forEach(field => {
        if (updateData.mainEvent[field] !== undefined) {
          const dbField = {
            location: 'location',
            timezone: 'timezone', 
            eventType: 'event_type',
            isPrivate: 'is_private',
            requireRSVP: 'require_rsvp',
            allowPlusOnes: 'allow_plus_ones',
            rsvpDeadline: 'rsvp_deadline'
          }[field];
          
          detailsUpdates[dbField] = updateData.mainEvent[field];
          hasDetailsUpdates = true;
        }
      });
      
      if (hasDetailsUpdates) {
        // Get existing details and merge
        const { data: currentEvent, error: fetchError } = await supabase
          .from("events")
          .select("details")
          .eq("id", existingEvent.id)
          .single();
          
        if (fetchError) {
          console.error("Error fetching current event details:", fetchError);
          throw fetchError;
        }
        
        mainEventPayload.details = {
          ...(currentEvent.details || {}),
          ...detailsUpdates
        };
      }
      
      // Update status if provided
      mainEventPayload.status_id = action === "published" ? 2 : 1;
      
      if (Object.keys(mainEventPayload).length > 0) {
        const { error: updateError } = await supabase
          .from("events")
          .update(mainEventPayload)
          .eq("id", existingEvent.id);

        if (updateError) {
          console.error("❌ Main event update error:", updateError);
          throw updateError;
        }
        
        console.log("✓ Main event fields updated successfully");
      }
    }

    // Handle sub-events changes
    if (updateData.subEvents) {
      console.log("Applying sub-events changes...");
      await mergeSubEventChanges(supabase, existingEvent.id, updateData.subEvents, action);
      console.log("✓ Sub-events updated successfully");
    }

    // Handle guest groups and guests changes
    if (updateData.guestGroups || updateData.guests) {
      console.log("Incremental guest updates not yet fully implemented - using full replacement");
      // For now, we'll skip guest updates in incremental mode
      // TODO: Implement proper incremental guest management
    }

    // Handle RSVP settings changes
    if (updateData.rsvpSettings) {
      console.log("Updating RSVP settings:", Object.keys(updateData.rsvpSettings));
      
      // Get existing landing page config
      const { data: existingConfig, error: fetchConfigError } = await supabase
        .from("landing_page_configs")
        .select("*")
        .eq("event_id", existingEvent.id)
        .single();
      
      if (fetchConfigError && fetchConfigError.code !== 'PGRST116') {
        console.error("Error fetching landing page config:", fetchConfigError);
        throw fetchConfigError;
      }
      
      if (existingConfig) {
        // Update existing config
        const configUpdates = {
          title: updateData.rsvpSettings.pageTitle || existingConfig.title,
          logo: updateData.rsvpSettings.logo || existingConfig.logo,
          greeting_config: {
            ...(existingConfig.greeting_config || {}),
            ...(updateData.rsvpSettings.welcomeMessage && { message: updateData.rsvpSettings.welcomeMessage }),
            ...(updateData.rsvpSettings.subtitle && { subtitle: updateData.rsvpSettings.subtitle }),
            ...(updateData.rsvpSettings.theme && { theme: updateData.rsvpSettings.theme }),
            ...(updateData.rsvpSettings.fontFamily && { font_family: updateData.rsvpSettings.fontFamily }),
            ...(updateData.rsvpSettings.backgroundColor && { background_color: updateData.rsvpSettings.backgroundColor }),
            ...(updateData.rsvpSettings.textColor && { text_color: updateData.rsvpSettings.textColor }),
            ...(updateData.rsvpSettings.primaryColor && { primary_color: updateData.rsvpSettings.primaryColor }),
            ...(updateData.rsvpSettings.backgroundImage !== undefined && { background_image: updateData.rsvpSettings.backgroundImage }),
            ...(updateData.rsvpSettings.backgroundOverlay !== undefined && { background_overlay: updateData.rsvpSettings.backgroundOverlay })
          },
          rsvp_config: {
            ...(existingConfig.rsvp_config || {}),
            ...(updateData.rsvpSettings.customQuestions && { custom_questions: updateData.rsvpSettings.customQuestions })
          },
          status: action === "published" ? "published" : "draft"
        };
        
        const { error: updateConfigError } = await supabase
          .from("landing_page_configs")
          .update(configUpdates)
          .eq("id", existingConfig.id);
        
        if (updateConfigError) {
          console.error("Error updating landing page config:", updateConfigError);
          throw updateConfigError;
        }
        
        console.log("✓ RSVP settings updated successfully");
      }
    }

    // Handle email template changes
    if (updateData.emailTemplates) {
      console.log("Email template incremental updates not yet implemented");
      // TODO: Implement incremental email template updates
    }

    console.log("=== INCREMENTAL UPDATE COMPLETED SUCCESSFULLY ===");

    // Return success response
    return NextResponse.json({
      success: true,
      id: existingEvent.id,
      eventId: existingEvent.id,
      action: action,
      updateType: "incremental",
      message: action === "published" 
        ? "Event published successfully with incremental updates!" 
        : "Draft saved successfully with incremental updates!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("=== INCREMENTAL UPDATE FAILED ===");
    console.error("Error:", error);

    return NextResponse.json(
      {
        error: "Failed to apply incremental updates. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  console.log("=== NEW EVENTS API START ===");

  try {
    const supabase = createClient();

    // Get authenticated user
    console.log("Step 1: Getting authenticated user...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Auth error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✓ Authenticated user:", user.id);

    // Get user profile
    console.log("Step 2: Getting user profile...");
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("supa_id", user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("❌ Profile error:", profileError);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    console.log("✓ User profile found:", userProfile.id);

    // Parse request data
    console.log("Step 3: Parsing request data...");
    const eventData = await request.json();
    const action = eventData.status || "draft";
    const isPartialUpdate = eventData.isPartialUpdate || false;

    console.log("✓ Event data received:");
    console.log("  - Title:", eventData.title);
    console.log("  - Action:", action);
    console.log("  - Is Partial Update:", isPartialUpdate);
    console.log("  - Guest Groups:", eventData.guestGroups?.length || 0);
    console.log("  - Guests:", eventData.guests?.length || 0);
    console.log("  - Has RSVP Settings:", !!eventData.rsvpSettings);
    
    // If this is marked as a partial update but sent to POST, log a warning
    if (isPartialUpdate) {
      console.warn("⚠️ Partial update sent to POST endpoint - consider using PATCH for better performance");
    }

    // Debug: Log the raw guest data received from frontend
    console.log("=== RAW GUEST DATA RECEIVED FROM FRONTEND ===");
    if (eventData.guests && eventData.guests.length > 0) {
      eventData.guests.forEach((guest, index) => {
        console.log(
          `Raw Guest ${index + 1}: "${guest.name}" | isPointOfContact: ${guest.isPointOfContact} | Group: "${guest.group}"`,
        );
      });
    } else {
      console.log("No guests received from frontend");
    }
    console.log("=== END RAW GUEST DATA ===");

    // Validate only required fields
    if (!eventData.title) {
      console.error("❌ Validation failed: Title is required");
      return NextResponse.json(
        { error: "Event title is required" },
        { status: 400 },
      );
    }

    console.log("✓ Validation passed");

    // Step 4: Create or update the main event
    console.log("Step 4: Creating or updating main event...");
    const eventPayload = {
      public_id: eventData.public_id,
      title: eventData.title,
      description: eventData.description || null,
      start_date: eventData.startDate || null,
      end_date: eventData.endDate || null,
      capacity: eventData.maxGuests ? parseInt(eventData.maxGuests) : null,
      logo_url: eventData.logo_url || null,
      status_id: action === "published" ? 2 : 1,
      details: {
        location: eventData.location || null,
        timezone: eventData.timezone || null,
        event_type: eventData.eventType || "event",
        is_private: eventData.isPrivate || false,
        require_rsvp: eventData.requireRSVP || false,
        allow_plus_ones: eventData.allowPlusOnes || false,
        rsvp_deadline: eventData.rsvpDeadline || null,
      },
    };

    // Check if event already exists by public_id
    console.log(
      "Checking for existing event with public_id:",
      eventData.public_id,
    );
    const { data: existingEvent, error: existingEventError } = await supabase
      .from("events")
      .select("id")
      .eq("public_id", eventData.public_id)
      .single();

    let createdEvent;

    if (existingEvent && !existingEventError) {
      console.log("✓ Found existing event, updating...", existingEvent.id);

      // Update existing event
      const { data: updatedEvent, error: updateError } = await supabase
        .from("events")
        .update(eventPayload)
        .eq("public_id", eventData.public_id)
        .select()
        .single();

      if (updateError) {
        console.error("❌ Event update error:", updateError);
        throw updateError;
      }

      createdEvent = updatedEvent;
      console.log("✓ Event updated successfully:", createdEvent.id);
    } else {
      console.log(
        "Creating new event with payload:",
        JSON.stringify(eventPayload, null, 2),
      );

      // Create new event
      const { data: newEvent, error: eventError } = await supabase
        .from("events")
        .insert([eventPayload])
        .select()
        .single();

      if (eventError) {
        console.error("❌ Event creation error:", eventError);
        throw eventError;
      }

      createdEvent = newEvent;
      console.log("✓ Event created successfully:", createdEvent.id);
    }

    // Step 5: Create event manager relationship (only for new events)
    if (!existingEvent || existingEventError) {
      console.log("Step 5: Creating event manager relationship...");
      const { error: managerError } = await supabase
        .from("event_managers")
        .insert({
          user_id: userProfile.id,
          event_id: createdEvent.id,
          role_id: 1, // owner role
          status_id: 2, // accepted status
        });

      if (managerError) {
        console.error("❌ Manager creation error:", managerError);
        // Clean up event
        await supabase.from("events").delete().eq("id", createdEvent.id);
        throw managerError;
      }

      console.log("✓ Event manager created");
    } else {
      console.log("✓ Event manager already exists, skipping creation");
    }

    // Step 6: Handle sub-events (only if they have titles)
    if (eventData.subEvents && eventData.subEvents.length > 0) {
      console.log("Step 6: Handling sub-events...");

      const validSubEvents = eventData.subEvents.filter(
        (subEvent) => subEvent.title && subEvent.title.trim(),
      );

      if (validSubEvents.length > 0) {
        if (existingEvent && !existingEventError) {
          // For existing events, update/insert/delete sub-events to preserve IDs
          console.log("Updating existing sub-events...");

          // Get existing sub-events
          const { data: existingSubEvents, error: fetchError } = await supabase
            .from("subevents")
            .select("*")
            .eq("event_id", createdEvent.id)
            .order("created_at");

          if (fetchError) {
            console.error("Error fetching existing sub-events:", fetchError);
            throw fetchError;
          }

          const existingSubEventsMap = new Map();
          (existingSubEvents || []).forEach((se) => {
            existingSubEventsMap.set(se.id, se);
          });

          // Track which sub-events to update/insert
          const subEventsToUpdate = [];
          const subEventsToInsert = [];
          const processedIds = new Set();

          validSubEvents.forEach((subEvent) => {
            // If sub-event has an ID and exists in DB, update it
            if (subEvent.id && existingSubEventsMap.has(subEvent.id)) {
              subEventsToUpdate.push({
                id: subEvent.id,
                event_id: createdEvent.id,
                title: subEvent.title,
                event_date: subEvent.date || null,
                start_time: subEvent.startTime || null,
                end_time: subEvent.endTime || null,
                venue_address: subEvent.location || null,
                capacity: subEvent.maxGuests
                  ? parseInt(subEvent.maxGuests)
                  : null,
                status_id: action === "published" ? 2 : 1,
                details: {
                  description: subEvent.description || null,
                  is_required: subEvent.isRequired || false,
                },
              });
              processedIds.add(subEvent.id);
            } else {
              // New sub-event, insert it
              subEventsToInsert.push({
                event_id: createdEvent.id,
                title: subEvent.title,
                event_date: subEvent.date || null,
                start_time: subEvent.startTime || null,
                end_time: subEvent.endTime || null,
                venue_address: subEvent.location || null,
                capacity: subEvent.maxGuests
                  ? parseInt(subEvent.maxGuests)
                  : null,
                status_id: action === "published" ? 2 : 1,
                details: {
                  description: subEvent.description || null,
                  is_required: subEvent.isRequired || false,
                },
              });
            }
          });

          // Delete sub-events that are no longer in the frontend data
          const subEventIdsToDelete = [];
          existingSubEvents.forEach((se) => {
            if (!processedIds.has(se.id)) {
              subEventIdsToDelete.push(se.id);
            }
          });

          // Perform updates
          if (subEventsToUpdate.length > 0) {
            console.log(
              `Updating ${subEventsToUpdate.length} existing sub-events...`,
            );
            for (const subEvent of subEventsToUpdate) {
              const { id, ...updateData } = subEvent;
              const { error: updateError } = await supabase
                .from("subevents")
                .update(updateData)
                .eq("id", id);

              if (updateError) {
                console.error(`Error updating sub-event ${id}:`, updateError);
                throw updateError;
              }
            }
          }

          // Perform inserts
          if (subEventsToInsert.length > 0) {
            console.log(
              `Inserting ${subEventsToInsert.length} new sub-events...`,
            );
            const { error: insertError } = await supabase
              .from("subevents")
              .insert(subEventsToInsert);

            if (insertError) {
              console.error("Error inserting new sub-events:", insertError);
              throw insertError;
            }
          }

          // Perform deletes
          if (subEventIdsToDelete.length > 0) {
            console.log(
              `Deleting ${subEventIdsToDelete.length} removed sub-events...`,
            );
            const { error: deleteError } = await supabase
              .from("subevents")
              .delete()
              .in("id", subEventIdsToDelete);

            if (deleteError) {
              console.error("Error deleting removed sub-events:", deleteError);
              throw deleteError;
            }
          }

          console.log("✓ Sub-events updated successfully");
        } else {
          // For new events, just insert all sub-events
          console.log("Creating new sub-events...");
          const subEventPayloads = validSubEvents.map((subEvent) => ({
            event_id: createdEvent.id,
            title: subEvent.title,
            event_date: subEvent.date || null,
            start_time: subEvent.startTime || null,
            end_time: subEvent.endTime || null,
            venue_address: subEvent.location || null,
            capacity: subEvent.maxGuests ? parseInt(subEvent.maxGuests) : null,
            status_id: action === "published" ? 2 : 1,
            details: {
              description: subEvent.description || null,
              is_required: subEvent.isRequired || false,
            },
          }));

          const { data: createdSubEvents, error: subEventError } =
            await supabase.from("subevents").insert(subEventPayloads).select();

          if (subEventError) {
            console.error("❌ Sub-event creation error:", subEventError);
            throw subEventError;
          }

          console.log("✓ Sub-events created:", createdSubEvents.length);
        }
      }
    }

    // Step 7: Handle guest groups and guests
    console.log("Step 7: Handling guest groups and guests...");

    // For existing events, delete old guest groups (and their guests) first
    if (existingEvent && !existingEventError) {
      console.log("Deleting existing guest groups and guests...");
      await supabase
        .from("guest_groups")
        .delete()
        .eq("event_id", createdEvent.id);
    }

    // Check if we have guests that need groups (only name is required)
    const hasGuests =
      eventData.guests &&
      eventData.guests.length > 0 &&
      eventData.guests.some((guest) => {
        const name =
          guest.name ||
          [guest.firstName, guest.lastName].filter(Boolean).join(" ");
        const hasValidName = name && name.trim();
        return hasValidName; // Only name is required, no contact info needed
      });

    // Check if we have valid guest groups from eventData.guestGroups
    const validGroups = (eventData.guestGroups || []).filter(
      (group) => group.name && group.name.trim(),
    );

    // Also extract unique groups from guest assignments
    const guestGroupNames = new Set();
    if (eventData.guests && eventData.guests.length > 0) {
      eventData.guests.forEach((guest) => {
        if (guest.group && guest.group.trim()) {
          guestGroupNames.add(guest.group.trim());
        }
      });
    }

    console.log("Guest data analysis:");
    console.log("  - Raw guest groups:", eventData.guestGroups?.length || 0);
    console.log("  - Valid guest groups:", validGroups.length);
    console.log("  - Has guests needing groups:", hasGuests);
    console.log(
      "  - Unique guest group names from assignments:",
      Array.from(guestGroupNames),
    );

    if (eventData.guests && eventData.guests.length > 0) {
      console.log("Guest details:");
      eventData.guests.forEach((guest, index) => {
        const name =
          guest.name ||
          [guest.firstName, guest.lastName].filter(Boolean).join(" ");
        console.log(
          `  Guest ${index + 1}: "${name}" | Email: "${guest.email || "none"}" | Phone: "${guest.phone || "none"}" | Group: "${guest.group || "none"}" | POC: ${guest.isPointOfContact || false}`,
        );
      });
    }

    // Create groups based on predefined groups OR discovered group names from guests
    let groupsToCreate = [];

    if (validGroups.length > 0) {
      // Use predefined guest groups
      groupsToCreate = validGroups;
    } else if (guestGroupNames.size > 0) {
      // Create groups based on guest assignments
      groupsToCreate = Array.from(guestGroupNames).map((groupName) => ({
        name: groupName,
        description: "Auto-created from guest assignments",
        maxSize: "",
        color: "#7c3aed",
      }));
    } else if (hasGuests) {
      // Fallback to default group
      groupsToCreate = [
        {
          name: "All Guests",
          description: "Default guest group",
          maxSize: "",
          color: "#7c3aed",
        },
      ];
    }

    console.log("  - Groups to create:", groupsToCreate.length);
    console.log(
      "  - Group names to create:",
      groupsToCreate.map((g) => g.name),
    );

    let createdGroups = [];

    if (groupsToCreate.length > 0) {
      const groupPayloads = groupsToCreate.map((group) => ({
        event_id: createdEvent.id,
        title: group.name,
        size_limit: group.maxSize ? parseInt(group.maxSize) : -1,
        status_id: 1,
        details: {
          description: group.description || null,
          color: group.color || "#7c3aed",
        },
      }));

      console.log("Creating guest groups:", groupPayloads.length);

      const { data: groupResults, error: groupError } = await supabase
        .from("guest_groups")
        .insert(groupPayloads)
        .select();

      if (groupError) {
        console.error("❌ Guest group creation error:", groupError);
        throw groupError;
      }

      createdGroups = groupResults;
      console.log("✓ Guest groups created:", createdGroups.length);
    }

    // Step 8: Create guests (only if they have names and we have groups)
    if (hasGuests && createdGroups.length > 0) {
      console.log("Step 8: Creating guests...");

      const validGuests = eventData.guests.filter((guest) => {
        const name =
          guest.name ||
          [guest.firstName, guest.lastName].filter(Boolean).join(" ");
        const hasValidName = name && name.trim();

        if (!hasValidName) {
          console.warn(`Guest skipped - missing or empty name`);
        }

        return hasValidName; // Only name is required
      });

      if (validGuests.length > 0) {
        // Fetch lookup tables for gender, age group, and guest type
        const { data: genderLookup, error: genderError } = await supabase
          .from("guest_gender")
          .select("id, state");

        const { data: ageGroupLookup, error: ageGroupError } = await supabase
          .from("guest_age_group")
          .select("id, state");

        const { data: guestTypeLookup, error: guestTypeError } = await supabase
          .from("guest_type")
          .select("id, name");

        if (genderError) {
          console.error("Error fetching gender lookup:", genderError);
          throw genderError;
        }

        if (ageGroupError) {
          console.error("Error fetching age group lookup:", ageGroupError);
          throw ageGroupError;
        }

        if (guestTypeError) {
          console.error("Error fetching guest type lookup:", guestTypeError);
          throw guestTypeError;
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

        console.log("Gender mapping:", genderMap);
        console.log("Age group mapping:", ageGroupMap);
        console.log("Guest type mapping:", guestTypeMap);

        // Helper function to get gender ID from string
        const getGenderIdFromString = (genderString) => {
          if (!genderString || !genderString.trim()) return null;

          const normalizedGender = genderString.toLowerCase().trim();

          // Map common frontend values to database states
          if (normalizedGender === "male" || normalizedGender === "m")
            return genderMap["male"];
          if (normalizedGender === "female" || normalizedGender === "f")
            return genderMap["female"];
          if (normalizedGender === "other") return genderMap["other"];

          // Direct lookup
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
          if (!guestTypeString || !guestTypeString.trim()) return guestTypeMap["single"]; // Default to single

          const normalizedGuestType = guestTypeString.toLowerCase().trim();
          return guestTypeMap[normalizedGuestType] || guestTypeMap["single"];
        };

        // Create group mapping
        const groupMap = createdGroups.reduce((acc, group) => {
          // Map by the group title (which was created from the name)
          acc[group.title] = group.id;
          return acc;
        }, {});

        // Default to first group if no specific group
        const defaultGroupId = createdGroups[0]?.id;

        console.log("Group mapping:", groupMap);
        console.log("Default group ID:", defaultGroupId);
        console.log("Created groups details:");
        createdGroups.forEach((group) => {
          console.log(`  Group ID ${group.id}: title="${group.title}"`);
        });

        const guestPayloads = validGuests
          .map((guest) => {
            const name =
              guest.name ||
              [guest.firstName, guest.lastName].filter(Boolean).join(" ");

            // Try to find group by name, fallback to default
            let groupId = defaultGroupId;
            if (guest.group && guest.group.trim()) {
              groupId = groupMap[guest.group.trim()] || defaultGroupId;
            }

            // Map gender, age group, and guest type to their IDs
            const genderId = getGenderIdFromString(guest.gender);
            const ageGroupId = getAgeGroupIdFromString(guest.ageGroup);
            const guestTypeId = getGuestTypeIdFromString(guest.guestType);

            // Calculate guest_limit based on guest_type
            let calculatedGuestLimit = null;
            const guestTypeName = guest.guestType?.toLowerCase() || "single";
            
            switch (guestTypeName) {
              case "single":
                calculatedGuestLimit = 1;
                break;
              case "variable":
                calculatedGuestLimit = null; // NULL for infinite
                break;
              case "multiple":
                calculatedGuestLimit = guest.guestLimit && guest.guestLimit > 0 ? parseInt(guest.guestLimit) : 1;
                break;
              default:
                calculatedGuestLimit = 1; // Default to single
            }

            console.log(
              `Guest "${name}" -> Group Name: "${guest.group}" -> Mapped ID: ${groupId} -> POC: ${guest.isPointOfContact || false} -> Gender: "${guest.gender}" -> Gender ID: ${genderId} -> Age Group: "${guest.ageGroup}" -> Age Group ID: ${ageGroupId} -> Guest Type: "${guest.guestType}" -> Guest Type ID: ${guestTypeId} -> Raw Guest Limit: ${guest.guestLimit} -> Calculated Guest Limit: ${calculatedGuestLimit}`,
            );
            return {
              group_id: groupId,
              public_id: guest.public_id || crypto.randomUUID(), // Use frontend public_id or generate new one
              name: name,
              email:
                guest.email && guest.email.trim() ? guest.email.trim() : null,
              phone:
                guest.phone && guest.phone.trim() ? guest.phone.trim() : null,
              tag: guest.tag || null,
              gender_id: genderId,
              age_group_id: ageGroupId,
              guest_type_id: guestTypeId,
              guest_limit: calculatedGuestLimit,
              point_of_contact: guest.isPointOfContact || false, // Store POC as boolean on guest record
            };
          })
          .filter((guest) => {
            if (!guest.group_id) {
              console.warn(`Guest "${guest.name}" skipped - no valid group_id`);
              return false;
            }
            return true;
          });

        console.log(
          "Creating guests:",
          guestPayloads.length,
          "out of",
          validGuests.length,
          "valid guests",
        );
        console.log("=== GUEST PAYLOADS FOR DATABASE ===");
        guestPayloads.forEach((payload, index) => {
          console.log(
            `Guest ${index + 1}: "${payload.name}" | POC: ${payload.point_of_contact} | Group ID: ${payload.group_id} | Guest Type ID: ${payload.guest_type_id} | Guest Limit: ${payload.guest_limit} ${payload.guest_limit === null ? '(infinite)' : ''}`,
          );
        });
        console.log("=== END GUEST PAYLOADS ===");

        if (guestPayloads.length > 0) {
          // Step 8a: Check for potential duplicates before saving
          console.log("Step 8a: Checking for potential duplicate guests...");

          // Get existing guests for this event if it's an update
          let existingGuests = [];
          if (existingEvent && !existingEventError) {
            const { data: existingGuestsData, error: existingGuestsError } =
              await supabase
                .from("guests")
                .select(
                  `
      id, name, group_id, point_of_contact, guest_type_id, guest_limit,
      guest_groups!inner(title),
      guest_gender(state),
      guest_age_group(state),
      guest_type(name)
    `,
                )
                .eq("guest_groups.event_id", createdEvent.id);

            if (existingGuestsError) {
              console.error(
                "Error fetching existing guests:",
                existingGuestsError,
              );
            } else {
              existingGuests = existingGuestsData || [];
            }
          }

          // Filter out guests that already have database IDs - they are existing guests being updated
          const newGuestsOnly = guestPayloads.filter((guestPayload, index) => {
            const correspondingFrontendGuest = validGuests[index];
            const hasExistingId =
              correspondingFrontendGuest && correspondingFrontendGuest.id;

            if (hasExistingId) {
              console.log(
                `Guest "${guestPayload.name}" has existing ID ${correspondingFrontendGuest.id} - skipping duplicate check`,
              );
            }

            return !hasExistingId; // Only include guests without existing IDs
          });

          console.log(
            `Checking duplicates for ${newGuestsOnly.length} new guests (filtered out ${guestPayloads.length - newGuestsOnly.length} existing guests)`,
          );

          // Check for duplicates only among new guests
          const duplicates = [];
          const duplicateMap = new Map(); // Track duplicates within the new guest list itself

          newGuestsOnly.forEach((newGuest, newGuestIndex) => {
            // Find the original index in the full validGuests array
            const originalIndex = guestPayloads.findIndex(
              (gp) => gp === newGuest,
            );
            const frontendGuest = validGuests[originalIndex];

            // Check within the new guest list for duplicates
            const duplicateKey = `${newGuest.name.toLowerCase().trim()}-${newGuest.group_id}`;
            if (duplicateMap.has(duplicateKey)) {
              const firstGuestData = duplicateMap.get(duplicateKey);
              duplicates.push({
                type: "within_new_list",
                newGuest: newGuest,
                firstGuestIndex: firstGuestData.originalIndex,
                currentIndex: originalIndex,
                groupTitle: Object.keys(groupMap).find(
                  (key) => groupMap[key] === newGuest.group_id,
                ),
              });
            } else {
              duplicateMap.set(duplicateKey, {
                guest: newGuest,
                originalIndex: originalIndex,
              });
            }

            // Check against existing guests for updates (only if we have existing guests)
            if (existingGuests.length > 0) {
              const existingDuplicate = existingGuests.find(
                (existing) =>
                  existing.name.toLowerCase().trim() ===
                    newGuest.name.toLowerCase().trim() &&
                  existing.group_id === newGuest.group_id,
              );

              if (existingDuplicate) {
                duplicates.push({
                  type: "existing_guest",
                  newGuest: newGuest,
                  existingGuest: existingDuplicate,
                  groupTitle:
                    existingDuplicate.guest_groups?.title || "Unknown Group",
                  newGuestFrontendIndex: originalIndex,
                });
              }
            }
          });

          // If duplicates found and no explicit confirmation, return them for frontend handling
          if (duplicates.length > 0 && !eventData.allowDuplicates) {
            console.log(
              `Found ${duplicates.length} potential duplicate guests among new guests only`,
            );
            console.log("Duplicate details:", duplicates);

            return NextResponse.json({
              success: false,
              duplicatesFound: true,
              duplicates: duplicates.map((dup) => ({
                type: dup.type,
                guestName: dup.newGuest.name,
                groupTitle: dup.groupTitle,
                ...(dup.type === "existing_guest"
                  ? {
                      existingGuestId: dup.existingGuest.id,
                      existingGuestPOC: dup.existingGuest.point_of_contact,
                      newGuestFrontendIndex: dup.newGuestFrontendIndex,
                    }
                  : {
                      firstGuestIndex: dup.firstGuestIndex,
                      currentIndex: dup.currentIndex,
                    }),
              })),
              message:
                "Duplicate guests detected among new guests. Please confirm if you want to proceed.",
            });
          }

          // If duplicates are allowed or no duplicates found, proceed with creation
          console.log(
            "Proceeding with guest creation - no blocking duplicates found",
          );

          const { data: createdGuests, error: guestError } = await supabase
            .from("guests")
            .insert(guestPayloads)
            .select();
          if (guestError) {
            console.error("❌ Guest creation error:", guestError);
            throw guestError;
          }

          console.log("✓ Guests created:", createdGuests.length);

          // Step 8b: Update point of contact for groups based on guest data
          console.log("Step 8b: Updating point of contact for groups...");

          // Create a mapping of group names to created group objects for easy lookup
          const groupNameMap = createdGroups.reduce((acc, group) => {
            acc[group.title] = group;
            return acc;
          }, {});

          console.log(`✓ Guests created: ${createdGuests.length}`);

          // Log POC status and guest type for each created guest
          createdGuests.forEach((guest) => {
            console.log(
              `Guest "${guest.name}" -> POC: ${guest.point_of_contact} (public_id: ${guest.public_id}) -> Guest Type ID: ${guest.guest_type_id} -> Guest Limit: ${guest.guest_limit} ${guest.guest_limit === null ? '(infinite)' : ''}`,
            );
          });

          // Step 8c: Create RSVP records for sub-events (moved inside guest creation scope)
          console.log("Step 8c: Creating RSVP records for sub-events...");

          // Get the created sub-events
          const { data: createdSubEvents, error: subEventFetchError } =
            await supabase
              .from("subevents")
              .select("id, title")
              .eq("event_id", createdEvent.id);

          if (subEventFetchError) {
            console.error("Error fetching sub-events:", subEventFetchError);
          } else if (createdSubEvents && createdSubEvents.length > 0) {
            const rsvpPayloads = [];

            // Create RSVP records based on frontend subEventRSVPs data
            console.log(
              `Processing ${eventData.guests?.length || 0} frontend guests for RSVPs...`,
            );

            for (const frontendGuest of eventData.guests || []) {
              if (
                frontendGuest.subEventRSVPs &&
                Object.keys(frontendGuest.subEventRSVPs).length > 0
              ) {
                console.log(
                  `Processing RSVPs for guest "${frontendGuest.name}" (${Object.keys(frontendGuest.subEventRSVPs).length} RSVPs)`,
                );

                // Find the corresponding created guest from the database result by name and group
                const createdGuest = createdGuests.find(
                  (cg) =>
                    cg.name === frontendGuest.name &&
                    (frontendGuest.group
                      ? groupMap[frontendGuest.group?.trim()] === cg.group_id
                      : true),
                );

                if (createdGuest) {
                  console.log(
                    `Found created guest: "${createdGuest.name}" (ID: ${createdGuest.id}, Group ID: ${createdGuest.group_id})`,
                  );

                  // Process each sub-event RSVP
                  Object.entries(frontendGuest.subEventRSVPs).forEach(
                    ([subEventRef, status]) => {
                      if (status === "invited") {
                        // Try to find matching sub-event by ID first, then by title
                        let matchingSubEvent = createdSubEvents.find(
                          (se) => se.id.toString() === subEventRef.toString(),
                        );

                        if (!matchingSubEvent) {
                          // Try to match by title (for CSV imported events)
                          const searchTitle = subEventRef
                            .replace(/_/g, " ")
                            .toLowerCase();
                          matchingSubEvent = createdSubEvents.find(
                            (se) =>
                              se.title.toLowerCase().includes(searchTitle) ||
                              searchTitle.includes(se.title.toLowerCase()),
                          );
                        }

                        if (matchingSubEvent) {
                          const rsvpRecord = {
                            guest_id: createdGuest.id, // Use the actual database ID
                            subevent_id: matchingSubEvent.id,
                            status_id: 1, // 1 = pending status
                          };
                          rsvpPayloads.push(rsvpRecord);
                          console.log(
                            `RSVP: Guest "${createdGuest.name}" (ID: ${createdGuest.id}) invited to "${matchingSubEvent.title}" (ID: ${matchingSubEvent.id})`,
                          );
                        } else {
                          console.warn(
                            `No matching sub-event found for "${subEventRef}" for guest "${frontendGuest.name}"`,
                          );
                        }
                      }
                    },
                  );
                } else {
                  console.warn(
                    `Could not find created guest for "${frontendGuest.name}" in group "${frontendGuest.group}"`,
                  );
                  console.warn(
                    `Available created guests:`,
                    createdGuests.map(
                      (cg) => `"${cg.name}" (Group ID: ${cg.group_id})`,
                    ),
                  );
                }
              }
            }

            // Deduplicate RSVP records to prevent constraint violations
            if (rsvpPayloads.length > 0) {
              console.log(
                `Deduplicating ${rsvpPayloads.length} RSVP records...`,
              );

              // Create a Map to deduplicate by guest_id + subevent_id combination
              const rsvpMap = new Map();
              const duplicatesFound = [];

              rsvpPayloads.forEach((rsvp, index) => {
                const key = `${rsvp.guest_id}-${rsvp.subevent_id}`;

                if (rsvpMap.has(key)) {
                  duplicatesFound.push({
                    index,
                    key,
                    guest_id: rsvp.guest_id,
                    subevent_id: rsvp.subevent_id,
                  });
                } else {
                  rsvpMap.set(key, rsvp);
                }
              });

              const uniqueRsvpPayloads = Array.from(rsvpMap.values());

              console.log(
                `After deduplication: ${uniqueRsvpPayloads.length} unique RSVP records (removed ${rsvpPayloads.length - uniqueRsvpPayloads.length} duplicates)`,
              );

              if (duplicatesFound.length > 0) {
                console.warn(
                  "Duplicate RSVP records found and removed:",
                  duplicatesFound,
                );
              }

              if (uniqueRsvpPayloads.length > 0) {
                console.log(
                  `Creating ${uniqueRsvpPayloads.length} unique RSVP records...`,
                );

                const { error: rsvpError } = await supabase
                  .from("rsvps")
                  .insert(uniqueRsvpPayloads);

                if (rsvpError) {
                  console.error("Error creating RSVP records:", rsvpError);
                  console.error(
                    "Sample RSVP payloads:",
                    uniqueRsvpPayloads.slice(0, 5),
                  );
                  // Don't fail the entire operation for RSVP errors
                } else {
                  console.log("✓ RSVP records created successfully");
                }
              }
            } else {
              console.log("No RSVP records to create");
            }
          } else {
            console.log("No sub-events found for RSVP creation");
          }
        } else {
          console.log(
            "⚠️ No guests created - all guests filtered out due to missing group assignments",
          );
        }
      }
    }

    // Step 9: Handle email templates
    console.log("Step 9: Handling email templates...");

    // Helper function to get category ID
    const getCategoryId = async (categoryName) => {
      const { data: category, error } = await supabase
        .from("email_template_categories")
        .select("id")
        .eq("name", categoryName || "invitation")
        .single();
      
      if (error) {
        console.warn(`Category lookup error for "${categoryName}":`, error);
        return 1; // Default to invitation category
      }
      return category.id;
    };

    // Helper function to get status ID
    const getStatusId = async (statusName) => {
      const { data: status, error } = await supabase
        .from("email_template_status")
        .select("id")
        .eq("name", statusName || "draft")
        .single();
      
      if (error) {
        console.warn(`Status lookup error for "${statusName}":`, error);
        return 1; // Default to draft status
      }
      return status.id;
    };

    // Check if we have email templates to process
    const hasEmailTemplates = eventData.emailTemplates && eventData.emailTemplates.length > 0;

    if (hasEmailTemplates) {
      const validTemplates = eventData.emailTemplates.filter(
        (template) => template.title && template.title.trim() && template.subject_line && template.subject_line.trim()
      );

      if (validTemplates.length > 0) {
        if (existingEvent && !existingEventError) {
          // For existing events, update/insert/delete email templates to preserve IDs
          console.log("Updating existing email templates...", createdEvent);

          // Get existing email templates
          const { data: existingTemplates, error: fetchError } = await supabase
            .from("email_templates")
            .select("*")
            .eq("event_id", createdEvent.id);

          if (fetchError) {
            console.error("Error fetching existing email templates:", fetchError);
            throw fetchError;
          }

          const existingTemplatesMap = new Map();
          (existingTemplates || []).forEach((template) => {
            existingTemplatesMap.set(template.id, template);
          });

          // Track which templates to update/insert
          const templatesToUpdate = [];
          const templatesToInsert = [];
          const processedIds = new Set();

          for (const template of validTemplates) {
            // If template has an ID and exists in DB, update it
            if (template.id && existingTemplatesMap.has(template.id)) {
              const categoryId = await getCategoryId(template.category);
              const statusId = await getStatusId(template.status);

              templatesToUpdate.push({
                id: template.id,
                event_id: createdEvent.id,
                category_id: categoryId,
                template_status_id: statusId,
                name: template.title,
                subject_line: template.subject_line,
                sender_name: template.sender_name || "Event Host",
                description: template.description || null,
                title: template.subtitle || null,
                subtitle: template.subtitle || null,
                greeting: template.greeting || null,
                body: template.body || null,
                signoff: template.signoff || null,
                reply_to: template.reply_to || null,
                is_default: template.is_default || false,
                primary_color: template.primary_color || null,
                secondary_color: template.secondary_color || null,
                font_color: template.text_color || null,
              });
              processedIds.add(template.id);
            } else {
              // New template, insert it
              const categoryId = await getCategoryId(template.category);
              const statusId = await getStatusId(template.status);

              templatesToInsert.push({
                event_id: createdEvent.id,
                category_id: categoryId,
                template_status_id: statusId,
                name: template.title,
                subject_line: template.subject_line,
                sender_name: template.sender_name || "Event Host",
                description: template.description || null,
                title: template.subtitle || null,
                subtitle: template.subtitle || null,
                greeting: template.greeting || null,
                body: template.body || null,
                signoff: template.signoff || null,
                reply_to: template.reply_to || null,
                is_default: template.is_default || false,
                primary_color: template.primary_color || null,
                secondary_color: template.secondary_color || null,
                font_color: template.text_color || null,
              });
            }
          }

          // Delete templates that are no longer in the frontend data
          const templateIdsToDelete = [];
          existingTemplates.forEach((template) => {
            if (!processedIds.has(template.id)) {
              templateIdsToDelete.push(template.id);
            }
          });

          // Perform updates
          if (templatesToUpdate.length > 0) {
            console.log(`Updating ${templatesToUpdate.length} existing email templates...`);
            for (const template of templatesToUpdate) {
              const { id, ...updateData } = template;
              const { error: updateError } = await supabase
                .from("email_templates")
                .update(updateData)
                .eq("id", id);

              if (updateError) {
                console.error(`Error updating email template ${id}:`, updateError);
                throw updateError;
              }
            }
          }

          // Perform inserts
          if (templatesToInsert.length > 0) {
            console.log(`Inserting ${templatesToInsert.length} new email templates...`);
            const { error: insertError } = await supabase
              .from("email_templates")
              .insert(templatesToInsert);

            if (insertError) {
              console.error("Error inserting new email templates:", insertError);
              throw insertError;
            }
          }

          // Perform deletes
          if (templateIdsToDelete.length > 0) {
            console.log(`Deleting ${templateIdsToDelete.length} removed email templates...`);
            const { error: deleteError } = await supabase
              .from("email_templates")
              .delete()
              .in("id", templateIdsToDelete);

            if (deleteError) {
              console.error("Error deleting removed email templates:", deleteError);
              throw deleteError;
            }
          }

          console.log("✓ Email templates updated successfully");
        } else {
          // For new events, just insert all email templates
          console.log("Creating new email templates...");
          const templatePayloads = [];

          for (const template of validTemplates) {
            const categoryId = await getCategoryId(template.category);
            const statusId = await getStatusId(template.status);

            templatePayloads.push({
              event_id: createdEvent.id,
              category_id: categoryId,
              template_status_id: statusId,
              name: template.title,
              subject_line: template.subject_line,
              sender_name: template.sender_name || "Event Host",
              description: template.description || null,
              title: template.subtitle || null,
              subtitle: template.subtitle || null,
              greeting: template.greeting || null,
              body: template.body || null,
              signoff: template.signoff || null,
              reply_to: template.reply_to || null,
              is_default: template.is_default || false,
              primary_color: template.primary_color || null,
              secondary_color: template.secondary_color || null,
              font_color: template.text_color || null,
            });
          }

          const { data: createdTemplates, error: templateError } = await supabase
            .from("email_templates")
            .insert(templatePayloads)
            .select();

          if (templateError) {
            console.error("❌ Email template creation error:", templateError);
            throw templateError;
          }

          console.log("✓ Email templates created:", createdTemplates.length);
        }
      }
    }

    // Step 10: Handle landing page config (always create with defaults if not provided)
    console.log("Step 10: Handling landing page config...");

    // For existing events, delete old landing page config first
    if (existingEvent && !existingEventError) {
      console.log("Deleting existing landing page config...");
      await supabase
        .from("landing_page_configs")
        .delete()
        .eq("event_id", createdEvent.id);
    }

    const config = eventData.landingPageConfig || {};
    const rsvp = eventData.rsvpSettings || {};

    console.log("RSVP settings received:", JSON.stringify(rsvp, null, 2));

    const landingConfigPayload = {
      event_id: createdEvent.id,
      title: config.title || rsvp.pageTitle || "You're Invited!",
      logo: config.logo || rsvp.logo || null,
      greeting_config: config.greeting_config || {
        message: rsvp.welcomeMessage || "Welcome!",
        subtitle: rsvp.subtitle || "Join us for our special event",
        theme: rsvp.theme || "elegant",
        font_family: rsvp.fontFamily || "Playfair Display",
        background_color: rsvp.backgroundColor || "#faf5ff",
        text_color: rsvp.textColor || "#581c87",
        primary_color: rsvp.primaryColor || "#7c3aed",
        background_image: rsvp.backgroundImage || null,
        background_overlay: rsvp.backgroundOverlay || 20,
      },
      rsvp_config: config.rsvp_config || {
        custom_questions: rsvp.customQuestions || ["dietary", "message"],
      },
      status: action === "published" ? "published" : "draft",
    };

    console.log(
      "Landing config payload:",
      JSON.stringify(landingConfigPayload, null, 2),
    );

    const { error: configError } = await supabase
      .from("landing_page_configs")
      .insert(landingConfigPayload);

    if (configError) {
      console.error("❌ Landing config creation error:", configError);
      // Don't throw - this is optional but log detailed error
      console.error(
        "Full error details:",
        JSON.stringify(configError, null, 2),
      );
      console.log("Continuing without landing page config...");
    } else {
      console.log("✓ Landing page config created successfully");
    }

    console.log("=== EVENT CREATION COMPLETED SUCCESSFULLY ===");

    // Return success response
    return NextResponse.json({
      success: true,
      event: createdEvent,
      id: createdEvent.id,
      eventId: createdEvent.id,
      action: action,
      message:
        action === "published"
          ? "Event published successfully!"
          : "Draft saved successfully!",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("=== EVENT CREATION FAILED ===");
    console.error("Error:", error);

    return NextResponse.json(
      {
        error: "Failed to save event. Please try again.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

// Keep the DELETE function as is
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

    const url = new URL(request.url);
    const eventId = url.searchParams.get("eventId");
    console.log("DELETE request received with eventId:", eventId);

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 },
      );
    }

    // Verify user owns this event
    const { data: eventManager, error: managerError } = await supabase
      .from("event_managers")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userProfile.id)
      .eq("role_id", 1)
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
