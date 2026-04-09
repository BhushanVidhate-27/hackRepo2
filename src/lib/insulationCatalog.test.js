import { describe, expect, it } from "vitest";
import { getMaterialProvenance, INSULATION_CATALOG_META } from "./insulationCatalog.js";

describe("insulationCatalog", () => {
  it("exposes catalog meta", () => {
    expect(INSULATION_CATALOG_META.catalogId).toBeTruthy();
    expect(INSULATION_CATALOG_META.schemaVersion).toBeTruthy();
  });

  it("resolves default provenance", () => {
    const p = getMaterialProvenance({ name: "x", id: "t", k: 1 });
    expect(p.sourceRef).toContain("ASHRAE");
    expect(p.effectiveAsOf).toBeTruthy();
  });
});
