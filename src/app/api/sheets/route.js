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

const GET = async (req) => {
  const { searchParams } = new URL(req.url);
  const guid = searchParams.get("guid");

  if (!guid || guid === "null")
    return NextResponse.json({ message: "Missing guid" }, { status: 400 });

  return NextResponse.json({ message: "Test" }, { status: 200 })

  

  console.log(process.env.GOOGLE_SHEET_ID, '/n/n/n');
}

const POST = async () => {

}

export { GET, POST }
