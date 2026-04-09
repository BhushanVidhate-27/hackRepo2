/**
 * Optional multi-tenant header for upstream APIs (set VITE_TENANT_ID in deployment env).
 * @returns {Record<string, string>}
 */
export function getOptionalTenantHeaders() {
  const raw = import.meta.env?.VITE_TENANT_ID;
  if (typeof raw === "string" && raw.trim()) {
    return { "X-Tenant-Id": raw.trim() };
  }
  return {};
}
