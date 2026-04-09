import { describe, expect, it } from "vitest";
import { formatApiError } from "./apiError.js";

describe("formatApiError", () => {
  it("uses details.message when present", () => {
    const err = { details: { message: "Bad input" } };
    expect(formatApiError(err)).toBe("Bad input");
  });

  it("joins details.errors array", () => {
    const err = { details: { errors: [{ message: "a" }, { message: "b" }] } };
    expect(formatApiError(err)).toBe("a; b");
  });
});
