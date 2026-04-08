const STORAGE_KEY = "materialUsageStats";

function safeParseJSON(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getClosestMaterialName(k, materials) {
  if (!Number.isFinite(k) || k <= 0) return null;
  const entries = Object.entries(materials || {}).filter(([, v]) => Number.isFinite(v) && v > 0);
  if (!entries.length) return null;

  let bestName = entries[0][0];
  let bestDelta = Math.abs(entries[0][1] - k);
  for (let i = 1; i < entries.length; i++) {
    const [name, val] = entries[i];
    const d = Math.abs(val - k);
    if (d < bestDelta) {
      bestDelta = d;
      bestName = name;
    }
  }
  return bestName;
}

export function recordMaterialUsageFromParams(params, materials) {
  const layers = params?.layers || [];
  if (!layers.length) return;

  const existing = safeParseJSON(localStorage.getItem(STORAGE_KEY));
  const stats =
    existing && existing.counts
      ? existing
      : { counts: {}, totalK: 0, totalLayers: 0, updatedAt: Date.now() };

  for (const l of layers) {
    const k = Number(l?.k);
    if (!Number.isFinite(k) || k <= 0) continue;
    const name = getClosestMaterialName(k, materials) || "unknown";
    stats.counts[name] = (stats.counts[name] || 0) + 1;
    stats.totalK += k;
    stats.totalLayers += 1;
  }

  stats.updatedAt = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

export function readMaterialUsageStats() {
  const existing = safeParseJSON(localStorage.getItem(STORAGE_KEY));
  const counts = existing?.counts || {};
  const totalLayers = typeof existing?.totalLayers === "number" ? existing.totalLayers : 0;
  const totalK = typeof existing?.totalK === "number" ? existing.totalK : 0;

  const topMaterials = Object.entries(counts)
    .filter(([name, c]) => name && typeof c === "number" && c > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count]) => ({ name, count }));

  return {
    topMaterials,
    averageK: totalLayers > 0 ? totalK / totalLayers : null,
  };
}

