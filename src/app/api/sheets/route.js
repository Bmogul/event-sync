import { NextResponse } from "next/server";
import { getGoogleSheets, getAuthClient } from "../../lib/google-sheets";

const getCentralTimeDate = () => {
  const centralTimeZone = 'America/Chicago'; // Central Time Zone
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const centralTimeMs = now.getTime() - offsetMs;
  const centralTime = new Date(centralTimeMs);

  // Get the year, month, and date components
  const year = centralTime.getFullYear();
  const month = String(centralTime.getMonth() + 1).padStart(2, '0');
  const day = String(centralTime.getDate()).padStart(2, '0');

  return `${month}/${day}/${year}`;
};

const getParty = async (guid) => {
  const sheetID = process.env.GOOGLE_SHEET_ID
  const sheets = await getGoogleSheets();
  try {
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Main"
    })

    const rows = mainSheet.data.values
    if (rows.length) {
      const headers = rows[0]

      const matchingRows = rows.slice(1)
        .filter(row => row[0] === guid)
        .map(row => {
          return headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
          }, {});
        });

      if (matchingRows.length > 0) {
        return matchingRows
      } else {
        return null
      }
    } else {
      console.log("No data found")
      return null
    }
  } catch (error) {
    console.error('The API returned an error: ' + error);
    throw error;
  }
}

const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const guid = searchParams.get("guid");

  if (!guid || guid === "null")
    return NextResponse.json({ message: "Missing guid" }, { status: 400 });

  // Query DB for party
  const party = await getParty(guid)
  console.log("PARTY INFO: ", party ? party : "Not found")

  return NextResponse.json(party, { status: 200 });
}

const POST = async () => {

}

export { GET, POST }
