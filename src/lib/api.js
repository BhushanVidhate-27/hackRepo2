import { formatApiError } from "./apiError.js";
import { newRequestId } from "./requestId.js";
import { getOptionalTenantHeaders } from "./tenantContext.js";

function normalizeBaseUrl(base) {
  const trimmed = String(base || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function resolveApiBaseUrl() {
  const envBase = import.meta?.env?.VITE_API_BASE_URL;
  if (envBase) return normalizeBaseUrl(envBase);

  const isViteDev = Boolean(import.meta?.env?.DEV);
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (isViteDev || isLocalhost) return "http://localhost:8080";

  return "";
}

/** Exposed for health checks and startup logging. */
export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

/**
 * Warn in production when the SPA is deployed without VITE_API_BASE_URL on a non-localhost host.
 * @returns {boolean} true when configured or localhost/dev
 */
export function assertApiConfigured() {
  const base = resolveApiBaseUrl();
  const isProd = Boolean(import.meta.env?.PROD);
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (isProd && !base && !isLocal) {
    console.error(
      "[thermal-app] VITE_API_BASE_URL is not set. Configure it at build time for this deployment host."
    );
    return false;
  }
  return true;
}

function ensureCanCallApi() {
  const base = resolveApiBaseUrl();
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const isDev = Boolean(import.meta.env?.DEV);
  if (!base && !isLocal && !isDev) {
    const err = new Error("API is not configured for this host. Set VITE_API_BASE_URL at build time.");
    err.code = "API_NOT_CONFIGURED";
    throw err;
  }
}

function applyCommonHeaders(headers) {
  const rid = newRequestId();
  headers.set("X-Request-Id", rid);
  headers.set("X-API-Client-Version", "1");
  headers.set("X-Client-Release", import.meta.env?.VITE_APP_VERSION || "0.0.1");
  Object.entries(getOptionalTenantHeaders()).forEach(([k, v]) => headers.set(k, v));
  return rid;
}

export async function apiFetch(path, init = {}) {
  ensureCanCallApi();

  const base = resolveApiBaseUrl();
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("content-type", "application/json");

  const requestId = applyCommonHeaders(headers);

  const url = `${base}${path}`;
  if (import.meta.env?.DEV) {
    console.debug("[api]", (init.method || "GET").toUpperCase(), path, requestId);
  }

  const res = await fetch(url, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.requestId = res.headers.get("X-Request-Id") || requestId;
    try {
      err.details = await res.json();
      const d = err.details;
      if (d && typeof d === "object" && typeof d.code === "string") err.code = d.code;
    } catch {
      try {
        err.details = { message: await res.text() };
      } catch {
        // ignore
      }
    }
    err.message = formatApiError(err);
    throw err;
  }

  return await res.json();
}

export async function apiFetchBlob(path, init = {}) {
  ensureCanCallApi();

  const base = resolveApiBaseUrl();
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("content-type", "application/json");

  const requestId = applyCommonHeaders(headers);

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.requestId = res.headers.get("X-Request-Id") || requestId;
    try {
      err.details = await res.json();
      const d = err.details;
      if (d && typeof d === "object" && typeof d.code === "string") err.code = d.code;
    } catch {
      // ignore
    }
    err.message = formatApiError(err);
    throw err;
  }

  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);

  return { blob: await res.blob(), filename: match?.[1] };
}
