import { getModeConfig } from "../config/insulationModeMultipliers.js";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getDayPartFactor(localTimeIso) {
  const hour = new Date(localTimeIso).getHours();
  if (!Number.isFinite(hour)) return { dayPart: "unknown", factor: 1 };
  if (hour < 6) return { dayPart: "night", factor: 0.95 };
  if (hour < 12) return { dayPart: "morning", factor: 1.0 };
  if (hour < 18) return { dayPart: "day", factor: 1.05 };
  return { dayPart: "evening", factor: 1.0 };
}

function getTemperatureSeverityFactor(temperatureC) {
  const comfortReferenceC = 21;
  const delta = Math.abs(Number(temperatureC) - comfortReferenceC);
  const normalized = clamp(delta / 30, 0, 1);
  return 1 + normalized * 0.2;
}

function buildBaseScore(heatFlux, resistance) {
  const fluxComponent = 1 - clamp(Number(heatFlux) / 200, 0, 1);
  const resistanceComponent = clamp(Number(resistance) / 5, 0, 1);
  return (resistanceComponent * 0.6 + fluxComponent * 0.4) * 100;
}

export function computeWeatherAdjustedScore({ result, modeId, weatherContext }) {
  const heatFlux = Number(result?.heat_flux);
  const resistance = Number(result?.resistance);
  const baseScore = Number(buildBaseScore(heatFlux, resistance).toFixed(2));
  const mode = getModeConfig(modeId);

  if (!weatherContext || typeof weatherContext !== "object") {
    return {
      available: false,
      score: null,
      baseScore,
      modeMultiplier: mode.multiplier,
      weatherTimeFactor: null,
      reason: "Weather or location data unavailable.",
      weatherContext: null,
      mode,
    };
  }

  const temperatureC = Number(weatherContext.temperatureC);
  const localTimeIso = String(weatherContext.localTimeIso || "");
  if (!Number.isFinite(temperatureC) || !localTimeIso) {
    return {
      available: false,
      score: null,
      baseScore,
      modeMultiplier: mode.multiplier,
      weatherTimeFactor: null,
      reason: "Weather payload is invalid.",
      weatherContext: null,
      mode,
    };
  }

  const dayPart = getDayPartFactor(localTimeIso);
  const weatherTimeFactor = Number((getTemperatureSeverityFactor(temperatureC) * dayPart.factor).toFixed(4));
  const score = Number(clamp(baseScore * mode.multiplier * weatherTimeFactor, 0, 200).toFixed(2));

  return {
    available: true,
    score,
    baseScore,
    modeMultiplier: mode.multiplier,
    weatherTimeFactor,
    reason: null,
    weatherContext: {
      ...weatherContext,
      dayPart: dayPart.dayPart,
    },
    mode,
  };
}
