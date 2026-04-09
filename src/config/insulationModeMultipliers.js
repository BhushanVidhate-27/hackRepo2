export const INSULATION_MODE_MULTIPLIERS = {
  cold_storage: { label: "Cold storage & freezers", multiplier: 1.2 },
  building_envelope: { label: "Building envelope (walls / roof)", multiplier: 1.05 },
  mechanical_pipes: { label: "Mechanical pipes & equipment", multiplier: 1.1 },
  wires_cables: { label: "Wires & cables (dielectric solids)", multiplier: 0.95 },
  hvac_ducts: { label: "HVAC ducts & air handling", multiplier: 1.0 },
  industrial_hot: { label: "Industrial & high temperature", multiplier: 1.15 },
};

const DEFAULT_MODE_ID = "building_envelope";

export function getModeConfig(modeId) {
  if (modeId && INSULATION_MODE_MULTIPLIERS[modeId]) {
    return {
      modeId,
      ...INSULATION_MODE_MULTIPLIERS[modeId],
    };
  }
  return {
    modeId: DEFAULT_MODE_ID,
    ...INSULATION_MODE_MULTIPLIERS[DEFAULT_MODE_ID],
  };
}

export function listDefaultModeOptions() {
  return Object.entries(INSULATION_MODE_MULTIPLIERS).map(([id, value]) => ({
    id,
    label: value.label,
  }));
}
