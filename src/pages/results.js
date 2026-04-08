import { buttonClass } from "../lib/uiPrimitives.js";
import { downloadJson } from "../lib/download.js";
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
      position: Number((xM * 100).toFixed(1)), // cm
      temperature: Number(Number(temp).toFixed(2)),
    });
  }

  return data;
}

function renderNoResults() {
  return `
    <div class="min-h-screen bg-[#F8F9FB] py-8">
      <div class="max-w-[1440px] mx-auto px-8">
        <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
          <div class="text-lg text-[#0A2540] mb-2">No results found</div>
          <div class="text-sm text-gray-600 mb-4">Please run a simulation to generate results.</div>
          <button id="goInputsBtn" class="${buttonClass({ className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white" })}">
            Go to Inputs
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderResultsDashboard() {
  const params = safeParse(sessionStorage.getItem("simulationParams"));
  const result = safeParse(sessionStorage.getItem("simulationResult"));
  const appliedB = safeParse(sessionStorage.getItem("appliedConfigB"));

  if (!params || !result) {
    return {
      title: "Simulation Results",
      html: renderNoResults(),
      afterRender() {
        document.getElementById("goInputsBtn")?.addEventListener("click", () => navigate("/dashboard"));
      },
    };
  }

  const deltaT = params.boundary.T_left - params.boundary.T_inf;
  const rTotal = result.resistance;
  const uValue = rTotal > 0 ? 1 / rTotal : null;

  return {
    title: "Simulation Results",
    html: `
      <div class="min-h-screen bg-[#F8F9FB] py-8">
        <div class="max-w-[1440px] mx-auto px-8">
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl text-[#0A2540] mb-2">Simulation Results</h1>
                <p class="text-gray-600">Computation completed successfully</p>
              </div>
              <div class="flex gap-3">
                <button id="viewLayersBtn" class="${buttonClass({ variant: "outline", className: "gap-2" })}">
                  <i data-lucide="eye" class="w-4 h-4"></i> View Layers
                </button>
                <button id="exportBtn" class="${buttonClass({
                  className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white gap-2",
                })}">
                  <i data-lucide="download" class="w-4 h-4"></i> Export Data
                </button>
              </div>
            </div>
          </div>

          ${
            appliedB && typeof appliedB === "object"
              ? `
                <div class="mb-8 bg-card text-card-foreground flex flex-col gap-4 rounded-xl border p-6 border-green-200 bg-green-50">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-lg text-green-900 mb-1">Configuration B applied</div>
                      <div class="text-sm text-green-800">You’re now viewing Results for the optimized configuration.</div>
                    </div>
                    <div class="px-3 py-1 rounded-full bg-white border border-green-200 text-sm text-green-900">
                      Material: <span class="font-semibold">${escapeHtml(appliedB.material || "—")}</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="p-4 bg-white rounded-lg border border-green-200">
                      <div class="text-xs text-gray-600 mb-1">B Heat Flux</div>
                      <div class="text-xl text-green-700 font-semibold">${Number(appliedB.bFlux).toFixed(2)} W/m²</div>
                    </div>
                    <div class="p-4 bg-white rounded-lg border border-green-200">
                      <div class="text-xs text-gray-600 mb-1">B Resistance</div>
                      <div class="text-xl text-green-700 font-semibold">${Number(appliedB.bR).toFixed(3)} m²·K/W</div>
                    </div>
                    <div class="p-4 bg-white rounded-lg border border-green-200">
                      <div class="text-xs text-gray-600 mb-1">Flux Improvement</div>
                      <div class="text-xl text-green-700 font-semibold">${
                        appliedB.fluxReductionPct === null || appliedB.fluxReductionPct === undefined
                          ? "—"
                          : `↓ ${Number(appliedB.fluxReductionPct).toFixed(1)}%`
                      }</div>
                    </div>
                    <div class="p-4 bg-white rounded-lg border border-green-200">
                      <div class="text-xs text-gray-600 mb-1">Resistance Improvement</div>
                      <div class="text-xl text-green-700 font-semibold">${
                        appliedB.rIncreasePct === null || appliedB.rIncreasePct === undefined
                          ? "—"
                          : `↑ ${Number(appliedB.rIncreasePct).toFixed(1)}%`
                      }</div>
                    </div>
                  </div>
                </div>
              `
              : ""
          }

          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${metricCard("Heat Flux", result.heat_flux.toFixed(2), "W/m²")}
            ${metricCard("Temp Drop", deltaT.toFixed(1), "°C")}
            ${metricCard("Total Resistance", rTotal.toFixed(3), "m²·K/W")}
            ${metricCard("U-Value", uValue === null ? "—" : uValue.toFixed(3), "W/m²·K")}
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:items-stretch">
            <div class="lg:col-span-2">
              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200 h-full">
                <h2 class="text-xl text-[#0A2540] mb-6">Temperature Distribution</h2>
                <div class="w-full flex-1 min-h-[420px]">
                  <canvas id="tempChart"></canvas>
                </div>
                <div class="mt-4 flex items-center justify-center gap-8 text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-red-500"></div>
                    <span class="text-gray-600">Hot Side</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-green-500"></div>
                    <span class="text-gray-600">Insulation</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-4 h-4 rounded bg-blue-500"></div>
                    <span class="text-gray-600">Cold Side</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="h-full flex flex-col gap-6">
              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
                <h3 class="text-lg text-[#0A2540] mb-4">Interface Temperatures</h3>
                <div class="space-y-4" id="ifaceTemps"></div>
              </div>

              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
                <h3 class="text-lg text-[#0A2540] mb-4">Next Steps</h3>
                <div class="space-y-3">
                  <button id="goVizBtn" class="${buttonClass({ variant: "outline", className: "w-full justify-start" })}">
                    <i data-lucide="eye" class="w-4 h-4 mr-2"></i> View Layer Visualization
                  </button>
                  <button id="goCompareBtn" class="${buttonClass({ variant: "outline", className: "w-full justify-start" })}">
                    <i data-lucide="arrow-right" class="w-4 h-4 mr-2"></i> Compare Configurations
                  </button>
                  <button id="proceedNextBtn" class="${buttonClass({
                    className: "w-full bg-[#3A86FF] hover:bg-[#2A76EF] text-white justify-center",
                  })}">
                    Proceed to Visualization <i data-lucide="arrow-right" class="ml-2 w-4 h-4"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    afterRender() {
      // If we came from Apply Configuration B, ensure the user sees the stats banner.
      if (appliedB) {
        try {
          sessionStorage.removeItem("appliedConfigB");
        } catch {
          // ignore
        }
      }

      document.getElementById("viewLayersBtn")?.addEventListener("click", () => navigate("/visualization"));
      document.getElementById("goVizBtn")?.addEventListener("click", () => navigate("/visualization"));
      document.getElementById("goCompareBtn")?.addEventListener("click", () => navigate("/comparison"));
      document.getElementById("proceedNextBtn")?.addEventListener("click", () => navigate("/visualization"));

      document.getElementById("exportBtn")?.addEventListener("click", () => {
        const date = new Date().toISOString().slice(0, 10);
        downloadJson(`simulation-results-${date}`, {
          generatedAt: new Date().toISOString(),
          simulationParams: params,
          simulationResult: result,
          derived: { deltaT, uValue },
        });
      });

      renderInterfaceTemps(result?.temperatures || []);
      renderChart(params, result);
    },
  };
}

function metricCard(label, value, unit) {
  return `
    <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
      <div class="text-sm text-gray-600 mb-3">${label}</div>
      <div class="text-3xl text-[#0A2540] mb-1">${value}</div>
      <div class="text-sm text-gray-600">${unit}</div>
    </div>
  `;
}

function renderInterfaceTemps(temps) {
  const el = document.getElementById("ifaceTemps");
  if (!el) return;
  if (!Array.isArray(temps) || temps.length < 2) {
    el.innerHTML = `<div class="text-sm text-gray-600">—</div>`;
    return;
  }

  const last = temps[temps.length - 1];
  const mid1 = temps[1];
  const mid2 = temps[2];

  el.innerHTML = `
    <div class="flex justify-between items-center p-3 bg-red-50 rounded-lg">
      <span class="text-sm text-gray-700">T₁ (Hot)</span>
      <span class="text-lg text-red-600">${Number(temps[0]).toFixed(1)}°C</span>
    </div>
    <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
      <span class="text-sm text-gray-700">T₁₋₂</span>
      <span class="text-lg text-orange-600">${mid1 === undefined ? "—" : Number(mid1).toFixed(1) + "°C"}</span>
    </div>
    <div class="flex justify-between items-center p-3 bg-green-50 rounded-lg">
      <span class="text-sm text-gray-700">T₂₋₃</span>
      <span class="text-lg text-green-600">${mid2 === undefined ? "—" : Number(mid2).toFixed(1) + "°C"}</span>
    </div>
    <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
      <span class="text-sm text-gray-700">T₃ (Cold)</span>
      <span class="text-lg text-blue-600">${Number(last).toFixed(1)}°C</span>
    </div>
  `;
}

function renderChart(params, result) {
  const canvas = document.getElementById("tempChart");
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const data = buildTempProfile(params, result);
  if (!data.length) return;

  const ctx = canvas.getContext("2d");
  if (!ctx || !window.Chart) return;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width || 800, 0);
  gradient.addColorStop(0, "rgba(239, 68, 68, 0.8)");
  gradient.addColorStop(0.5, "rgba(34, 197, 94, 0.8)");
  gradient.addColorStop(1, "rgba(59, 130, 246, 0.8)");

  const labels = data.map((p) => p.position);
  const temps = data.map((p) => p.temperature);

  // destroy previous instance if any
  if (canvas.__chart) {
    canvas.__chart.destroy();
  }

  canvas.__chart = new window.Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Temperature (°C)",
          data: temps,
          borderColor: "#3A86FF",
          borderWidth: 3,
          fill: true,
          backgroundColor: gradient,
          pointRadius: 0,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
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
}

