import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";


// Get Guest Data for RSVP (Group-based)
export async function GET(request, { params }) {
  const { eventID } = params;
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("guestId") || searchParams.get("guid");

  if (!groupId || groupId === "null") {
    return NextResponse.json({ message: "Missing group ID" }, { status: 400 });
  }

  try {
    const supabase = createClient();

    // Get event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        id,
        public_id,
        title,
        description,
        start_date,
        end_date,
        capacity,
        status_id,
        details,
        logo_url,
        hero_url,
        background_image_url,
        landing_page_configs (
          id,
          title,
          logo,
          greeting_config,
          rsvp_config,
          status
        )
      `)
      .eq("public_id", eventID)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    // Get guest group by ID
    const { data: group, error: groupError } = await supabase
      .from("guest_groups")
      .select(`
        id,
        title,
        event_id
      `)
      .eq("id", parseInt(groupId))
      .eq("event_id", event.id)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ message: "Group not found for this event" }, { status: 404 });
    }

    // Get all guests in this group
    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select(`
        id,
        public_id,
        name,
        email,
        phone,
        tag,
        point_of_contact,
        group_id,
        guest_gender (
          id,
          state
        ),
        guest_age_group (
          id,
          state
        )
      `)
      .eq("group_id", group.id);

    if (guestError || !guests || guests.length === 0) {
      return NextResponse.json({ message: "No guests found in this group" }, { status: 404 });
    }

    // Get sub-events
    const { data: subEvents } = await supabase
      .from("subevents")
      .select("id, title, event_date, start_time, venue_address, capacity, details")
      .eq("event_id", event.id)
      .order("created_at");

    // Get RSVPs
    const guestIds = guests.map(g => g.id);
    const { data: existingRsvps } = await supabase
      .from("rsvps")
      .select(`
        guest_id,
        subevent_id,
        status_id,
        response,
        details,
        subevents (
          id,
          title
        )
      `)
      .in("guest_id", guestIds);

    // Transform guests data
    const party = guests.map(guest => {
      const guestRsvps = existingRsvps?.filter(r => r.guest_id === guest.id) || [];
      const invites = {};
      subEvents?.forEach(subEvent => {
        const rsvp = guestRsvps.find(r => r.subevent_id === subEvent.id);
        invites[subEvent.title] = rsvp ? rsvp.status_id : 1;
      });

      return {
        id: guest.id,
        public_id: guest.public_id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        tag: guest.tag,
        point_of_contact: guest.point_of_contact,
        group: group.title,
        group_id: group.id,
        gender: guest.guest_gender?.state,
        ageGroup: guest.guest_age_group?.state,
        invites,
        rsvps: guestRsvps
      };
    });

    return NextResponse.json({
      party,
      event,
      subEvents: subEvents || [],
      group: {
        id: group.id,
        title: group.title
      }
    });

  } catch (error) {
    console.error("RSVP GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}



// Submit RSVP Responses
export async function POST(request, { params }) {
  const { eventID } = params;

  try {
    const { party, responses, guestDetails, customQuestionResponses } = await request.json();

    if (!party || party.length === 0) {
      return NextResponse.json({ error: "Invalid data format - no party data" }, { status: 400 });
    }

    const supabase = createClient();

    // Fetch event
    const { data: event } = await supabase
      .from("events")
      .select("id, public_id")
      .eq("public_id", eventID)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Sub-events
    const { data: subEvents } = await supabase
      .from("subevents")
      .select("id, title")
      .eq("event_id", event.id);

    const rsvpUpdates = [];
    const guestUpdates = [];

    for (const member of party) {
      const { id: guestId, public_id, responses: memberResponses } = member;

      if (!guestId && !public_id) continue;

      // guest detail updates
      if (guestDetails && guestDetails[public_id || guestId]) {
        const details = guestDetails[public_id || guestId];
        guestUpdates.push({
          id: guestId,
          email: details.email,
          phone: details.phone,
        });
      }

      // RSVP responses
      if (memberResponses && subEvents) {
        for (const subEvent of subEvents) {
          const response = memberResponses[subEvent.title] || memberResponses[subEvent.id];
          if (response !== undefined) {
            let statusId;
            switch (String(response).toLowerCase()) {
              case "attending":
              case "yes":
              case "2":
                statusId = 3;
                break;
              case "not_attending":
              case "no":
              case "3":
                statusId = 4;
                break;
              case "maybe":
              case "4":
                statusId = 5;
                break;
              default:
                statusId = 1;
            }

            rsvpUpdates.push({
              guest_id: guestId,
              subevent_id: subEvent.id,
              status_id: statusId,
              response: parseInt(response) || 0,
              details: {
                submitted_at: new Date().toISOString(),
                response_value: response,
                custom_questions: customQuestionResponses || {},
              },
            });
          }
        }
      }
    }

    // update guest contacts
    for (const update of guestUpdates) {
      await supabase.from("guests").update({
        email: update.email,
        phone: update.phone,
      }).eq("id", update.id);
    }

    // upsert RSVPs
    if (rsvpUpdates.length > 0) {
      await supabase
        .from("rsvps")
        .upsert(rsvpUpdates, { onConflict: "guest_id,subevent_id" });
    }

    return NextResponse.json({
      success: true,
      updated: { guests: guestUpdates.length, rsvps: rsvpUpdates.length }
    });

  } catch (error) {
    console.error("RSVP POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

