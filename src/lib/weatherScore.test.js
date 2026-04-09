import { describe, expect, it } from "vitest";
import { computeWeatherAdjustedScore } from "./weatherScore.js";

describe("computeWeatherAdjustedScore", () => {
  it("computes a score when weather context exists", () => {
    const output = computeWeatherAdjustedScore({
      result: { heat_flux: 40, resistance: 2.5 },
      modeId: "cold_storage",
      weatherContext: {
        temperatureC: 5,
        weatherCode: 1,
        localTimeIso: "2026-04-09T10:30",
        latitude: 12.9,
        longitude: 77.5,
      },
    });

    expect(output.available).toBe(true);
    expect(output.score).toBeTypeOf("number");
    expect(output.score).toBeGreaterThan(0);
    expect(output.mode.modeId).toBe("cold_storage");
    expect(output.weatherContext?.dayPart).toBe("morning");
  });

  it("returns unavailable state when weather context is missing", () => {
    const output = computeWeatherAdjustedScore({
      result: { heat_flux: 50, resistance: 2.0 },
      modeId: "building_envelope",
      weatherContext: null,
    });

    expect(output.available).toBe(false);
    expect(output.score).toBeNull();
    expect(output.reason).toMatch(/unavailable/i);
    expect(output.modeMultiplier).toBeGreaterThan(0);
  });

  it("varies score by insulation mode multiplier", () => {
    const weatherContext = {
      temperatureC: 12,
      weatherCode: 2,
      localTimeIso: "2026-04-09T14:00",
      latitude: 12.9,
      longitude: 77.5,
    };
    const baseResult = { heat_flux: 35, resistance: 3.1 };

    const coldStorage = computeWeatherAdjustedScore({
      result: baseResult,
      modeId: "cold_storage",
      weatherContext,
    });
    const wires = computeWeatherAdjustedScore({
      result: baseResult,
      modeId: "wires_cables",
      weatherContext,
    });

    expect(coldStorage.available).toBe(true);
    expect(wires.available).toBe(true);
    expect(coldStorage.score).toBeGreaterThan(wires.score);
  });
});
