const materials = require("../config/materials.config.js");

const computeWallService = (data) => {
  // Input validation
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid input data');
  }
  const layers = data.layers || [];
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new Error('Layers must be a non-empty array');
  }
  const A = typeof data.area === 'number' && data.area > 0 ? data.area : 1;
  const boundary = data.boundary || {};
  const T_left = typeof boundary.T_left === 'number' ? boundary.T_left : null;
  const T_inf = typeof boundary.T_inf === 'number' ? boundary.T_inf : null;
  const h = typeof boundary.h === 'number' && boundary.h > 0 ? boundary.h : null;
  
  if (T_left === null || T_inf === null || h === null) {
    throw new Error('Missing or invalid boundary conditions: T_left, T_inf, h required');
  }

  let totalRes = 0;

  // conduction resistance
  for (let layer of layers) {
    if (typeof layer.thickness !== 'number' || layer.thickness <= 0) {
      throw new Error('Invalid layer thickness');
    }
    let k = layer.k || materials[layer.material];
    if (typeof k !== 'number' || k <= 0) {
      throw new Error(`Invalid thermal conductivity for layer: ${JSON.stringify(layer)}`);
    }
    let r = layer.thickness / k;
    totalRes += r;
  }

  // convection resistance
  totalRes += 1 / (h * A);

  // heat flux
  let q = (T_left - T_inf) / totalRes;

  // temperature distribution
  let temps = [];
  let currentTemp = T_left;
  temps.push(currentTemp);

  for (let layer of layers) {
    let k = layer.k || materials[layer.material];
    let r = layer.thickness / k;
    let deltaT = q * r;
    currentTemp -= deltaT;
    temps.push(currentTemp);
  }

  return {
    resistance: totalRes,
    heat_flux: q,
    temperatures: temps,
  };
};

module.exports = { computeWallService };
