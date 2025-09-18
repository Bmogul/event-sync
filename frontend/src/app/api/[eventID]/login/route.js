import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function POST(request, { params }) {
  const { eventID } = params;
  
  try {
    const { password } = await request.json();

    if (!password || !eventID) {
      return NextResponse.json({ error: "Missing password or event ID" }, { status: 400 });
    }

    const supabase = createClient();

    // Get event data and check if password is required
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        id,
        public_id,
        title,
        access_password,
        is_private,
        status_id
      `)
      .eq("public_id", eventID)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if event is published
    if (event.status_id !== 2) { // 2 = published
      return NextResponse.json({ 
        validated: false, 
        message: "Event is not available" 
      }, { status: 200 });
    }

    // If event is not private, no password needed
    if (!event.is_private) {
      return NextResponse.json({ 
        validated: true,
        event: {
          id: event.id,
          public_id: event.public_id,
          title: event.title,
          is_private: event.is_private
        }
      }, { status: 200 });
    }

    // For private events, check password
    const isValidPassword = event.access_password === password;
    
    if (isValidPassword) {
      return NextResponse.json({ 
        validated: true,
        event: {
          id: event.id,
          public_id: event.public_id,
          title: event.title,
          is_private: event.is_private
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        validated: false,
        message: "Invalid password"
      }, { status: 200 });
    }

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

