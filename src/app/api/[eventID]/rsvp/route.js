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
      if (matchingRows.length > 0) {
        party = matchingRows;
        for (let i = 0; i < party.length; i++) {
          let member = party[i];
          console.log();
          let invites = [];
          for (let key in member) {
            if (key.includes("Invite")) {
              if (member[key]) invites.push(member[key]);
            }
          }
          console.log(member.Name, invites);
          if (
            !(
              invites.includes(1) ||
              invites.includes("1") ||
              invites.includes("x")
            )
          ) {
            party.splice(i, 1);
            i--;
          }
        }
      } else throw new Error("Could not find party");
    } else {
      party = {};
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json(party, { status: 200 });
};

const POST = async (req) => {
  const { party, event } = await req.json();

  if (!party || !event || party.length === 0 || !event.sheetID) {
    console.log("INVALID DATA FORMAT");
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  const sheetID = event.sheetID;
  const sheets = await getGoogleSheets();

  try {
    // Fetch existing sheet data
    const mainSheet = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "Main",
    });

    const allValues = mainSheet.data.values || [];
    const headers = allValues[0]; // First row contains headers
    const valuesToUpdate = {};

    // Helper: find column index
    const colIndex = (colName) => headers.indexOf(colName);

    for (const member of party) {
      const { GUID, UID } = member;
      console.log(GUID, UID);

      if (!GUID || !UID) continue;

      const rowIndex = allValues.findIndex(
        (row) => row[0]?.toString() === GUID && row[1]?.toString() === UID,
      );

      if (rowIndex === -1) continue;

      const rowNumber = rowIndex + 1; // Sheet rows are 1-indexed
      const updateRow = new Array(headers.length).fill(null);

      // Handle dynamic response columns like "MainResponse", "ShitabiResponse"
      for (const key of Object.keys(member)) {
        if (key.endsWith("Response")) {
          const idx = colIndex(key);
          if (idx !== -1) updateRow[idx] = member[key];
        }
      }
      console.log("updateRow", updateRow);

      // DateResponded
      const dateIdx = colIndex("DateResponded");
      if (dateIdx !== -1) updateRow[dateIdx] = getCentralTimeDate();

      const filteredValues = updateRow.filter((val) => val !== null);

      // Construct A1-style range for the specific row
      const range = `Main!A${rowNumber}:${String.fromCharCode(65 + headers.length - 1)}${rowNumber}`;
      console.log("range", range);

      valuesToUpdate[range] = {
        values: [updateRow],
      };
      console.log("helo", valuesToUpdate);
    }

    // Batch update request
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

      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetID,
        resource: batchUpdateRequest,
      });
    }

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (e) {
    console.error("Error posting:", e);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
};

export { GET, POST };
