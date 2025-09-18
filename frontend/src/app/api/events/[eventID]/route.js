import { createClient } from "../../../utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { eventID } = params;
  console.log(eventID);

  try {
    const supabase = createClient();

    // Get event data with all related information
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
    id,
    public_id,
    title,
    description,
    start_date,
    end_date,
    capacity,
    total_yes,
    status_id,
    details,
    logo_url,
    hero_url,
    created_at,
    updated_at,
    deleted_at,
    background_image_url,
    landing_page_configs (
      id,
      title,
      landing_page_url,
      logo,
      cards,
      greeting_config,
      rsvp_config,
      status,
      custom_css,
      created_at,
      updated_at,
      published_at,
      deleted_at
    )
  `,
      )
      .eq("public_id", eventID)
      .single();

    console.log(event);

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get sub-events
    const { data: subEvents, error: subEventsError } = await supabase
      .from("subevents")
      .select(
        `
        id,
        title,
        event_date,
        start_time,
        end_time,
        venue_address,
        capacity,
        status_id,
        details,
        created_at
      `,
      )
      .eq("event_id", event.id)
      .order("created_at");

    if (subEventsError) {
      console.error("Sub-events fetch error:", subEventsError);
    }
    console.log(subEvents);

    // Transform the data to match the expected format
    const landingConfig = event.landing_page_configs?.[0];

    const transformedEvent = {
      eventID: event.public_id,
      eventTitle: event.title,
      description: event.description,
      startDate: event.start_date,
      endDate: event.end_date,
      capacity: event.capacity,
      totalYes: event.total_yes,
      status: event.status_id,
      details: event.details || {}, // catch any extra JSON attributes
      logo: event.logo_url,
      hero: event.hero_url,
      background: event.background_image_url,
      numberOfFunctions: subEvents?.length || 0,

      // Landing page config
      landingConfig: landingConfig,
      email_message: landingConfig?.greeting_config?.message || "",

      // Transform sub-events to legacy format
      ...subEvents?.reduce((acc, subEvent, index) => {
        acc[`func${index}`] = {
          funcNum: index,
          funcTitle: subEvent.title,
          cardLink: subEvent.details?.image || null,
          date: formatDateTime(subEvent.event_date, subEvent.start_time),
          location: subEvent.venue_address,
          capacity: subEvent.capacity,
          details: subEvent.details,
        };
        return acc;
      }, {}),
    };

    console.log("Transformed Event", transformedEvent);

    return NextResponse.json(transformedEvent);
  } catch (error) {
    console.error("Event fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to format date and time
function formatDateTime(date, time) {
  if (!date) return "Date TBD";

  try {
    const eventDate = new Date(date);
    const dateStr = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (time) {
      return `${time}, ${dateStr}`;
    }

    return dateStr;
  } catch (error) {
    console.error("Date formatting error:", error);
    return "Date TBD";
  }
}
