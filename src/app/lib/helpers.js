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

export {getCentralTimeDate}
