import { apiFetch, apiFetchWithRetry } from "../lib/api.js";
import { computeWallLocal, DEFAULT_MATERIALS } from "../lib/localHeatCompute.js";
import { buttonClass } from "../lib/uiPrimitives.js";
import { readMaterialUsageStats } from "../lib/materialUsage.js";
import { navigate } from "../router.js";

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildTempProfile(params, result) {
  const layers = params?.layers || [];
  const temps = result?.temperatures || [];
  const totalThicknessM =
    typeof params?.totalThickness === "number"
      ? params.totalThickness
      : layers.reduce((s, l) => s + (l?.thickness || 0), 0);

  const points = 60;
  const data = [];
  if (!layers.length || temps.length !== layers.length + 1 || totalThicknessM <= 0) return data;

  const cumulative = [0];
  for (const l of layers) cumulative.push(cumulative[cumulative.length - 1] + l.thickness);

  for (let i = 0; i <= points; i++) {
    const xM = (i / points) * totalThicknessM;
    let layerIdx = 0;
    while (layerIdx < layers.length - 1 && xM > cumulative[layerIdx + 1]) layerIdx++;

    const x0 = cumulative[layerIdx];
    const x1 = cumulative[layerIdx + 1];
    const t0 = temps[layerIdx];
    const t1 = temps[layerIdx + 1];
    const frac = x1 > x0 ? (xM - x0) / (x1 - x0) : 0;
    const temp = t0 + (t1 - t0) * Math.min(1, Math.max(0, frac));

    data.push({
      position: Number((xM * 100).toFixed(1)),
      value: Number(Number(temp).toFixed(2)),
    });
  }

  return data;
}

function isValidComputeShape(result, layerCount) {
  if (!result || typeof result !== "object") return false;
  if (typeof result.heat_flux !== "number" || typeof result.resistance !== "number") return false;
  if (!Array.isArray(result.temperatures)) return false;
  return result.temperatures.length === layerCount + 1;
}

function stripLocalMeta(result) {
  if (!result || typeof result !== "object") return result;
  const { __computedLocally: _c, ...rest } = result;
  return rest;
}

function renderHeader() {
  return `
    <div class="mb-8">
      <h1 class="text-3xl text-[#0A2540] mb-2">Configuration Comparison</h1>
      <p class="text-gray-600">Compare different material setups side-by-side to find the optimal solution</p>
    </div>
  `;
}

export function renderComparisonScreen() {
  const usage = readMaterialUsageStats();

  return {
    title: "Configuration Comparison",
    html: `
      <div class="min-h-screen bg-[#F8F9FB] py-8">
        <div class="max-w-[1440px] mx-auto px-8">
          ${renderHeader()}
          <div id="compareRoot"></div>
        </div>
      </div>
    `,
    async afterRender() {
      const root = document.getElementById("compareRoot");
      if (!root) return;

      let currentParams = safeParse(sessionStorage.getItem("simulationParams"));
      let currentResult = safeParse(sessionStorage.getItem("simulationResult"));

      if (!currentParams || !currentResult) {
        root.innerHTML = `
          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
            <div class="text-lg text-[#0A2540] mb-2">No current simulation data</div>
            <div class="text-sm text-gray-600">Run a simulation first to compare configurations.</div>
          </div>
        `;
        return;
      }

      root.innerHTML = `
        <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
          <div class="text-lg text-[#0A2540] mb-2">Computing ideal configuration…</div>
          <div class="text-sm text-gray-600">Fetching materials and running the backend solver.</div>
        </div>
      `;

      try {
        let materials = {};
        try {
          materials = (await apiFetch("/api/materials")) || {};
        } catch {
          materials = {};
        }
        if (!Object.keys(materials).length) materials = { ...DEFAULT_MATERIALS };

        let entries = Object.entries(materials || {}).filter(([, v]) => typeof v === "number" && v > 0);
        if (!entries.length) throw new Error("No materials available in backend materials config.");

        const [bestName, bestK] = entries.reduce((best, cur) => (cur[1] < best[1] ? cur : best), entries[0]);

        const layers = currentParams.layers || [];
        const layerCount = layers.length;
        if (!isValidComputeShape(currentResult, layerCount)) {
          currentResult = stripLocalMeta(computeWallLocal(currentParams, materials));
        } else {
          currentResult = stripLocalMeta(currentResult);
        }

        const insulationIndex = layers.length >= 2 ? 1 : 0;
        const idealParams = {
          ...currentParams,
          layers: layers.map((l, idx) => (idx === insulationIndex ? { ...l, k: bestK, material: bestName } : l)),
        };

        const idealLayerCount = (idealParams.layers || []).length;
        let idealResult = null;
        try {
          idealResult = await apiFetchWithRetry("/api/compute", { method: "POST", json: idealParams });
        } catch {
          idealResult = null;
        }
        if (!isValidComputeShape(idealResult, idealLayerCount)) {
          idealResult = stripLocalMeta(computeWallLocal(idealParams, materials));
        } else {
          idealResult = stripLocalMeta(idealResult);
        }

        const aFlux = currentResult.heat_flux;
        const bFlux = idealResult.heat_flux;
        const fluxReductionPct = aFlux !== 0 ? ((aFlux - bFlux) / aFlux) * 100 : null;

        const aR = currentResult.resistance;
        const bR = idealResult.resistance;
        const rIncreasePct = aR !== 0 ? ((bR - aR) / aR) * 100 : null;

        const profileA = buildTempProfile(currentParams, currentResult);
        const profileB = buildTempProfile(idealParams, idealResult);
        const chart = profileA.map((p, idx) => ({
          position: p.position,
          configA: p.value,
          configB: profileB[idx]?.value ?? p.value,
        }));

        root.innerHTML = `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
              <div class="flex items-center gap-2 mb-4">
                <i data-lucide="star" class="w-5 h-5 text-[#3A86FF]"></i>
                <h2 class="text-lg text-[#0A2540]">Best Material Recommendation</h2>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <div class="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0A2540]">
                  <span class="font-semibold">${bestName}</span>
                </div>
                <div class="text-sm text-gray-600">
                  Suggested for insulation layer (lowest k):
                  <span class="font-semibold text-gray-800">${Number(bestK).toFixed(4)} W/m·K</span>
                </div>
              </div>
            </div>

            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
              <div class="flex items-center gap-2 mb-4">
                <i data-lucide="trending-up" class="w-5 h-5 text-green-600"></i>
                <h2 class="text-lg text-[#0A2540]">Popular / Average Used</h2>
              </div>
              <div class="flex flex-wrap gap-2 mb-3">
                ${
                  usage.topMaterials.length
                    ? usage.topMaterials
                        .map(
                          (m) => `
                            <div class="px-3 py-1 rounded-full bg-white border border-gray-200 text-sm text-gray-700">
                              ${m.name} <span class="text-gray-500">(${m.count})</span>
                            </div>
                          `
                        )
                        .join("")
                    : `<div class="text-sm text-gray-600">Run a few simulations to see popular materials here.</div>`
                }
              </div>
              <div class="text-sm text-gray-600">
                Average layer k across your runs:
                <span class="font-semibold text-gray-800">${
                  usage.averageK === null ? "—" : `${usage.averageK.toFixed(4)} W/m·K`
                }</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-2 border-blue-200 bg-blue-50">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl text-[#0A2540]">Configuration A (Current)</h2>
                <div class="px-3 py-1 bg-blue-600 text-white text-sm rounded-full">Current</div>
              </div>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-white rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Heat Flux</div>
                    <div class="text-2xl text-[#0A2540]">${aFlux.toFixed(2)} W/m²</div>
                  </div>
                  <div class="p-4 bg-white rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Resistance</div>
                    <div class="text-2xl text-[#0A2540]">${aR.toFixed(3)}</div>
                  </div>
                </div>
                <div class="p-4 bg-white rounded-lg">
                  <div class="text-sm text-gray-600 mb-1">Material</div>
                  <div class="text-3xl text-[#0A2540]">Current</div>
                </div>
              </div>
            </div>

            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-2 border-green-200 bg-green-50">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl text-[#0A2540]">Configuration B (Recommended layer)</h2>
                <div class="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                  <i data-lucide="award" class="w-3 h-3"></i> Optimized
                </div>
              </div>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-white rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Heat Flux</div>
                    <div class="text-2xl text-green-600">${bFlux.toFixed(2)} W/m²</div>
                    ${fluxReductionPct === null ? "" : `<div class="text-sm text-green-600 mt-1">↓ ${fluxReductionPct.toFixed(
                      1
                    )}% better</div>`}
                  </div>
                  <div class="p-4 bg-white rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Resistance</div>
                    <div class="text-2xl text-green-600">${bR.toFixed(3)}</div>
                    ${rIncreasePct === null ? "" : `<div class="text-sm text-green-600 mt-1">↑ ${rIncreasePct.toFixed(
                      1
                    )}% better</div>`}
                  </div>
                </div>
                <div class="p-4 bg-white rounded-lg">
                  <div class="text-sm text-gray-600 mb-1">Ideal Material</div>
                  <div class="text-3xl text-green-600">${bestName}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 border-gray-200">
            <h2 class="text-xl text-[#0A2540] mb-6">Temperature Profile Comparison</h2>
            <div class="w-full">
              <canvas id="compareChart" height="140"></canvas>
            </div>
          </div>

          <div class="mt-8 bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 border-gray-200">
            <h2 class="text-xl text-[#0A2540] mb-6">Key Insights</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="p-6 bg-green-50 rounded-lg border border-green-200">
                <div class="text-3xl text-green-600 mb-2">${fluxReductionPct === null ? "—" : `${fluxReductionPct.toFixed(
                  0
                )}%`}</div>
                <div class="text-sm text-gray-700 mb-2">Heat Flux Reduction</div>
                <div class="text-xs text-gray-600">
                  Configuration B reduces heat flux from ${aFlux.toFixed(2)} to ${bFlux.toFixed(2)} W/m²
                </div>
              </div>
              <div class="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <div class="text-3xl text-blue-600 mb-2">${rIncreasePct === null ? "—" : `${rIncreasePct.toFixed(
                  0
                )}%`}</div>
                <div class="text-sm text-gray-700 mb-2">Resistance Improvement</div>
                <div class="text-xs text-gray-600">
                  Total resistance increased from ${aR.toFixed(3)} to ${bR.toFixed(3)} m²·K/W
                </div>
              </div>
              <div class="p-6 bg-purple-50 rounded-lg border border-purple-200">
                <div class="text-3xl text-purple-600 mb-2">${bestName}</div>
                <div class="text-sm text-gray-700 mb-2">Ideal Material Used</div>
                <div class="text-xs text-gray-600">
                  Optimized configuration uses the single best (lowest-k) material from the backend materials list.
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-center">
              <button id="applyBBtn" class="${buttonClass({
                className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white px-8",
              })}">
                Apply Configuration B
              </button>
            </div>

            <div class="mt-4 flex justify-center">
              <button id="proceedReportBtn" class="${buttonClass({ variant: "outline", className: "px-8" })}">
                Proceed to Report <i data-lucide="arrow-right" class="ml-2 w-4 h-4"></i>
              </button>
            </div>
          </div>
        `;

        let applied = false;
        const applyBtn = document.getElementById("applyBBtn");

        const chartInstance = renderCompareChart(chart, { showConfigB: false });

        applyBtn?.addEventListener("click", async () => {
          if (applied) return;
          applied = true;
          applyBtn.textContent = "Configuration B Applied";
          applyBtn.setAttribute("disabled", "true");

          // Pass a “just applied” summary to Report/Results so it can show B stats at top.
          try {
            sessionStorage.setItem(
              "appliedConfigB",
              JSON.stringify({
                appliedAt: Date.now(),
                material: bestName,
                bFlux,
                bR,
                fluxReductionPct,
                rIncreasePct,
              })
            );
          } catch {
            // ignore storage failures
          }

          sessionStorage.setItem("simulationParams", JSON.stringify(idealParams));
          sessionStorage.setItem("simulationResult", JSON.stringify(idealResult));
          try {
            if (chartInstance?.data?.datasets?.[1]) {
              chartInstance.data.datasets[1].hidden = false;
              chartInstance.update();
            }
          } catch {
            // ignore
          }
        });

        document.getElementById("proceedReportBtn")?.addEventListener("click", () => {
          navigate("/report");
        });
      } catch (e) {
        const msg = e?.details?.error || e?.message || "Failed to compute ideal configuration";
        root.innerHTML = `
          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-red-200 bg-red-50">
            <div class="text-lg text-red-900 mb-2">Comparison failed</div>
            <div class="text-sm text-red-800">${escapeHtml(msg)}</div>
          </div>
        `;
      }
    },
  };
}

function renderCompareChart(rows, { showConfigB } = { showConfigB: true }) {
  const canvas = document.getElementById("compareChart");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext("2d");
  if (!ctx || !window.Chart) return;

  if (canvas.__chart) canvas.__chart.destroy();

  canvas.__chart = new window.Chart(ctx, {
    type: "line",
    data: {
      labels: rows.map((r) => r.position),
      datasets: [
        {
          label: "Configuration A (Current)",
          data: rows.map((r) => r.configA),
          borderColor: "#3b82f6",
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.35,
        },
        {
          label: "Configuration B (Optimized)",
          data: rows.map((r) => r.configB),
          borderColor: "#22c55e",
          borderWidth: 3,
          pointRadius: 0,
          tension: 0.35,
          hidden: !showConfigB,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          backgroundColor: "white",
          titleColor: "#111827",
          bodyColor: "#111827",
          borderColor: "#e5e7eb",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Position (cm)", color: "#6b7280" },
          grid: { color: "#e5e7eb" },
          ticks: { color: "#6b7280", maxTicksLimit: 8 },
        },
        y: {
          title: { display: true, text: "Temperature (°C)", color: "#6b7280" },
          grid: { color: "#e5e7eb" },
          ticks: { color: "#6b7280" },
        },
      },
    },
  });

  return canvas.__chart;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

