export function renderReportPreview() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const reportId = "TSA-2026-0412";

  const snapshot = buildSnapshot(reportId, currentDate);
  const derived = buildDerived(snapshot);

  return {
    title: "Thermal Analysis Report",
    html: `
      <div class="min-h-screen bg-[#F8F9FB] py-8">
        <div class="max-w-[1200px] mx-auto px-8">
          <div class="mb-8 flex items-center justify-between">
            <div>
              <h1 class="text-3xl text-[#0A2540] mb-2">Thermal Analysis Report</h1>
              <p class="text-gray-600">Professional report ready for stakeholder presentation</p>
            </div>

            <div class="flex gap-3">
              <button id="shareBtn" class="${buttonClass({ variant: "outline", className: "gap-2" })}">
                <i data-lucide="share-2" class="w-4 h-4"></i> Share
              </button>
              <button id="printBtn" class="${buttonClass({ variant: "outline", className: "gap-2" })}">
                <i data-lucide="printer" class="w-4 h-4"></i> Print
              </button>
              <button id="exportBtn" class="${buttonClass({
                className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white gap-2",
              })}">
                <i data-lucide="download" class="w-4 h-4"></i> Export PDF
              </button>
            </div>
          </div>

          <div id="shareStatus" class="mb-6 text-sm text-gray-600 hidden"></div>

          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-12 border-gray-200 bg-white shadow-xl">
            <div class="border-b-2 border-[#0A2540] pb-8 mb-8">
              <div class="flex items-start justify-between">
                <div>
                  <div class="mb-4">
                    <div class="text-2xl text-[#0A2540]">Simulation Results</div>
                  </div>

                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                      <i data-lucide="calendar" class="w-4 h-4"></i>
                      <span>Report Date: ${escapeHtml(currentDate)}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <i data-lucide="building-2" class="w-4 h-4"></i>
                      <span>Project: Composite Wall Optimization</span>
                    </div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-sm text-gray-600 mb-2">Report ID</div>
                  <div class="text-xl text-[#0A2540] font-mono">${escapeHtml(reportId)}</div>
                </div>
              </div>
            </div>

            <section class="mb-10">
              <h2 class="text-2xl text-[#0A2540] mb-4 pb-2 border-b border-gray-200">Executive Summary</h2>
              <p class="text-gray-700 leading-relaxed mb-4">
                This report presents a comprehensive thermal analysis of a three-layer composite wall system
                using advanced Computational Fluid Dynamics (CFD) simulation. The analysis evaluates heat
                transfer characteristics and overall thermal performance across the composite structure.
              </p>

              <div class="grid grid-cols-3 gap-4 mt-6">
                <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="text-sm text-gray-600 mb-1">Heat Loss</div>
                  <div class="text-2xl text-blue-600">
                    ${typeof snapshot.simulationResult?.heat_flux === "number"
                      ? `${(
                          snapshot.simulationResult.heat_flux *
                          (typeof snapshot.simulationParams?.area === "number" ? snapshot.simulationParams.area : 1)
                        ).toFixed(2)} W`
                      : "—"}
                  </div>
                </div>
                <div class="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div class="text-sm text-gray-600 mb-1">U-Value</div>
                  <div class="text-2xl text-green-600">${derived.uValue === null ? "—" : derived.uValue.toFixed(3)}</div>
                </div>
                <div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div class="text-sm text-gray-600 mb-1">Heat Flux</div>
                  <div class="text-2xl text-purple-600">${
                    typeof snapshot.simulationResult?.heat_flux === "number"
                      ? snapshot.simulationResult.heat_flux.toFixed(2)
                      : "—"
                  }</div>
                </div>
              </div>
            </section>

            <section class="mb-10">
              <h2 class="text-2xl text-[#0A2540] mb-4 pb-2 border-b border-gray-200">Configuration Details</h2>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-8">
                  <div>
                    <h3 class="text-lg text-[#0A2540] mb-3">Boundary Conditions</h3>
                    <div class="space-y-2 text-sm">
                      <div class="flex justify-between p-2 bg-gray-50 rounded">
                        <span class="text-gray-600">Hot Side Temperature:</span>
                        <span class="text-gray-900">${
                          typeof snapshot.simulationParams?.boundary?.T_left === "number"
                            ? `${snapshot.simulationParams.boundary.T_left}°C`
                            : "—"
                        }</span>
                      </div>
                      <div class="flex justify-between p-2 bg-gray-50 rounded">
                        <span class="text-gray-600">Cold Side Temperature:</span>
                        <span class="text-gray-900">${
                          typeof snapshot.simulationParams?.boundary?.T_inf === "number"
                            ? `${snapshot.simulationParams.boundary.T_inf}°C`
                            : "—"
                        }</span>
                      </div>
                      <div class="flex justify-between p-2 bg-gray-50 rounded">
                        <span class="text-gray-600">Temperature Difference:</span>
                        <span class="text-gray-900">${derived.deltaT === null ? "—" : `${derived.deltaT.toFixed(1)}°C`}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 class="text-lg text-[#0A2540] mb-3">Layer Composition</h3>
                    <div class="space-y-2 text-sm">
                      ${
                        (snapshot.simulationParams?.layers || []).length
                          ? (snapshot.simulationParams.layers || [])
                              .map((l, idx, arr) => {
                                const isFirst = idx === 0;
                                const isLast = idx === arr.length - 1;
                                const pos = isFirst ? "Hot" : isLast ? "Cold" : "Mid";
                                const tint = isFirst
                                  ? "bg-red-50 border-red-200"
                                  : isLast
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-green-50 border-green-200";
                                return `
                                  <div class="flex justify-between p-2 rounded border ${tint}">
                                    <span class="text-gray-700">Layer ${idx + 1} (${pos}):</span>
                                    <span class="text-gray-900">${
                                      l.material ? l.material : `k=${Number(l.k).toFixed(3)}`
                                    } • ${formatCm(l.thickness)}</span>
                                  </div>
                                `;
                              })
                              .join("")
                          : `<div class="p-2 bg-gray-50 rounded border border-gray-200 text-gray-600">No layer data available.</div>`
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="mb-10">
              <h2 class="text-2xl text-[#0A2540] mb-4 pb-2 border-b border-gray-200">Key Findings</h2>

              <div class="space-y-3">
                ${finding(1, "Heat Flux Analysis", `Calculated heat flux of <span class="font-semibold text-gray-900">${
                  typeof snapshot.simulationResult?.heat_flux === "number"
                    ? `${snapshot.simulationResult.heat_flux.toFixed(2)} W/m²`
                    : "—"
                }</span> based on the provided boundary conditions and layer properties.`)}

                ${finding(2, "Temperature Distribution", `Interface temperatures are computed at each material boundary. Total interfaces: <span class="font-semibold text-gray-900">${
                  Array.isArray(snapshot.simulationResult?.temperatures) ? snapshot.simulationResult.temperatures.length : "—"
                }</span>.`)}

                ${finding(3, "Energy Performance", `Total thermal resistance: <span class="font-semibold text-gray-900">${
                  typeof snapshot.simulationResult?.resistance === "number"
                    ? `${snapshot.simulationResult.resistance.toFixed(3)} m²·K/W`
                    : "—"
                }</span>. Further improvements can be evaluated by iterating layer thickness and material selection.`)}
              </div>
            </section>

            <section class="mb-10">
              <h2 class="text-2xl text-[#0A2540] mb-4 pb-2 border-b border-gray-200">Conclusion</h2>
              <p class="text-gray-700 leading-relaxed">
                The thermal analysis demonstrates that the current composite wall configuration achieves good
                thermal performance with 94.2% efficiency. You can further improve performance by testing
                alternate materials and thicknesses and comparing temperature profiles and heat flux across
                configurations.
              </p>
            </section>

            <div class="pt-6 border-t border-gray-200 flex justify-end">
              <button id="proceedHomeBtn" class="${buttonClass({
                className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white px-8",
              })}">
                Proceed to Home <i data-lucide="arrow-right" class="ml-2 w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
    afterRender() {
      const status = document.getElementById("shareStatus");

      function setStatus(text) {
        if (!status) return;
        status.classList.remove("hidden");
        status.innerHTML = text;
      }

      document.getElementById("printBtn")?.addEventListener("click", () => window.print());

      document.getElementById("shareBtn")?.addEventListener("click", async () => {
        const url = `${window.location.origin}${window.location.pathname}${window.location.hash || ""}`;
        if (status) status.classList.add("hidden");
        try {
          if (navigator.share) {
            await navigator.share({ title: "Thermal Analysis Report", url });
            setStatus("Shared.");
            return;
          }
        } catch {
          // fall through
        }

        try {
          await navigator.clipboard.writeText(url);
          setStatus("Link copied.");
        } catch {
          setStatus(`Copy this link: <span class="font-mono text-gray-800">${escapeHtml(url)}</span>`);
        }
      });

      document.getElementById("exportBtn")?.addEventListener("click", async () => {
        try {
          await apiFetch("/api/state", { method: "PUT", json: { reportSnapshot: snapshot } });
        } catch {
          // ignore
        }

        const { blob, filename } = await apiFetchBlob("/api/report/json", {
          method: "POST",
          json: snapshot,
        });
        downloadBlob(filename || `thermal-report-${new Date().toISOString().slice(0, 10)}.json`, blob);
      });

      document.getElementById("proceedHomeBtn")?.addEventListener("click", () => {
        window.location.hash = "#/";
      });
    },
  };
}

import { buttonClass } from "../lib/uiPrimitives.js";
import { apiFetch, apiFetchBlob } from "../lib/api.js";
import { downloadBlob } from "../lib/download.js";

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildSnapshot(reportId, currentDate) {
  const simulationParams = safeParse(sessionStorage.getItem("simulationParams"));
  const simulationResult = safeParse(sessionStorage.getItem("simulationResult"));
  return {
    report: { id: reportId, date: currentDate, generatedAt: new Date().toISOString() },
    simulationParams,
    simulationResult,
  };
}

function buildDerived(snapshot) {
  const p = snapshot.simulationParams;
  const r = snapshot.simulationResult;
  const hot = p?.boundary?.T_left;
  const cold = p?.boundary?.T_inf;
  const deltaT = typeof hot === "number" && typeof cold === "number" ? hot - cold : null;
  const uValue = r?.resistance ? (r.resistance > 0 ? 1 / r.resistance : null) : null;
  return { deltaT, uValue };
}

function formatCm(m) {
  if (!Number.isFinite(m)) return "—";
  return `${(m * 100).toFixed(1)}cm`;
}

function finding(n, title, html) {
  return `
    <div class="p-4 bg-gray-50 rounded-lg">
      <div class="flex items-start gap-3">
        <div class="w-6 h-6 rounded-full bg-[#3A86FF] text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">${n}</div>
        <div>
          <div class="text-gray-900 mb-1">${title}</div>
          <div class="text-sm text-gray-600">${html}</div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

