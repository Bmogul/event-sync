import { NextResponse } from "next/server";
import { getGoogleSheets, getAuthClient } from "../../../lib/google-sheets";
import { authEvent } from "../../../lib/helpers";

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

