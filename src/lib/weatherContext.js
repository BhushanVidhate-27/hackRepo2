const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCurrentPosition(options = {}) {
  const geolocationTimeoutMs =
    typeof options.geolocationTimeoutMs === "number" ? options.geolocationTimeoutMs : 8000;

  return new Promise((resolve, reject) => {
    if (!navigator?.geolocation) {
      const err = new Error("Geolocation is not supported by this browser.");
      err.code = "GEOLOCATION_UNSUPPORTED";
      reject(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        const err = new Error(error?.message || "Unable to retrieve location.");
        err.code = error?.code === 1 ? "GEOLOCATION_PERMISSION_DENIED" : "GEOLOCATION_ERROR";
        reject(err);
      },
      {
        enableHighAccuracy: false,
        timeout: geolocationTimeoutMs,
        maximumAge: 5 * 60 * 1000,
      }
    );
  });
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const err = new Error(`Weather request failed (${res.status}).`);
      err.code = "WEATHER_FETCH_FAILED";
      throw err;
    }
    return await res.json();
  } catch (e) {
    if (e?.name === "AbortError") {
      const err = new Error("Weather request timed out.");
      err.code = "WEATHER_TIMEOUT";
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeOpenMeteoPayload(payload, latitude, longitude) {
  const current = payload?.current;
  if (!current || typeof current !== "object") {
    const err = new Error("Weather response is missing current conditions.");
    err.code = "WEATHER_INVALID_RESPONSE";
    throw err;
  }

  const temperatureC = Number(current.temperature_2m);
  const weatherCode = Number(current.weather_code);
  const localTimeIso = String(current.time || "");

  if (!Number.isFinite(temperatureC) || !Number.isFinite(weatherCode) || !localTimeIso) {
    const err = new Error("Weather response has invalid current condition values.");
    err.code = "WEATHER_INVALID_RESPONSE";
    throw err;
  }

  return {
    temperatureC: Number(temperatureC.toFixed(2)),
    weatherCode,
    localTimeIso,
    latitude: Number(clamp(latitude, -90, 90).toFixed(5)),
    longitude: Number(clamp(longitude, -180, 180).toFixed(5)),
  };
}

export async function getCurrentWeatherContext(options = {}) {
  const fetchTimeoutMs = typeof options.fetchTimeoutMs === "number" ? options.fetchTimeoutMs : 10000;
  const position = await getCurrentPosition(options);
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    const err = new Error("Location coordinates are invalid.");
    err.code = "GEOLOCATION_INVALID_COORDS";
    throw err;
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code,is_day",
    timezone: "auto",
  });
  const url = `${OPEN_METEO_URL}?${params.toString()}`;
  const payload = await fetchJsonWithTimeout(url, fetchTimeoutMs);
  return normalizeOpenMeteoPayload(payload, latitude, longitude);
}
