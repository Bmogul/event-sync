// app/api/cron/daily-reminder/route.js
import { NextResponse } from "next/server";

const eventList = {
  B37DA2389S: {
    sheetID: process.env.NODE_ENV === 'development' 
      ? "1I7tuk4X8590LmagGhLnOm7yfLYTjWE1EB7qmmlhlQCE"
      : "1nN5uQ6-NUT6fS4n8Bz7v4f4X3Be1QtVnTRVOsC_5z4",
    eventID: "B37DA2389S",
    eventTitle: "Rashida Weds Ibrahim",
    numberOfFunctions: 1,
    email_message: "",
    logo: "https://i.imgur.com/gtm1VCd.png",
    func0: {
      funcNum: 0,
      funcTitle: "Khushi Jaman and Darees",
      cardLink: "https://i.imgur.com/Uo5EF2A.jpeg",
      date: "6:30 PM, 28th November 2024, Thursday",
      location: "17730 Coventry Park Dr, Houston, TX 77084",
    },
  },
};

export async function GET(req) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = [];
    
    // Process each event in the list
    for (const [eventID, eventData] of Object.entries(eventList)) {
      const EVENT_DETAILS = {
        password: process.env.EVENT_PASSWORD,
        event: {
          eventID: eventData.eventID,
          eventTitle: eventData.eventTitle,
          eventDate: eventData.func0.date, // Using the first function's date
          sheetID: eventData.sheetID,
          logo: eventData.logo,
          email_message: eventData.email_message
        }
      };

      try {
        // Call reminder API for each event
        console.log(`${process.env.HOST}/api/${eventData.eventID}/remindeCountDown`)
        const response = await fetch(`http://${process.env.HOST}/api/${eventData.eventID}/remindeCountDown/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(EVENT_DETAILS)
        });

        const result = await response.json();
        results.push({
          eventID,
          status: 'success',
          ...result
        });
      } catch (error) {
        console.error(`Error processing event ${eventID}:`, error);
        results.push({
          eventID,
          status: 'error',
          error: error.message
        });
      }
    }

    return NextResponse.json({ 
      message: "Reminder processing complete",
      results 
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
