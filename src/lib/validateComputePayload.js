/**
 * Client-side validation for POST /api/compute payloads (1D planar thermal model).
 * Mirrors server expectations so failures are fast and user-visible before network.
 */

/**
 * @typedef {{ field: string, message: string }} ValidationIssue
 */

/**
 * @param {unknown} payload
 * @returns {{ ok: true } | { ok: false, errors: ValidationIssue[] }}
 */
export function validateComputePayload(payload) {
  /** @type {ValidationIssue[]} */
  const errors = [];

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, errors: [{ field: "", message: "Payload must be a JSON object." }] };
  }

  const layers = payload.layers;
  if (!Array.isArray(layers) || layers.length === 0) {
    errors.push({ field: "layers", message: "At least one layer is required." });
  } else {
    layers.forEach((layer, i) => {
      if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
        errors.push({ field: `layers[${i}]`, message: "Each layer must be an object." });
        return;
      }
      const t = layer.thickness;
      const k = layer.k;
      if (!Number.isFinite(t) || t <= 0) {
        errors.push({
          field: `layers[${i}].thickness`,
          message: "Must be a positive finite thickness in meters.",
        });
      }
      if (!Number.isFinite(k) || k <= 0) {
        errors.push({
          field: `layers[${i}].k`,
          message: "Must be a positive finite thermal conductivity (W/m·K).",
        });
      }
    });
  }

  const boundary = payload.boundary;
  if (!boundary || typeof boundary !== "object" || Array.isArray(boundary)) {
    errors.push({ field: "boundary", message: "boundary object is required." });
  } else {
    if (!Number.isFinite(boundary.T_left)) {
      errors.push({ field: "boundary.T_left", message: "Must be a finite number (°C)." });
    }
    if (!Number.isFinite(boundary.T_inf)) {
      errors.push({ field: "boundary.T_inf", message: "Must be a finite number (°C)." });
    }
    if (boundary.h !== undefined && (!Number.isFinite(boundary.h) || boundary.h < 0)) {
      errors.push({ field: "boundary.h", message: "When set, h must be a non-negative finite convection coefficient." });
    }
  }

  if (payload.area !== undefined && (!Number.isFinite(payload.area) || payload.area <= 0)) {
    errors.push({ field: "area", message: "When set, area must be a positive finite number." });
  }

  if (
    payload.totalThickness !== undefined &&
    (!Number.isFinite(payload.totalThickness) || payload.totalThickness <= 0)
  ) {
    errors.push({
      field: "totalThickness",
      message: "When set, totalThickness must be a positive finite number (meters).",
    });
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

/**
 * @param {ValidationIssue[]} errors
 */
export function formatValidationIssues(errors) {
  return errors.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message)).join(" ");
}
