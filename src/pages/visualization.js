import { apiFetch } from "../lib/api.js";
import { computeWallLocal } from "../lib/localHeatCompute.js";
import { buttonClass } from "../lib/uiPrimitives.js";
import { navigate } from "../router.js";

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function renderLayerVisualization() {
  return {
    title: "Layer Visualization",
    html: `
      <div class="min-h-screen bg-[#F8F9FB] py-8">
        <div class="max-w-[1440px] mx-auto px-8">
          <div class="mb-8">
            <h1 class="text-3xl text-[#0A2540] mb-2">Layer Visualization</h1>
            <p class="text-gray-600">Visual representation of composite wall structure with thermal gradient</p>
          </div>

          <div id="vizRoot"></div>
        </div>
      </div>
    `,
    async afterRender() {
      const root = document.getElementById("vizRoot");
      if (!root) return;

      let params = safeParse(sessionStorage.getItem("simulationParams"));
      let result = safeParse(sessionStorage.getItem("simulationResult"));
      const layerCount = (params?.layers || []).length;

      if (!params || !result) {
        root.innerHTML = `
          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
            <div class="text-lg text-[#0A2540] mb-2">No visualization data</div>
            <div class="text-sm text-gray-600">Run a simulation first so the backend can generate the thermal profile.</div>
          </div>
        `;
        return;
      }

      let materials = {};
      try {
        materials = (await apiFetch("/api/materials")) || {};
      } catch {
        // optional
      }

      const tempsOk =
        Array.isArray(result.temperatures) && result.temperatures.length === layerCount + 1;
      if (!tempsOk) {
        try {
          const { __computedLocally, ...computed } = computeWallLocal(params, materials || {});
          result = computed;
          sessionStorage.setItem("simulationResult", JSON.stringify(result));
        } catch {
          // leave result as-is; buildView will fail below
        }
      }

      let view = layerCount ? buildView(params, result, materials) : null;
      if (!view && layerCount) {
        try {
          const { __computedLocally, ...computed } = computeWallLocal(params, materials || {});
          result = computed;
          sessionStorage.setItem("simulationResult", JSON.stringify(result));
          view = buildView(params, result, materials);
        } catch {
          view = null;
        }
      }

      if (!view) {
        root.innerHTML = `
          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
            <div class="text-lg text-[#0A2540] mb-2">No visualization data</div>
            <div class="text-sm text-gray-600">Run a simulation first so the backend can generate the thermal profile.</div>
          </div>
        `;
        return;
      }

      root.innerHTML = `
        <div class="mb-8">
          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-blue-200 bg-blue-50">
            <div class="flex gap-3">
              <i data-lucide="info" class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"></i>
              <div class="flex-1">
                <div class="text-sm text-blue-900 mb-1">Visualization Info</div>
                <div class="text-xs text-blue-700">
                  Colors represent a hot-to-cold gradient. Layer sizes are proportional to thickness. Temperatures shown come from
                  the backend thermal profile.
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-900">
                <div>
                  <div class="text-blue-700">Heat flux</div>
                  <div class="font-semibold">${view.heatFlux.toFixed(2)} W/m²</div>
                </div>
                <div>
                  <div class="text-blue-700">Resistance</div>
                  <div class="font-semibold">${view.resistance.toFixed(3)} m²·K/W</div>
                </div>
                <div>
                  <div class="text-blue-700">Hot / Cold</div>
                  <div class="font-semibold">${view.hot.toFixed(1)}°C / ${view.cold.toFixed(1)}°C</div>
                </div>
                <div>
                  <div class="text-blue-700">Total thickness</div>
                  <div class="font-semibold">${view.totalThickness.toFixed(1)} cm</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-6">
            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 border-gray-200">
              <h2 class="text-xl text-[#0A2540] mb-6">Thermal Profile</h2>

              <div class="space-y-4">
                ${view.layers
                  .map((layer) => {
                    const heightPercent = view.totalThickness > 0 ? (layer.thicknessCm / view.totalThickness) * 100 : 0;
                    const h = Math.max(heightPercent * 3, 80);
                    return `
                      <div
                        class="relative rounded-lg overflow-hidden bg-gradient-to-r ${layer.gradient} flex items-center justify-between px-6 border-2 ${layer.borderColor}"
                        style="height:${h}px"
                      >
                        <div class="flex items-center gap-4">
                          <div class="text-white text-lg drop-shadow-md">${layer.name}</div>
                          <div class="px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full text-white text-sm">${layer.thicknessCm.toFixed(
                            1
                          )} cm</div>
                        </div>

                        <div class="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
                          <span class="text-lg">${layer.tempAvg.toFixed(1)}°C</span>
                        </div>

                        <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-1">
                          <i data-lucide="arrow-right" class="w-4 h-4 text-white/60"></i>
                          <span class="text-xs text-white/60">Heat Flow</span>
                        </div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>

              <div class="mt-6 flex items-center justify-center gap-2 text-gray-500">
                <div class="flex-1 h-1 bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 rounded-full"></div>
                <span class="text-sm whitespace-nowrap">Heat Transfer Direction →</span>
              </div>
            </div>

            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-8 border-gray-200">
              <h3 class="text-lg text-[#0A2540] mb-6">Cross-Section View</h3>
              <div class="flex h-64 border-2 border-gray-200 rounded-lg overflow-hidden">
                ${view.layers
                  .map((layer) => {
                    const widthPercent = view.totalThickness > 0 ? (layer.thicknessCm / view.totalThickness) * 100 : 0;
                    return `
                      <div
                        class="relative bg-gradient-to-b ${layer.gradient} flex flex-col items-center justify-center border-r-2 ${layer.borderColor} last:border-r-0"
                        style="width:${widthPercent}%"
                      >
                        <div class="text-white text-sm drop-shadow-md mb-2 transform -rotate-90 whitespace-nowrap">${layer.name}</div>
                        <div class="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm">${layer.tempAvg.toFixed(1)}°C</div>
                      </div>
                    `;
                  })
                  .join("")}
              </div>

              <div class="mt-4 flex justify-between text-xs text-gray-600">
                <span>Hot Side (${view.hot.toFixed(1)}°C)</span>
                <span>Total: ${view.totalThickness.toFixed(1)} cm</span>
                <span>Cold Side (${view.cold.toFixed(1)}°C)</span>
              </div>
            </div>
          </div>

          <div class="space-y-6">
            ${view.layers
              .map((layer, index) => {
                return `
                  <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
                    <div class="w-full h-3 rounded-full bg-gradient-to-r ${layer.gradient} mb-4"></div>
                    <h3 class="text-lg text-[#0A2540] mb-4">Layer ${index + 1}</h3>
                    <div class="space-y-3">
                      ${
                        layer.materialKey
                          ? `
                            <div class="flex justify-between">
                              <span class="text-sm text-gray-600">Material</span>
                              <span class="text-sm text-[#0A2540] capitalize">${layer.materialKey}</span>
                            </div>
                          `
                          : ""
                      }
                      <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Thickness</span>
                        <span class="text-sm text-[#0A2540]">${layer.thicknessCm.toFixed(1)} cm</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm text-gray-600">Temperature</span>
                        <span class="text-sm text-[#0A2540]">${layer.t0.toFixed(1)}°C → ${layer.t1.toFixed(1)}°C</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm text-gray-600">% of Total</span>
                        <span class="text-sm text-[#0A2540]">${(view.totalThickness > 0
                          ? (layer.thicknessCm / view.totalThickness) * 100
                          : 0
                        ).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}

            <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
              <h3 class="text-lg text-[#0A2540] mb-2">Next Step</h3>
              <p class="text-sm text-gray-600">Proceed to compare configurations.</p>
              <button id="proceedCompareBtn" class="${buttonClass({
                className: "w-full bg-[#3A86FF] hover:bg-[#2A76EF] text-white",
              })}">
                Proceed to Comparison <i data-lucide="arrow-right" class="ml-2 w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById("proceedCompareBtn")?.addEventListener("click", () => navigate("/compare"));

      try {
        window.lucide?.createIcons?.();
      } catch {
        // ignore
      }
    },
  };
}

function buildView(params, result, materials) {
  const layers = params?.layers || [];
  const temps = result?.temperatures || [];
  if (!layers.length || temps.length !== layers.length + 1) return null;

  const thicknessCm =
    typeof params.totalThickness === "number"
      ? params.totalThickness * 100
      : layers.reduce((s, l) => s + (l?.thickness || 0), 0) * 100;

  const normalizedLayers = layers.map((l, i) => {
    const t0 = temps[i];
    const t1 = temps[i + 1];
    const avg = (t0 + t1) / 2;

    const gradient =
      i === 0
        ? "from-red-500 via-orange-400 to-yellow-300"
        : i === layers.length - 1
          ? "from-cyan-300 via-blue-400 to-blue-600"
          : "from-yellow-300 via-green-300 to-cyan-300";

    const borderColor =
      i === 0 ? "border-red-200" : i === layers.length - 1 ? "border-blue-200" : "border-green-200";

    const thickness = (l.thickness || 0) * 100;
    const materialKey = l.material;
    const showMaterial = typeof materialKey === "string" && materialKey in (materials || {});

    return {
      index: i,
      name: `Layer ${i + 1}`,
      thicknessCm: thickness,
      t0,
      t1,
      tempAvg: avg,
      k: l.k,
      materialKey: showMaterial ? materialKey : undefined,
      gradient,
      borderColor,
    };
  });

  const totalThickness = normalizedLayers.reduce((s, l) => s + l.thicknessCm, 0);

  return {
    layers: normalizedLayers,
    totalThickness,
    thicknessCm,
    heatFlux: result.heat_flux,
    resistance: result.resistance,
    hot: params.boundary.T_left,
    cold: params.boundary.T_inf,
  };
}

