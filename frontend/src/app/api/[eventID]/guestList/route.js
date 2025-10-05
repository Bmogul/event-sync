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
    const { event, guestList, groups, rsvpsToDelete, deletedGuests } = body;

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

    // sanatizing groups

    const groupsToUpsert = groups.map((g) => {
      const { id, details = {}, ...rest } = g;
      return {
        ...rest,
        ...(id >= 0 ? { id } : {}), // only include id if it's real
        event_id: eventData.id,
        details: {
          ...details,
          tempId: id, // store the original id (even if negative)
        },
      };
    });

    console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "GROUPS TO UPDATE / CREATE",
    );
    console.log(groupsToUpsert);
    /*console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "GUESTS TO UPDATE",
    );
    console.log(guestList);*/

    // CREATE / UPDATE GROUPS
    const { data: updatedGroups, error: updatedGroupsError } = await supabase
      .from("guest_groups")
      .upsert(groupsToUpsert)
      .select();

    console.log("POST", `api/${eventID}/guestList/route.js`, "UPDATED VALUES");
    console.log(updatedGroups);

    if (updatedGroupsError || !updatedGroups) {
      console.log(
        Date.now(),
        "POST",
        `api/${eventID}/guestList/route.js`,
        "FAILED TO CEATE GROUP",
        updatedGroupsError,
      );
      return NextResponse.json(
        { validated: false, message: "Failed to create group" },
        { status: 403 },
      );
    }

    // CREATE / UPDATE GUESTS
    //
    // mapping temp id with db id to map guests to groups
    const idMap = {};
    updatedGroups.forEach((g) => {
      if (g.details?.tempId !== undefined) {
        idMap[g.details.tempId] = g.id;
      }
    });

    const guestsToUpsert = guestList.map((g) => {
      const payload = {
        group_id: idMap[g.group_id] ?? g.group_id,
        user_id: g.user_id ?? null,
        name: g.name,
        email: g.email || null,
        phone: g.phone || null,
        tag: g.tag || null,
        gender_id: g.gender_id ?? null,
        age_group_id: g.age_group_id ?? null,
        point_of_contact: g.point_of_contact ?? false,
        public_id: g.public_id ? g.public_id : crypto.randomUUID(),
        guest_type_id: g.guest_type_id ?? null,
        guest_limit: g.guest_limit ?? null,
        details: {
          ...(g.details || {}),
          tempId: g.id, // keep tempId for reconciliation
        },
      };

      // include id ONLY if valid (non-negative, existing DB id)
      if (g.id >= 0) {
        payload.id = g.id;
      }

      return payload;
    });

    const newGuests = guestsToUpsert.filter((g) => !g.id);
    const existingGuests = guestsToUpsert.filter((g) => g.id);

    console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "guests to insert",
      newGuests,
    );
    console.log(
      "POST",
      `api/${eventID}/guestList/route.js`,
      "guests to upsert",
      existingGuests,
    );

    let insertedGuests = [];
    let upsertedGuests = [];

    // Insert new guests
    if (newGuests.length) {
      const { data, error } = await supabase
        .from("guests")
        .insert(newGuests)
        .select();
      if (error) {
        console.log(
          Date.now(),
          "POST",
          `api/${eventID}/guestList/route.js`,
          "FAILED TO INSERT Guests",
          error,
        );
        return NextResponse.json(
          { validated: false, message: "Failed to insert guests", error },
          { status: 403 },
        );
      }
      insertedGuests = data || [];
    }

    // Upsert existing guests
    if (existingGuests.length) {
      const { data, error } = await supabase
        .from("guests")
        .upsert(existingGuests)
        .select();
      if (error) {
        console.log(
          Date.now(),
          "POST",
          `api/${eventID}/guestList/route.js`,
          "FAILED TO UPSERT Guests",
          error,
        );
        return NextResponse.json(
          { validated: false, message: "Failed to upsert guests", error },
          { status: 403 },
        );
      }
      upsertedGuests = data || [];
    }

    // Merge results
    const updatedGuests = [...insertedGuests, ...upsertedGuests];

    // DELETE RSVPS that are no longer needed
    if (rsvpsToDelete && rsvpsToDelete.length > 0) {
      console.log(
        "POST",
        `api/${eventID}/guestList/route.js`,
        "DELETING RSVPs",
        rsvpsToDelete
      );

      // Build guest tempId → realId map for deletions
      const guestIdMapForDeletion = {};
      updatedGuests.forEach((guest) => {
        if (guest.details?.tempId !== undefined) {
          guestIdMapForDeletion[guest.details.tempId] = guest.id;
        }
      });

      for (const rsvpToDelete of rsvpsToDelete) {
        // Map temp guest ID to real guest ID if needed
        const realGuestId = guestIdMapForDeletion[rsvpToDelete.guest_id] ?? rsvpToDelete.guest_id;

        // Only attempt deletion if we have a valid (non-negative) guest ID
        if (realGuestId >= 0) {
          const { data: deletedRsvp, error: deleteError } = await supabase
            .from("rsvps")
            .delete()
            .eq("guest_id", realGuestId)
            .eq("subevent_id", rsvpToDelete.subevent_id);

          if (deleteError) {
            console.log(
              Date.now(),
              "POST",
              `api/${eventID}/guestList/route.js`,
              "FAILED TO DELETE RSVP",
              deleteError,
              { ...rsvpToDelete, realGuestId }
            );
            // Continue with other deletions even if one fails
          } else {
            console.log(
              "POST",
              `api/${eventID}/guestList/route.js`,
              "SUCCESSFULLY DELETED RSVP",
              { ...rsvpToDelete, realGuestId }
            );
          }
        } else {
          console.log(
            "POST",
            `api/${eventID}/guestList/route.js`,
            "SKIPPING RSVP DELETION - invalid guest ID",
            rsvpToDelete
          );
        }
      }
    }

    // DELETE GUESTS that have been marked for deletion
    if (deletedGuests && deletedGuests.length > 0) {
      console.log(
        "POST",
        `api/${eventID}/guestList/route.js`,
        "DELETING GUESTS",
        deletedGuests
      );

      for (const guestToDelete of deletedGuests) {
        // Only delete if we have a valid database ID (positive integer)
        if (guestToDelete.id && guestToDelete.id > 0) {
          // First, get guest info to handle POC and group cleanup
          const { data: guestInfo, error: fetchError } = await supabase
            .from("guests")
            .select(`
              id,
              name,
              group_id,
              point_of_contact,
              guest_groups(id, title)
            `)
            .eq("id", guestToDelete.id)
            .single();

          if (fetchError || !guestInfo) {
            console.log(
              Date.now(),
              "POST",
              `api/${eventID}/guestList/route.js`,
              "FAILED TO FETCH GUEST FOR DELETION",
              fetchError,
              guestToDelete
            );
            continue; // Skip this guest and continue with others
          }

          // Delete the guest (cascades to RSVPs automatically if ON DELETE CASCADE)
          const { error: deleteError } = await supabase
            .from("guests")
            .delete()
            .eq("id", guestToDelete.id);

          if (deleteError) {
            console.log(
              Date.now(),
              "POST",
              `api/${eventID}/guestList/route.js`,
              "FAILED TO DELETE GUEST",
              deleteError,
              guestToDelete
            );
            // Continue with other deletions even if one fails
          } else {
            console.log(
              "POST",
              `api/${eventID}/guestList/route.js`,
              "SUCCESSFULLY DELETED GUEST",
              guestToDelete
            );

            // Check if this was the last guest in the group
            const { data: remainingGuests, error: countError } = await supabase
              .from("guests")
              .select("id")
              .eq("group_id", guestInfo.group_id);

            if (countError) {
              console.error("Error counting remaining guests:", countError);
            } else if (remainingGuests.length === 0) {
              // Delete the empty group
              const { error: groupDeleteError } = await supabase
                .from("guest_groups")
                .delete()
                .eq("id", guestInfo.group_id);

              if (groupDeleteError) {
                console.error("Error deleting empty group:", groupDeleteError);
              } else {
                console.log(`Deleted empty group ${guestInfo.group_id}`);
              }
            } else if (guestInfo.point_of_contact) {
              // If deleted guest was POC, assign POC to first remaining member
              const { error: pocUpdateError } = await supabase
                .from("guests")
                .update({ point_of_contact: true })
                .eq("id", remainingGuests[0].id);

              if (pocUpdateError) {
                console.error("Error updating POC:", pocUpdateError);
              } else {
                console.log(`Transferred POC to guest ${remainingGuests[0].id}`);
              }
            }
          }
        } else {
          console.log(
            "POST",
            `api/${eventID}/guestList/route.js`,
            "SKIPPING GUEST DELETION - invalid or temporary ID",
            guestToDelete
          );
        }
      }
    }

    // CREATE / UPDATE RSVPS
    // Build guest tempId → realId map
    const guestIdMap = {};
    updatedGuests.forEach((guest) => {
      if (guest.details?.tempId !== undefined) {
        guestIdMap[guest.details.tempId] = guest.id;
      }
    });

    const rsvpsToUpsert = [];

    guestList.forEach((g) => {
      const realGuestId = guestIdMap[g.id] ?? g.id; // map temp guest id → real
      if (!g.rsvp_status) return;

      Object.values(g.rsvp_status).forEach((status) => {
        rsvpsToUpsert.push({
          guest_id: realGuestId,
          subevent_id: status.subevent_id,
          response: status.response,
          status_id: status.status_id,
        });
      });
    });

    if (rsvpsToUpsert.length > 0) {
      const { data: updatedRsvps, error: rsvpsError } = await supabase
        .from("rsvps")
        .upsert(rsvpsToUpsert)
        .select();

      if (rsvpsError) {
        console.log(
          Date.now(),
          "POST",
          `api/${eventID}/guestList/route.js`,
          "FAILED TO CEATE rsvps",
          rsvpsError,
        );
        return NextResponse.json(
          { validated: false, message: "Failed to create rsvps" },
          { status: 403 },
        );
      }
    }

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
