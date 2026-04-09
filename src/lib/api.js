function normalizeBaseUrl(base) {
  const trimmed = String(base || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

// Prefer same-origin `/api` so Vite dev + `vite preview` can proxy to the backend.
// Only use an absolute URL when VITE_API_BASE_URL is set (production behind a real API host).
const API_BASE_URL = (() => {
  const envBase = import.meta?.env?.VITE_API_BASE_URL;
  if (envBase) return normalizeBaseUrl(envBase);
  return "";
})();

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("content-type", "application/json");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    try {
      err.details = await res.json();
    } catch {
      // ignore
    }
    throw err;
  }

  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    const err = new Error("Invalid JSON response from server");
    err.status = res.status;
    throw err;
  }
}

function isRetriableApiError(err) {
  const status = err?.status;
  if (status == null) return true;
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Same as apiFetch but retries immediately on network failures and transient server errors.
 */
export async function apiFetchWithRetry(path, init = {}, options = {}) {
  const retries = typeof options.retries === "number" ? options.retries : 3;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await apiFetch(path, init);
    } catch (e) {
      lastErr = e;
      if (!isRetriableApiError(e) || attempt === retries) throw e;
    }
  }
  throw lastErr;
}

export async function apiFetchBlob(path, init = {}) {
  const headers = new Headers(init.headers);
  if (init.json !== undefined) headers.set("content-type", "application/json");

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    try {
      err.details = await res.json();
    } catch {
      // ignore
    }
    throw err;
  }

  const disposition = res.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);

  return { blob: await res.blob(), filename: match?.[1] };
}

