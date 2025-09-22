import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export const POST = async (req, { params }) => {
  const { eventID } = params;

  try {
    const supabase = createClient();
    const body = await req.json();
    const { group_id, status_id, invite_method } = body;

    // Get auth token from request headers
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { validated: false, message: "No auth token" },
        { status: 401 },
      );
    }

    // Get the current user from Supabase
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { validated: false, message: "Invalid user" },
        { status: 401 },
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
        { status: 401 },
      );
    }

    // Fetch event to verify it exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, public_id, title")
      .eq("public_id", eventID)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check access permissions
    const { data: managers, error: managerError } = await supabase
      .from("event_managers")
      .select("*")
      .eq("event_id", event.id)
      .eq("user_id", userProfile.id)
      .limit(1);

    if (managerError || !managers || managers.length === 0) {
      return NextResponse.json(
        { validated: false, message: "Access denied" },
        { status: 403 },
      );
    }

    // Validate input
    if (!group_id || !status_id) {
      return NextResponse.json(
        { error: "group_id and status_id are required" },
        { status: 400 },
      );
    }

    // Validate status_id is in valid range (1-6)
    if (status_id < 1 || status_id > 6) {
      return NextResponse.json(
        { error: "status_id must be between 1 and 6" },
        { status: 400 },
      );
    }

    // Get current group status for comparison
    const { data: currentGroup, error: groupFetchError } = await supabase
      .from("guest_groups")
      .select("id, status_id, event_id")
      .eq("id", group_id)
      .eq("event_id", event.id)
      .single();

    if (groupFetchError || !currentGroup) {
      return NextResponse.json(
        { error: "Group not found or doesn't belong to this event" },
        { status: 404 },
      );
    }

    // Map status IDs to names for response
    const statusMap = {
      1: "draft",
      2: "pending",
      3: "invited",
      4: "responded",
      5: "completed",
      6: "cancelled"
    };

    const oldStatus = statusMap[currentGroup.status_id];
    const newStatus = statusMap[status_id];

    // Prepare update data
    const updateData = {
      status_id: status_id,
      updated_at: new Date().toISOString(),
    };

    // If updating to "invited" status (3), also update invite tracking fields
    if (status_id === 3) {
      updateData.invite_sent_at = new Date().toISOString();
      updateData.invite_sent_by = userProfile.id;
    }

    // Update the group status
    const { data: updatedGroup, error: updateError } = await supabase
      .from("guest_groups")
      .update(updateData)
      .eq("id", group_id)
      .eq("event_id", event.id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Group status update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update group status" },
        { status: 500 },
      );
    }

    // Log the action for audit purposes
    console.log(`Group ${group_id} status updated from ${oldStatus} to ${newStatus} by user ${userProfile.id}${invite_method ? ` via ${invite_method}` : ''}`);

    return NextResponse.json(
      {
        validated: true,
        success: true,
        group_id: group_id,
        old_status: oldStatus,
        new_status: newStatus,
        updated_at: updateData.updated_at,
        invite_method: invite_method || null,
        updated_group: updatedGroup
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("UpdateGroupStatus API error:", error);
    return NextResponse.json(
      {
        validated: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 },
    );
  }
};