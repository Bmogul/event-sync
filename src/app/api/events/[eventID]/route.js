import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";

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
  B37DA2389S: {
    sheetID: "1nN5uQ6-NUT6fS4n8Bz7v4f4X3Be1QtVnTWRVOsC_5z4",
    // dev
    //sheetID: "1I7tuk4X8590LmagGhLnOm7yfLYTjWE1EB7qmmlhlQCE",
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
  // Add more events as needed
};
/* -\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\ */

export async function GET(request, { params }) {
  const { eventID } = params;
  const sheetID = eventlist[eventID].sheetID;

  if (eventlist[eventID]) {

    const event = eventlist[eventID]
    return new Response(JSON.stringify(event), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ error: "Event not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}

