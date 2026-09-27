/**
 * Shared free-text checks for user posts (Housing, Marketplace).
 * These catch common mistakes in the browser. The backend must repeat them (BACKEND_HANDOFF).
 */

/** Phone numbers like 510-555-0101, (510) 555 0101, +1 510.555.0101 */
export const PHONE_PATTERN = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
export const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.]+/;
/** "123 Main St" style street addresses. */
export const STREET_PATTERN = /\b\d{2,6}\s+[A-Za-z0-9.' ]{2,30}\s(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ct|court|ln|lane|way|pl|place)\b/i;

export function hasContactInfo(text: string): boolean {
  return PHONE_PATTERN.test(text) || EMAIL_PATTERN.test(text);
}

export function hasStreetAddress(text: string): boolean {
  return STREET_PATTERN.test(text);
}
