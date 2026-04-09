/**
 * Predefined insulation materials by application mode.
 * k = thermal conductivity (W/m·K), typical room-temperature values for screening.
 * Density and specific heat are representative bulk values for quick comparison (not certifications).
 */

/**
 * Versioned catalog metadata for audit trails (screening / education — not certified design data).
 * @type {{
 *  schemaVersion: string,
 *  catalogId: string,
 *  catalogVersion: string,
 *  lastReviewed: string,
 *  defaultMaterialProvenance: { sourceRef: string, effectiveAsOf: string, referenceId: string }
 * }}
 */
export const INSULATION_CATALOG_META = {
  schemaVersion: "1.0",
  catalogId: "thermal-app-insulation",
  catalogVersion: "2026.04.09",
  lastReviewed: "2026-04-09",
  defaultMaterialProvenance: {
    sourceRef: "ASHRAE Handbook Fundamentals & typical manufacturer literature (non-certifying screening values)",
    effectiveAsOf: "2026-04-09",
    referenceId: "internal.screening.v1",
  },
};

/** @typedef {{
 *  sourceRef: string,
 *  effectiveAsOf: string,
 *  referenceId?: string
 * }} MaterialProvenance */

/** @typedef {{
 *  id: string,
 *  name: string,
 *  k: number,
 *  densityKgPerM3?: number,
 *  specificHeatJPerKgK?: number,
 *  minServiceTempC?: number,
 *  maxServiceTempC?: number,
 *  notes?: string,
 *  provenance?: MaterialProvenance
 * }} CatalogMaterial */

/** @typedef {{
 *  id: string,
 *  label: string,
 *  description: string,
 *  materials: CatalogMaterial[]
 * }} InsulationMode */

/** @type {InsulationMode[]} */
export const INSULATION_MODES = [
  {
    id: "cold_storage",
    label: "Cold storage & freezers",
    description: "High-performance insulants for refrigerated warehouses, cold rooms, and freezer envelopes.",
    materials: [
      {
        id: "vip",
        name: "Vacuum insulation panel (VIP)",
        k: 0.007,
        densityKgPerM3: 220,
        specificHeatJPerKgK: 1000,
        minServiceTempC: -40,
        maxServiceTempC: 80,
        notes: "Very low k; protect from puncture and edge losses in design.",
        provenance: {
          sourceRef: "Product literature / measured k ranges for VIP cores (illustrative)",
          effectiveAsOf: "2026-04-09",
          referenceId: "vip.screening.example",
        },
      },
      {
        id: "pir_board",
        name: "PIR rigid foam board",
        k: 0.023,
        densityKgPerM3: 32,
        specificHeatJPerKgK: 1500,
        minServiceTempC: -50,
        maxServiceTempC: 120,
        notes: "Common for cold-store panels; good compressive strength.",
      },
      {
        id: "pur_spray",
        name: "Spray polyurethane (closed-cell)",
        k: 0.025,
        densityKgPerM3: 40,
        specificHeatJPerKgK: 1400,
        minServiceTempC: -50,
        maxServiceTempC: 90,
        notes: "Seamless; verify fire and code requirements.",
      },
      {
        id: "xps",
        name: "Extruded polystyrene (XPS)",
        k: 0.033,
        densityKgPerM3: 35,
        specificHeatJPerKgK: 1450,
        minServiceTempC: -50,
        maxServiceTempC: 75,
        notes: "Moisture-resistant; often used below slabs.",
      },
      {
        id: "eps",
        name: "Expanded polystyrene (EPS) high density",
        k: 0.036,
        densityKgPerM3: 25,
        specificHeatJPerKgK: 1500,
        minServiceTempC: -50,
        maxServiceTempC: 70,
        notes: "Economical; lower compressive grades for non-structural fills.",
      },
    ],
  },
  {
    id: "building_envelope",
    label: "Building envelope (walls / roof)",
    description: "Typical fibrous and foam insulations for residential and commercial opaque assemblies.",
    materials: [
      {
        id: "glass_wool",
        name: "Glass wool (batt / roll)",
        k: 0.04,
        densityKgPerM3: 20,
        specificHeatJPerKgK: 840,
        minServiceTempC: -20,
        maxServiceTempC: 230,
        notes: "Frictional fit in stud cavities; control moisture on cold side.",
      },
      {
        id: "rock_wool",
        name: "Rock / stone wool (slope / façade)",
        k: 0.037,
        densityKgPerM3: 100,
        specificHeatJPerKgK: 1030,
        minServiceTempC: -50,
        maxServiceTempC: 750,
        notes: "Non-combustible; common in rainscreen cavities.",
      },
      {
        id: "wood_fiber",
        name: "Wood fiber insulation board",
        k: 0.038,
        densityKgPerM3: 50,
        specificHeatJPerKgK: 2100,
        minServiceTempC: -50,
        maxServiceTempC: 120,
        notes: "Vapor-open exterior insulation option.",
      },
      {
        id: "eps_facade",
        name: "EPS (façade / EIFS)",
        k: 0.035,
        densityKgPerM3: 20,
        specificHeatJPerKgK: 1500,
        minServiceTempC: -50,
        maxServiceTempC: 80,
        notes: "Lightweight; coordinate drainage and attachment.",
      },
      {
        id: "pir_roof",
        name: "PIR roof board",
        k: 0.024,
        densityKgPerM3: 30,
        specificHeatJPerKgK: 1500,
        minServiceTempC: -50,
        maxServiceTempC: 120,
        notes: "High R per inch for low-slope roofs.",
      },
    ],
  },
  {
    id: "mechanical_pipes",
    label: "Mechanical pipes & equipment",
    description: "Insulations for HVAC and process piping—shells, wraps, and rigid covers.",
    materials: [
      {
        id: "nitrile_foam",
        name: "Closed-cell elastomeric foam (nitrile)",
        k: 0.036,
        densityKgPerM3: 60,
        specificHeatJPerKgK: 1400,
        minServiceTempC: -50,
        maxServiceTempC: 105,
        notes: "Flexible; common on chilled-water lines indoors.",
      },
      {
        id: "mineral_wool_pipe",
        name: "Mineral wool pipe section",
        k: 0.04,
        densityKgPerM3: 120,
        specificHeatJPerKgK: 1030,
        minServiceTempC: 0,
        maxServiceTempC: 650,
        notes: "For higher temperatures; jacket for weather barrier.",
      },
      {
        id: "cellular_glass",
        name: "Cellular glass",
        k: 0.045,
        densityKgPerM3: 130,
        specificHeatJPerKgK: 1000,
        minServiceTempC: -260,
        maxServiceTempC: 430,
        notes: "Vapor-impermeable; cryogenic to hot process.",
      },
      {
        id: "phenolic_pipe",
        name: "Phenolic foam pipe insulation",
        k: 0.023,
        densityKgPerM3: 50,
        specificHeatJPerKgK: 1400,
        minServiceTempC: -50,
        maxServiceTempC: 120,
        notes: "Low k; verify compatibility with adhesives and jackets.",
      },
      {
        id: "calcium_silicate",
        name: "Calcium silicate (rigid)",
        k: 0.065,
        densityKgPerM3: 220,
        specificHeatJPerKgK: 1000,
        minServiceTempC: 40,
        maxServiceTempC: 650,
        notes: "Higher-temp steam and process piping.",
      },
    ],
  },
  {
    id: "wires_cables",
    label: "Wires & cables (dielectric solids)",
    description: "Representative thermal conductivities of common cable insulation polymers (heat-spreading estimates).",
    materials: [
      {
        id: "pvc",
        name: "PVC (thermoplastic)",
        k: 0.16,
        densityKgPerM3: 1400,
        specificHeatJPerKgK: 900,
        minServiceTempC: -40,
        maxServiceTempC: 70,
        notes: "General wiring; thermal runaway not modeled here.",
      },
      {
        id: "xlpe",
        name: "XLPE (cross-linked polyethylene)",
        k: 0.29,
        densityKgPerM3: 940,
        specificHeatJPerKgK: 2200,
        minServiceTempC: -50,
        maxServiceTempC: 90,
        notes: "Typical MV power cables.",
      },
      {
        id: "epr",
        name: "EPR rubber",
        k: 0.25,
        densityKgPerM3: 1150,
        specificHeatJPerKgK: 2000,
        minServiceTempC: -50,
        maxServiceTempC: 90,
        notes: "Flexible medium-voltage insulation.",
      },
      {
        id: "silicone",
        name: "Silicone rubber",
        k: 0.25,
        densityKgPerM3: 1200,
        specificHeatJPerKgK: 1000,
        minServiceTempC: -60,
        maxServiceTempC: 200,
        notes: "High-temperature flex leads and appliance wiring.",
      },
      {
        id: "pe",
        name: "Polyethylene (PE)",
        k: 0.42,
        densityKgPerM3: 950,
        specificHeatJPerKgK: 2200,
        minServiceTempC: -50,
        maxServiceTempC: 75,
        notes: "LV communications and power.",
      },
    ],
  },
  {
    id: "hvac_ducts",
    label: "HVAC ducts & air handling",
    description: "Liners and wraps for sheet-metal ducts and plenums.",
    materials: [
      {
        id: "fiberglass_duct_liner",
        name: "Fiberglass duct liner (faced)",
        k: 0.043,
        densityKgPerM3: 32,
        specificHeatJPerKgK: 840,
        minServiceTempC: 0,
        maxServiceTempC: 120,
        notes: "Acoustic and thermal; maintain facing integrity.",
      },
      {
        id: "pe_foam_wrap",
        name: "Polyethylene foam duct wrap",
        k: 0.035,
        densityKgPerM3: 35,
        specificHeatJPerKgK: 1800,
        minServiceTempC: -30,
        maxServiceTempC: 85,
        notes: "Flexible exterior wrap on round ducts.",
      },
      {
        id: "phenolic_duct",
        name: "Phenolic foam board (duct external)",
        k: 0.023,
        densityKgPerM3: 45,
        specificHeatJPerKgK: 1400,
        minServiceTempC: -50,
        maxServiceTempC: 120,
        notes: "Low k external insulation on large ducts.",
      },
      {
        id: "flex_fiberglass",
        name: "Flexible fiberglass blanket (foil-scrim)",
        k: 0.045,
        densityKgPerM3: 25,
        specificHeatJPerKgK: 840,
        minServiceTempC: -20,
        maxServiceTempC: 250,
        notes: "Wrap on rectangular ducts; radiant facing helps.",
      },
    ],
  },
  {
    id: "industrial_hot",
    label: "Industrial & high temperature",
    description: "Insulations for boilers, stacks, and hot equipment where service temperature dominates selection.",
    materials: [
      {
        id: "ceramic_fiber",
        name: "Ceramic fiber blanket",
        k: 0.143,
        densityKgPerM3: 128,
        specificHeatJPerKgK: 1000,
        minServiceTempC: 0,
        maxServiceTempC: 1260,
        notes: "Lightweight; compressive loads need hardware.",
      },
      {
        id: "rock_wool_ht",
        name: "Rock wool (high-temp mat)",
        k: 0.045,
        densityKgPerM3: 150,
        specificHeatJPerKgK: 1030,
        minServiceTempC: 0,
        maxServiceTempC: 750,
        notes: "Rigid or semi-rigid mats for equipment.",
      },
      {
        id: "calcium_silicate_ht",
        name: "Calcium silicate block",
        k: 0.065,
        densityKgPerM3: 220,
        specificHeatJPerKgK: 1000,
        minServiceTempC: 40,
        maxServiceTempC: 650,
        notes: "Load-bearing pipe support blocks.",
      },
      {
        id: "perlite_block",
        name: "Expanded perlite block",
        k: 0.055,
        densityKgPerM3: 200,
        specificHeatJPerKgK: 1000,
        minServiceTempC: -200,
        maxServiceTempC: 650,
        notes: "Hydrophobic types for outdoor hot piping.",
      },
    ],
  },
];

const MODE_BY_ID = new Map(INSULATION_MODES.map((m) => [m.id, m]));

export function getInsulationMode(modeId) {
  return MODE_BY_ID.get(modeId) || INSULATION_MODES[0];
}

export function getDefaultInsulationModeId() {
  return INSULATION_MODES[0].id;
}

/**
 * Pick the lowest-k material in the mode (planar 1D screening assumption).
 * @param {string} modeId
 * @returns {{ material: CatalogMaterial, mode: InsulationMode }}
 */
export function pickLowestConductivityMaterial(modeId) {
  const mode = getInsulationMode(modeId);
  const materials = mode.materials || [];
  if (!materials.length) {
    throw new Error("No materials defined for this mode.");
  }
  const material = materials.reduce((best, cur) => (cur.k < best.k ? cur : best), materials[0]);
  return { material, mode };
}

/**
 * Resolved provenance for UI (defaults from INSULATION_CATALOG_META when a row omits overrides).
 * @param {CatalogMaterial} mat
 * @returns {MaterialProvenance & { sourceRef: string, effectiveAsOf: string }}
 */
export function getMaterialProvenance(mat) {
  const def = INSULATION_CATALOG_META.defaultMaterialProvenance;
  const p = mat?.provenance;
  return {
    sourceRef: typeof p?.sourceRef === "string" && p.sourceRef.trim() ? p.sourceRef.trim() : def.sourceRef,
    effectiveAsOf:
      typeof p?.effectiveAsOf === "string" && p.effectiveAsOf.trim() ? p.effectiveAsOf.trim() : def.effectiveAsOf,
    referenceId:
      typeof p?.referenceId === "string" && p.referenceId.trim()
        ? p.referenceId.trim()
        : def.referenceId,
  };
}
