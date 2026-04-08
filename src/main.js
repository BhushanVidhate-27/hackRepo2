import "./styles/index.css";
import "./styles/app.css";

import { defineRoutes, startRouter, navigate } from "./router.js";
import { renderNavbar } from "./layouts/navbar.js";
import { renderDashboardNav, bindDashboardNav } from "./layouts/dashboardNav.js";
import { apiFetch } from "./lib/api.js";

// Pages (filled in later steps)
import { renderHomePage } from "./pages/home.js";
import { renderInputDashboard } from "./pages/dashboard.js";
import { renderSimulationScreen } from "./pages/simulation.js";
import { renderResultsDashboard } from "./pages/results.js";
import { renderLayerVisualization } from "./pages/visualization.js";
import { renderComparisonScreen } from "./pages/comparison.js";
import { renderReportPreview } from "./pages/report.js";

function isDashboardRoute(path) {
  return (
    path.includes("dashboard") ||
    path.includes("simulation") ||
    path.includes("results") ||
    path.includes("visualization") ||
    path.includes("comparison") ||
    path.includes("report")
  );
}

function ensureLucide() {
  try {
    if (window.lucide?.createIcons) window.lucide.createIcons();
  } catch {
    // ignore icon rendering failures
  }
}

defineRoutes({
  "/": renderHomePage,
  "/dashboard": renderInputDashboard,
  "/simulation": renderSimulationScreen,
  "/results": renderResultsDashboard,
  "/visualization": renderLayerVisualization,
  "/comparison": renderComparisonScreen,
  "/report": renderReportPreview,
  "*": () => ({
    title: "Not Found",
    html: `
      <div class="min-h-screen bg-[#F8F9FB] py-8">
        <div class="max-w-[1440px] mx-auto px-8">
          <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-gray-200">
            <div class="text-lg text-[#0A2540] mb-2">Page not found</div>
            <button class="bg-[#3A86FF] hover:bg-[#2A76EF] text-white h-9 px-4 py-2 rounded-md" id="goHomeBtn">Go Home</button>
          </div>
        </div>
      </div>
    `,
    afterRender() {
      document.getElementById("goHomeBtn")?.addEventListener("click", () => navigate("/"));
    },
  }),
});

async function renderRoot({ path, handler }) {
  const mount = document.getElementById("app");
  if (!mount) return;

  const isDash = isDashboardRoute(path);
  const header = isDash ? renderDashboardNav(path) : renderNavbar();

  const page = (await handler?.({ path })) || { title: "Thermal Analysis", html: "" };
  const body = page.html || "";

  mount.innerHTML = `
    <div class="min-h-screen bg-[#F8F9FB]">
      ${header}
      ${body}
    </div>
  `;

  if (isDash) bindDashboardNav();
  ensureLucide();

  try {
    await page.afterRender?.();
  } catch (e) {
    console.error(e);
  }
}

startRouter(renderRoot);

// Hydrate sessionStorage from backend persisted state (best-effort).
(async function hydrateFromBackendState() {
  try {
    const res = await apiFetch("/api/state");
    const state = res?.state;
    if (!state) return;

    if (state.simulationParams !== undefined) {
      sessionStorage.setItem("simulationParams", JSON.stringify(state.simulationParams));
    }
    if (state.simulationResult !== undefined) {
      sessionStorage.setItem("simulationResult", JSON.stringify(state.simulationResult));
    }
    if (state.uiDraft !== undefined) {
      sessionStorage.setItem("uiDraft", JSON.stringify(state.uiDraft));
    }
  } catch {
    // ignore hydration failures
  }
})();

