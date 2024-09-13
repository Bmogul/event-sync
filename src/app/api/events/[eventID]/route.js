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
        funcTitle: "Ruksathi and Kushi Jaman",
        cardLink: "https://i.imgur.com/X3BNeHd.jpg"
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
