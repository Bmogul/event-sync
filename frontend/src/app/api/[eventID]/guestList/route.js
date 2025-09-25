import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(request, { params }) {
  const { eventID } = params;
  const { searchParams } = new URL(request.url);
  const password = searchParams.get("password");
  console.log("GET GUESTLIST, ", eventID, searchParams);

  if (!eventID) {
    return NextResponse.json(
      { error: "Event ID is required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createClient();
    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization"); // e.g., "Bearer <token>"
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { validated: false, message: "No auth token" },
        { status: 401 },
      );
    }
    console.log("got token", token);

    // Get the current user from Supabase
    const {
      data: { user },
      err,
    } = await supabase.auth.getUser(token);

    console.log("\nUSER\n", user, err);

    if (err || !user) {
      return NextResponse.json(
        { validated: false, message: "Invalid user" },
        { status: 401 },
      );
    }

    const { data: userProfile, error: err_fetching_user } = await supabase
      .from("users")
      .select("*")
      .eq("supa_id", user.id)
      .single();
    if (err_fetching_user || !userProfile) {
      return NextResponse.json(
        { validated: false, message: "Invalid user" },
        { status: 401 },
      );
    }
    const currentUser = userProfile;
    console.log(currentUser);

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(
        `
        id,
        public_id,
        title,
        status_id,
        details
      `,
      )
      .eq("public_id", eventID)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check access permissions using event_managers table
    const { data: managers, error } = await supabase
      .from("event_managers")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", currentUser.id)
      .limit(1);

    console.log(event.id, currentUser.id, managers);

    if (error) {
      console.error("Error checking event manager:", error);
      return NextResponse.json(
        { validated: false, message: "Error checking permissions" },
        { status: 500 },
      );
    }

    // If no matching entry found, deny access
    if (!managers || managers.length === 0) {
      return NextResponse.json(
        { validated: false, message: "Access denied" },
        { status: 200 },
      );
    }

    // Fetch all guests for this event through guest_groups relationship
    const { data: allGuests, error: guestError } = await supabase
      .from("guests")
      .select(
        `
        id,
        public_id,
        name,
        email,
        phone,
        tag,
        point_of_contact,
        group_id,
        guest_groups!inner (
          id,
          title,
          event_id,
          status_id,
          invite_sent_at
        ),
        guest_gender (
          id,
          state
        ),
        guest_age_group (
          id,
          state
        ),
        rsvps (
          subevent_id,
          guest_id,
          status_id,
          response,
          subevents (
            id,
            title
          )
        ),
        guest_type (
          id,
          name
        ),
        guest_limit
      `,
      )
      .eq("guest_groups.event_id", event.id)
      .order("name");

    if (guestError) {
      console.error("Guest fetch error:", guestError);
      return NextResponse.json(
        { error: "Failed to fetch guest list", message: guestError },
        { status: 500 },
      );
    }

    // Transform guests
    const transformedUsers =
      allGuests?.map((guest) => ({
        id: guest.id,
        public_id: guest.public_id,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        tag: guest.tag,
        point_of_contact: guest.point_of_contact, // boolean
        group: guest.guest_groups?.title,
        group_id: guest.guest_groups?.id,
        group_status_id: guest.guest_groups?.status_id,
        group_invite_sent_at: guest.guest_groups?.invite_sent_at,
        gender: guest.guest_gender?.state,
        gender_id: guest.guest_gender?.id,
        ageGroup: guest.guest_age_group?.state,
        age_group_id: guest.guest_age_group?.id,
        guest_type: guest.guest_type?.name,
        guest_type_id: guest.guest_type?.id,
        guest_limit: guest.guest_limit,
        rsvp_status:
          guest.rsvps?.reduce((acc, rsvp) => {
            if (rsvp.subevents) {
              acc[rsvp.subevents.title] = {
                subevent_id: rsvp.subevent_id,
                status_id: rsvp.status_id,
                status_name: getStatusName(rsvp.status_id),
                response: rsvp.response,
              };
            }
            return acc;
          }, {}) || {},
        total_rsvps: guest.rsvps?.length || 0,
      })) || [];

    return NextResponse.json(
      {
        validated: true,
        allUsers: transformedUsers,
        event: {
          id: event.id,
          public_id: event.public_id,
          title: event.title,
          status_id: event.status_id,
        },
        total_guests: transformedUsers.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Guest list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request, { params }) {
  const { eventID } = params;

  try {
    const supabase = createClient();
    const body = await request.json();
    const { event, guestList, groups } = body;

    // Get auth token from request headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { validated: false, message: "No auth token" },
        { status: 401 },
      );
    }

    // Get the current user from Supabase
    const {
      data: { user: supaUser },
      error: supaUserError,
    } = await supabase.auth.getUser(token);

    if (supaUserError || !supaUser) {
    console.log(
      Date.now(),
      "POST",
      `api/${eventID}/guestList/route.js`,
      "SUPAUSER ERROR",
      supaUserError,
    );
      return NextResponse.json(
        { validated: false, message: "Invalid user" },
        { status: 401 },
      );
    }

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("supa_id", supaUser.id)
      .single();
    if (userError || !user) {
    // Check access permissions
    console.log(
      Date.now(),
      "POST",
      `api/${eventID}/guestList/route.js`,
      "USER ERROR",
      userError,
    );
      return NextResponse.json(
        
        { validated: false, message: "Invalid user: Profile not created" },
        { status: 401 },
      );
    }

    // Fetch event
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("id, public_id, title")
      .eq("public_id", eventID)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check access permissions
    console.log(
      Date.now(),
      "POST",
      `api/${eventID}/guestList/route.js`,
      "eventData.id:",
      eventData.id,
    );
    console.log(
      Date.now(),
      "POST",
      `api/${eventID}/guestList/route.js`,
      "user.id",
      user.id,
    );
    const { data: managers, error: managerError } = await supabase
      .from("event_managers")
      .select("*")
      .eq("event_id", eventData.id)
      .eq("user_id", user.id)
      .limit(1);

    if (managerError || !managers || managers.length === 0) {
      console.log(
        Date.now(),
        "POST",
        `api/${eventID}/guestList/route.js`,
        "ACCESS DENIED",
        managerError,
      );
      return NextResponse.json(
        { validated: false, message: "Access denied" },
        { status: 403 },
      );
    }

    // Here you would implement the guest list update logic
    // For now, just return success
    //
    console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "GUESTS TO UPDATE / CREATE",
    );
    console.log(guestList);
    console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "GROUPS TO UPDATE / CREATE",
    );
    console.log(groups);
    /*console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "GUESTS TO UPDATE",
    );
    console.log(guestList);*/
    return NextResponse.json(
      {
        validated: true,
        message: "Guest list updated successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Guest list update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper: map RSVP status IDs to names (these should ideally come from rsvp_status table)
function getStatusName(statusId) {
  const statusMap = {
    1: "pending",
    2: "opened",
    3: "attending",
    4: "not_attending",
    5: "maybe",
    6: "no_response",
  };
  return statusMap[statusId] || "unknown";
}
