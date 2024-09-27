import { NextResponse } from "next/server";
import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";
import { getCentralTimeDate } from "../../../lib/helpers";

// Get Party
const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const guid = searchParams.get("guid");
  const sheetID = searchParams.get("sheetID");
  let party = {};
  console.log("HELLO THERE", guid, sheetID);

  if (!guid || guid === "null")
    return NextResponse.json({ message: "Missing guid" }, { status: 400 });

  // query DB for party
  console.log(guid);
  const sheets = await getGoogleSheets();
  try {
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Main",
    });
    const rows = mainSheet.data.values;
    if (rows.length) {
      const headers = rows[0];
      const matchingRows = rows
        .slice(1)
        .filter((row) => row[0] === guid)
        .map((row) => {
          return headers.reduce((obj, header, index) => {
            obj[header] = row[index];
            return obj;
          }, {});
        });
      if (matchingRows.length > 0) party = matchingRows;
      else throw new Error("Could not find party");
    } else {
      party = {};
    }
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json(party, { status: 200 });
};

const POST = async (req) => {
  const { party, event } = await req.json();

  if (!party || !event || party.length === 0 || event.length === 0) {
    console.log("INVALUD DARA FORMAT")
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  const sheetID = event.sheetID;
  const sheets = await getGoogleSheets();
  try {
    // Get existing data from sheet
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Main",
    });
    const allValues = mainSheet.data.values || [];
    const valuesToUpdate = {};

    // loop through party and get values to update
    for (const member of party) {
      const { GUID, UID } = member;

      if (!GUID || !UID) {
        continue; // Skip members without GUID or UID
      }

      allValues.filter((row) => {
        console.log(row[0]);
        if (row[0].toString() === GUID && row[1].toString() === UID) {
          const rowNumber = allValues.indexOf(row) + 1;
          const cellRange = `Main!I${rowNumber}:L${rowNumber}`;
          const values = [
            parseInt(member.MainResponse),
            getCentralTimeDate(),
            member.Sent,
          ];

          valuesToUpdate[cellRange] = {
            values: [values],
          };
          return true;
        }
        return false;
      });
    }

    // Batch Update values in sheet
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

      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        resource: batchUpdateRequest,
      });
    }

    // Handle sending back response
    return NextResponse.json({message:"Success"}, {status:200})
  } catch (error) {
    console.error("error posting: \t", e)
    return NextResponse.json({ message: "testing" }, { status: 300 })
  }
};

export { GET, POST };
