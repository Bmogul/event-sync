export async function GET(request, { params }) {
  const { eventID } = params;

  // Here, you would typically fetch the event data from your database
  // This is just a mock implementation
  /*
   * const eventlist = {
   *  eventID : {
   *    sheetID: sheetID
   *    eventTitle: "Title"
   *    NumberOfFunctions: x
   *  }
   * }*/

  // Fetch data from DB once that is setup, for now static
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */
  const eventlist = {
    0: {
      sheetID: process.env.GOOGLE_SHEET_ID,
      eventTitle: "Rashida Kanchwala Weds Ibrahim Kapasi",
      numberOfFunctions: 1,
      logo: "https://i.imgur.com/gtm1VCd.png",
      func0: {
        funcNum: 0,
        funcTitle: "Khushi Jaman and Darees",
        cardLink: "https://i.imgur.com/X3BNeHd.jpg",
        date: "28th November 2024, Thursday",
        location: "17730 Coventry Park Dr, Houston, TX 77084",
      }
    },
    // Add more events as needed
  };
  /* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

  if (eventlist[eventID]) {
    console.log(eventlist[eventID])
    return new Response(JSON.stringify(eventlist[eventID]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
