/**
 * Normalize backend error payloads into a single user-facing string.
 * Supports `{ code, message, field, errors: [...] }` style bodies.
 * @param {unknown} err
 * @returns {string}
 */
export function formatApiError(err) {
  if (!err || typeof err !== "object") return "Request failed";
  const e = err;
  const details = "details" in e ? e.details : undefined;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const d = details;
    if (typeof d.message === "string" && d.message.trim()) return d.message.trim();
    if (typeof d.error === "string" && d.error.trim()) return d.error.trim();
    if (Array.isArray(d.errors)) {
      const parts = d.errors.map((x) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "message" in x && typeof x.message === "string") return x.message;
        return String(x);
      });
      if (parts.length) return parts.join("; ");
    }
  }
  if ("message" in e && typeof e.message === "string" && e.message.trim()) return e.message.trim();
  return "Request failed";
}
