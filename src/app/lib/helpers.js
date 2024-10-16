const getCentralTimeDate = () => {
  const centralTimeZone = "America/Chicago"; // Central Time Zone
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const centralTimeMs = now.getTime() - offsetMs;
  const centralTime = new Date(centralTimeMs);

  // Get the year, month, and date components
  const year = centralTime.getFullYear();
  const month = String(centralTime.getMonth() + 1).padStart(2, "0");
  const day = String(centralTime.getDate()).padStart(2, "0");

  return `${month}/${day}/${year}`;
};
const authEvent = async (googleSheets, sheetID, password) => {
  try {
    const webdata = await googleSheets.spreadsheets.values.get({
      spreadsheetId: sheetID,
      range: "WebsiteData",
    });
    const eventPassword = webdata.data.values[0][1];
    console.log(eventPassword)
    if (password === eventPassword) return true;
    else return false;
  } catch (error) {
    return false;
  }
};

export {getCentralTimeDate, authEvent}
