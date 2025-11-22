/**
 * Formats date input automatically adding dots between DD, MM, YYYY
 * @param value - Current input value
 * @returns Formatted value with dots
 */
export function formatDateInput(value: string): string {
  if (!value) return '';
  
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Limit to 8 digits (DDMMYYYY)
  const limited = digits.slice(0, 8);
  
  // Add dots automatically
  if (limited.length === 0) {
    return '';
  } else if (limited.length <= 2) {
    return limited;
  } else if (limited.length <= 4) {
    return `${limited.slice(0, 2)}.${limited.slice(2)}`;
  } else {
    return `${limited.slice(0, 2)}.${limited.slice(2, 4)}.${limited.slice(4)}`;
  }
}