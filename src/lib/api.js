function normalizeBaseUrl(base) {
  const trimmed = String(base || "").trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

const API_BASE_URL = (() => {
  const envBase = import.meta?.env?.VITE_API_BASE_URL;
  if (envBase) return normalizeBaseUrl(envBase);

  const isViteDev = Boolean(import.meta?.env?.DEV);
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  if (isViteDev || isLocalhost) return "http://localhost:8080";

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

  return await res.json();
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

