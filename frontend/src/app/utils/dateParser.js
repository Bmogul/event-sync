// utils/dateParser.js
export function parseDateString(dateString) {
  // Remove day of week and any extra whitespace
  const cleanedString = dateString.split(',').slice(0, -1).join(',').trim();
  
  // Split time and date parts
  const [time, dateText] = cleanedString.split(',').map(s => s.trim());
  
  // Parse the date part: "28th November 2024"
  const [day, month, year] = dateText.split(' ');
  
  // Remove ordinal indicators (st, nd, rd, th)
  const cleanDay = day.replace(/(?:st|nd|rd|th)/, '');
  
  // Parse time: "6:30 PM"
  const [hours, minutes] = time.split(':');
  const isPM = time.toLowerCase().includes('pm');
  
  // Convert hours to 24-hour format
  let hour = parseInt(hours);
  if (isPM && hour !== 12) hour += 12;
  if (!isPM && hour === 12) hour = 0;
  
  // Create date object
  const date = new Date(
    parseInt(year),
    getMonthIndex(month),
    parseInt(cleanDay),
    hour,
    parseInt(minutes.split(' ')[0])  // Remove AM/PM if it's in the minutes part
  );
  
  return date;
}

// Helper function to convert month name to month index
function getMonthIndex(monthName) {
  const months = {
    'january': 0,
    'february': 1,
    'march': 2,
    'april': 3,
    'may': 4,
    'june': 5,
    'july': 6,
    'august': 7,
    'september': 8,
    'october': 9,
    'november': 10,
    'december': 11
  };
  return months[monthName.toLowerCase()];
}

// Helper function to calculate days until event
export function getDaysUntilEvent(eventDateString) {
  const eventDate = parseDateString(eventDateString);
  const today = new Date();
  
  // Reset time portions to midnight for accurate day calculation
  today.setHours(0, 0, 0, 0);
  const eventDateMidnight = new Date(eventDate);
  eventDateMidnight.setHours(0, 0, 0, 0);
  
  const diffTime = eventDateMidnight - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
