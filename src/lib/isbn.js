/**
 * Strip dashes and whitespace, uppercase any trailing X (valid in ISBN-10).
 */
export function normalizeIsbn(value) {
  if (!value) return '';
  return String(value).replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Returns the canonical ISBN if it's a plausible ISBN-10 or ISBN-13,
 * or '' otherwise. Uses length + character checks; doesn't verify checksum.
 */
export function parseIsbn(value) {
  const v = normalizeIsbn(value);
  if (/^\d{13}$/.test(v)) return v;
  if (/^\d{9}[\dX]$/.test(v)) return v;
  return '';
}

/**
 * True if the user's raw search input looks like an ISBN they intend to match
 * exactly (10 or 13 digits after stripping). We deliberately don't accept the
 * `X` form for search detection — keyword searches like "X-Men" would be
 * misclassified.
 */
export function looksLikeIsbnSearch(value) {
  const v = normalizeIsbn(value);
  return /^\d{10}$/.test(v) || /^\d{13}$/.test(v);
}
