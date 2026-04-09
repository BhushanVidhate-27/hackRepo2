/**
 * Generate a request correlation id for API calls (UUID v4 when crypto.randomUUID exists).
 * @returns {string}
 */
export function newRequestId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
