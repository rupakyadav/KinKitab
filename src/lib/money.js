/**
 * Single source of truth for currency formatting across the app.
 * Swap CURRENCY_SYMBOL / LOCALE here to localize.
 */
export const CURRENCY_SYMBOL = '₹';
const LOCALE = 'en-IN';

export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${CURRENCY_SYMBOL}0`;
  return `${CURRENCY_SYMBOL}${n.toLocaleString(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
