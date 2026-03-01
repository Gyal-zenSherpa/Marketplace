/**
 * Format a number using Nepali numbering system (e.g., 1,00,000 for one lakh).
 * Returns formatted string with "Rs." prefix.
 */
export function formatNepaliPrice(price: number): string {
  return `Rs. ${formatNepaliNumber(price)}`;
}

/**
 * Format a number using Nepali/Indian numbering system.
 * e.g., 100000 → "1,00,000", 1234.50 → "1,234.50"
 */
export function formatNepaliNumber(num: number): string {
  const [intPart, decPart] = num.toFixed(2).split(".");
  const formatted = addNepaliCommas(intPart);
  return `${formatted}.${decPart}`;
}

function addNepaliCommas(intStr: string): string {
  // Handle negative numbers
  const isNegative = intStr.startsWith("-");
  const digits = isNegative ? intStr.slice(1) : intStr;

  if (digits.length <= 3) return intStr;

  // Last 3 digits get a comma, then every 2 digits
  const last3 = digits.slice(-3);
  let remaining = digits.slice(0, -3);
  const groups: string[] = [];

  while (remaining.length > 2) {
    groups.unshift(remaining.slice(-2));
    remaining = remaining.slice(0, -2);
  }
  if (remaining.length > 0) groups.unshift(remaining);

  return (isNegative ? "-" : "") + groups.join(",") + "," + last3;
}
