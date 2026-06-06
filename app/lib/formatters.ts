import Decimal from 'decimal.js';

/**
 * Formats a number or Decimal value into Nigerian Naira (NGN) format.
 * Example: 120000 -> ₦120,000.00
 */
export function formatNaira(amount: number | Decimal | string): string {
  const numericAmount = typeof amount === 'object' && 'toNumber' in amount
    ? amount.toNumber()
    : Number(amount);
  
  if (isNaN(numericAmount)) {
    return '₦0.00';
  }
  
  return `₦${numericAmount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a Date object or string into a readable Nigerian date format.
 * Example: "2026-06-12" -> 12 Jun 2026
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
