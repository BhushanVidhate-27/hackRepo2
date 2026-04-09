/**
 * Same physics as backend/services/heatService.js so we can show results
 * when /api/compute is unreachable (dev proxy down, network blip, etc.).
 * Dashboard sends layers with explicit k; material names resolve when k is absent.
 */
export const DEFAULT_MATERIALS = {
  brick: 0.6,
  insulation: 0.04,
  concrete: 1.7,
  wood: 0.12,
  copper: 401,
};

export function computeWallLocal(data, materials = DEFAULT_MATERIALS) {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid input data");
  }
  const layers = data.layers || [];
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new Error("Layers must be a non-empty array");
  }
  const A = typeof data.area === "number" && data.area > 0 ? data.area : 1;
  const boundary = data.boundary || {};
  const T_left = typeof boundary.T_left === "number" ? boundary.T_left : null;
  const T_inf = typeof boundary.T_inf === "number" ? boundary.T_inf : null;
  const h = typeof boundary.h === "number" && boundary.h > 0 ? boundary.h : null;

  if (T_left === null || T_inf === null || h === null) {
    throw new Error("Missing or invalid boundary conditions: T_left, T_inf, h required");
  }

  let totalRes = 0;

  for (const layer of layers) {
    if (typeof layer.thickness !== "number" || layer.thickness <= 0) {
      throw new Error("Invalid layer thickness");
    }
    const k = layer.k ?? materials[layer.material];
    if (typeof k !== "number" || k <= 0) {
      throw new Error(`Invalid thermal conductivity for layer: ${JSON.stringify(layer)}`);
    }
    totalRes += layer.thickness / k;
  }

  totalRes += 1 / (h * A);

  const q = (T_left - T_inf) / totalRes;

  const temps = [];
  let currentTemp = T_left;
  temps.push(currentTemp);

  for (const layer of layers) {
    const k = layer.k ?? materials[layer.material];
    const r = layer.thickness / k;
    const deltaT = q * r;
    currentTemp -= deltaT;
    temps.push(currentTemp);
  }

  return {
    resistance: totalRes,
    heat_flux: q,
    temperatures: temps,
    __computedLocally: true,
  };
}
