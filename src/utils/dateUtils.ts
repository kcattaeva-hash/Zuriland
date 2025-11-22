/**
 * Parses a date string in format DD.MM.YYYY to Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 10) return null;
  
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  
  // JavaScript Date uses 0-based months
  return new Date(year, month - 1, day);
}

/**
 * Converts DD.MM.YYYY string to ISO string
 */
export function convertToISOString(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return new Date().toISOString();
  return date.toISOString();
}

/**
 * Finds the next payment date from array of date strings
 * Returns the closest future date, or the latest past date if all are past
 */
export function findNextPaymentDate(dateStrings: string[]): string | undefined {
  if (dateStrings.length === 0) return undefined;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates
  
  // Parse all dates
  const dates = dateStrings
    .map(str => ({ str, date: parseDate(str) }))
    .filter(item => item.date !== null) as { str: string; date: Date }[];
  
  if (dates.length === 0) return undefined;
  
  // Set parsed dates to midnight for accurate comparison
  dates.forEach(item => {
    item.date.setHours(0, 0, 0, 0);
  });
  
  // Find future dates (including today)
  const futureDates = dates.filter(item => item.date >= today);
  
  if (futureDates.length > 0) {
    // Return closest future date
    futureDates.sort((a, b) => a.date.getTime() - b.date.getTime());
    return futureDates[0].str;
  } else {
    // All dates are in the past, return the latest one
    dates.sort((a, b) => b.date.getTime() - a.date.getTime());
    return dates[0].str;
  }
}
