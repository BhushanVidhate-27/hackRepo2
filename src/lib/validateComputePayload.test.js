import { describe, expect, it } from "vitest";
import { formatValidationIssues, validateComputePayload } from "./validateComputePayload.js";

describe("validateComputePayload", () => {
  it("accepts a valid payload", () => {
    const res = validateComputePayload({
      layers: [{ thickness: 0.1, k: 0.5 }],
      boundary: { T_left: 30, T_inf: 10, h: 10 },
      area: 1,
      totalThickness: 0.1,
    });
    expect(res.ok).toBe(true);
  });

  it("rejects missing layers", () => {
    const res = validateComputePayload({
      boundary: { T_left: 30, T_inf: 10 },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.field === "layers")).toBe(true);
    }
  });

  it("rejects invalid conductivity", () => {
    const res = validateComputePayload({
      layers: [{ thickness: 0.1, k: -1 }],
      boundary: { T_left: 30, T_inf: 10 },
    });
    expect(res.ok).toBe(false);
  });

  it("formats issues for display", () => {
    const res = validateComputePayload({});
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const text = formatValidationIssues(res.errors);
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
