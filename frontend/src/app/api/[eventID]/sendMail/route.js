import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import Handlebars from "handlebars";
import { createClient } from "../../../utils/supabase/server";
import { reminderTemplate, inviteTemplate } from "./templates.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Compile templates
const compiledReminderTemplate = Handlebars.compile(reminderTemplate);
const compiledInviteTemplate = Handlebars.compile(inviteTemplate);

export const POST = async (req, { params }) => {
  const { eventID } = params;
  
  try {
    const supabase = createClient();
    const body = await req.json();
    const { guestList, emailType = 'invitation' } = body;

    // Get auth token from request headers
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { validated: false, message: "No auth token" },
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

    // Fetch event with details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        id,
        public_id,
        title,
        description,
        start_date,
        end_date,
        details,
        logo_url,
        status_id
      `)
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
        { status: 403 }
      );
    }

    if (!guestList || guestList.length === 0) {
      return NextResponse.json({ error: "No guests provided" }, { status: 400 });
    }

    // Extract email content from event.details JSONB
    const eventDetails = event.details || {};
    const emailConfig = eventDetails.emailConfig || {};
    
    const defaultSender = {
      email: "sender@event-sync.com",
      name: eventDetails.organizerName || eventDetails.senderName || "Event Organizer"
    };

    const emailContent = {
      greeting: emailConfig.greeting || eventDetails.greeting || "Dear Guest,",
      body: emailConfig.body || eventDetails.body || eventDetails.email_message || "You are invited to our special event.",
      signoff: emailConfig.signoff || eventDetails.signoff || "Best regards,",
      subjectLine: emailConfig.subjectLine || eventDetails.subjectLine || `Invitation: ${event.title}`,
      senderName: emailConfig.senderName || eventDetails.senderName || defaultSender.name
    };

    const updatedGuestList = [];
    const emailResults = {
      successful: [],
      failed: []
    };

    // Process each guest
    for (const guest of guestList) {
      try {
        if (!guest.email) {
          updatedGuestList.push(guest);
          emailResults.failed.push({
            guest: guest,
            error: "No email address"
          });
          continue;
        }

        // Generate RSVP link using guest public_id
        const rsvpLink = `${process.env.HOST || 'http://localhost:3000'}/${eventID}/rsvp?guestId=${guest.public_id}`;
        
        const templateData = {
          rsvpLink: rsvpLink,
          eventName: event.title,
          logoLink: event.logo_url,
          greeting: emailContent.greeting,
          body: emailContent.body,
          signoff: emailContent.signoff,
          senderName: emailContent.senderName,
          guestName: guest.name || 'Guest',
          eventDate: event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
          }) : 'Date TBD',
          eventDescription: event.description || ''
        };

        const msg = {
          to: guest.email,
          from: {
            email: defaultSender.email,
            name: emailContent.senderName
          },
          subject: emailContent.subjectLine,
          html: compiledInviteTemplate(templateData)
        };

        // Send email
        await sgMail.send(msg);
        console.log("Email sent to:", guest.email);

        emailResults.successful.push({
          guest: guest,
          email: guest.email
        });

        // Add guest to updated list (we'll handle status updates in database later)
        updatedGuestList.push({
          ...guest,
          emailSent: true,
          lastEmailSent: new Date().toISOString()
        });

      } catch (error) {
        console.error(`Error sending email to ${guest.email}:`, error);
        
        emailResults.failed.push({
          guest: guest,
          error: error.message
        });

        // Add guest to updated list without email status update
        updatedGuestList.push(guest);
      }
    }

    return NextResponse.json({
      validated: true,
      success: true,
      results: {
        total: guestList.length,
        successful: emailResults.successful.length,
        failed: emailResults.failed.length,
        details: emailResults
      },
      guestList: updatedGuestList
    }, { status: 200 });

  } catch (error) {
    console.error("SendMail API error:", error);
    return NextResponse.json(
      { 
        validated: false, 
        error: "Internal server error", 
        message: error.message 
      }, 
      { status: 500 }
    );
  }
};
