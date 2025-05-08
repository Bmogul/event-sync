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
    /*sheetID: process.env.NODE_ENV === 'development' 
      ? "1I7tuk4X8590LmagGhLnOm7yfLYTjWE1EB7qmmlhlQCE"
      : "1nN5uQ6-NUT6fS4n8Bz7v4f4X3Be1QtVnTRVOsC_5z4",*/
    sheetID: "1VWd-vWBJoiE5JNu6tOMId79LQkN5W_S8iYBJVGg-Nrs",
    eventID: "B37DA2389S",
    eventTitle: "Sakina Weds Mohammad",
    numberOfFunctions: 2,
    email_message: "",
    logo: "https://i.imgur.com/PVHMOzK.png",
    func0: {
      funcNum: 0,
      funcTitle: "Khushi Jaman and Majlis",
      funcCol: "MainInvite",
      cardLink: "https://i.imgur.com/Vq7vqkn.jpeg",
      date: "Time TBD, 2nd August 2025, Saturday",
      location: "341 Dunhams Corner Rd, East Brunswick, NJ 08816"
    },
    func1:{
      funcNum: 1,
      funcTitle: "Sakina's Shitabi",
      funcCol:"ShitabiInvite",
      cardLink: "https://i.imgur.com/0OIvxSe.jpeg",
      date: "6:00 PM, 1st August 2025, Friday",
      location: "10 Wood Lake Court, North Brunswick NJ 08902 ",
    }
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

