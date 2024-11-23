import { NextResponse } from "next/server";



const eventList = {
  B37DA2389S: {
    sheetID: "1nN5uQ6-NUT6fS4n8Bz7v4f4X3Be1QtVnTWRVOsC_5z4",
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
    // Process events concurrently
    const processPromises = Object.entries(eventList).map(async ([eventID, eventData]) => {
      const EVENT_DETAILS = {
        password: process.env.EVENT_PASSWORD,
        event: {
          eventID: eventData.eventID,
          eventTitle: eventData.eventTitle,
          eventDate: eventData.func0.date,
          sheetID: eventData.sheetID,
          logo: eventData.logo,
          email_message: eventData.email_message,
        },
      };

      try {
        const baseUrl = process.env.HOST.startsWith('http') 
          ? process.env.HOST 
          : `https://${process.env.HOST}`;
          
        const response = await fetch(
          `${baseUrl}/api/${eventData.eventID}/remindeCountDown`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(EVENT_DETAILS),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return {
          eventID,
          status: "success",
          ...result,
        };
      } catch (error) {
        console.error(`Error processing event ${eventID}:`, error);
        return {
          eventID,
          status: "error",
          error: error.message,
        };
      }
    });

    // Wait for all events to be processed with a timeout
    const results = await Promise.race([
      Promise.all(processPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Processing timeout')), 50000)
      )
    ]);

    return NextResponse.json({
      message: "Reminder processing complete",
      results,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json(
      { error: error.message }, 
      { status: error.message === 'Processing timeout' ? 504 : 500 }
    );
  }
}
