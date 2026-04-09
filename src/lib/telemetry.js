import * as Sentry from "@sentry/browser";

let sentryReady = false;

/**
 * Optional error reporting when VITE_SENTRY_DSN is set at build time.
 */
export function initTelemetry() {
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== "string" || !dsn.trim()) return;

  try {
    Sentry.init({
      dsn: dsn.trim(),
      environment: import.meta.env?.MODE || "development",
      release: `frontend-vanilla@${import.meta.env?.VITE_APP_VERSION || "0.0.1"}`,
      tracesSampleRate: 0,
    });
    sentryReady = true;
  } catch {
    sentryReady = false;
  }
}

/**
 * @param {unknown} error
 * @param {Record<string, unknown>} [context]
 */
export function captureException(error, context) {
  if (!sentryReady) return;
  try {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), {
      extra: context,
    });
  } catch {
    // ignore telemetry failures
  }
}
