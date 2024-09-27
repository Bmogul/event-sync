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

const POST = async (req) => {
  const { party } = await req.json()
  console.log("party", party, "party")

  if (!party || party.length === 0)
    return NextResponse.json(
      { message: "Invalid data format" },
      { status: 400 }
    );

  const sheetID = process.env.GOOGLE_SHEET_ID
  const sheets = await getGoogleSheets();
  try {
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Main"
    })

    const allValues = mainSheet.data.values || []
    const valuesToUpdate = {};

    for (const member of party) {
      const { GUID, UID } = member;

      if (!GUID || !UID) {
        continue; // Skip members without GUID or UID
      }

      allValues.filter((row) => {
        console.log(row[0])
        if (
          row[0].toString() === GUID &&
          row[1].toString() === UID
        ) {
          const rowNumber = allValues.indexOf(row) + 2;
          const cellRange = `Main!I${rowNumber}:L${rowNumber}`;
          const values = [
            parseInt(member.MainResponse),
            getCentralTimeDate(),
            member.Sent
          ];

          valuesToUpdate[cellRange] = {
            values: [values],
          };
          return true;
        }
        return false;
      });
    }

    if (Object.keys(valuesToUpdate).length > 0) {
      const batchUpdateRequest = {
        data: [],
        valueInputOption: "RAW",
      };

      for (const [range, valueData] of Object.entries(valuesToUpdate)) {
        batchUpdateRequest.data.push({
          range,
          ...valueData,
        });
      }

      const res = sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        resource: batchUpdateRequest,
      });
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (e) {
    console.error("error posting: \t", e)
    return NextResponse.json({ message: "testing" }, { status: 300 })
  }
}

export { GET, POST }
