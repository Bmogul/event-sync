import { NextResponse } from "next/server";
import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";
import { authEvent } from "../../../lib/helpers";

export const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const password = searchParams.get("password");
  const sheetID = searchParams.get("sheetID");
  const sheets = await getGoogleSheets()

  if (!password || !sheetID) {
    console.log("INVALiD DARA FORMAT");
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  try {
    if (authEvent(sheets, sheetID, password)) {
      let allUsers = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetID,
        range: "Main",
      });

      allUsers = allUsers.data.values;
      const keys = allUsers.shift();
      const selectedKeys = [
        keys[0],
        keys[1],
        keys[3],
        keys[4],
        keys[5],
        keys[7],
        keys[9],
        keys[12],
      ];
      const selectedIndexes = [0, 1,3, 4, 5,7, 9, 12];

      allUsers = allUsers.map((user) => {
        return selectedKeys.reduce((obj, key, index) => {
          obj[key] = user[selectedIndexes[index]];
          return obj;
        }, {});
      });

      return NextResponse.json({ validated: true, allUsers }, { status: 200 })
    } else return NextResponse.json({ validated: false }, { status: 200 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ message: error }, { status: 500 })
  }
}


// TODO: update sheet
export const POST = async (req) => {
  const { password, event } = await req.json();
  const sheetID = event.sheetID;
  const sheets = await getGoogleSheets();

  if (!password || !event || event.length === 0) {
    console.log("INVALUD DARA FORMAT");
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }
  try {
    if (authEvent(sheets, sheetID, password))
      return NextResponse.json({ validated: true }, { status: 200 });
    else return NextResponse.json({ validated: false }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 500 });
  }
};

