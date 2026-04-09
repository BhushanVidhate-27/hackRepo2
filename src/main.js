import "./styles/index.css";
import "./styles/app.css";

import { Chart, registerables } from "chart.js";
import { createIcons, icons } from "lucide";

import { defineRoutes, startRouter, navigate } from "./router.js";
import { renderNavbar } from "./layouts/navbar.js";
import { renderDashboardNav, bindDashboardNav } from "./layouts/dashboardNav.js";
import { apiFetch, assertApiConfigured } from "./lib/api.js";
import { initTelemetry, captureException } from "./lib/telemetry.js";

Chart.register(...registerables);
window.Chart = Chart;
window.lucide = { createIcons, icons };

initTelemetry();
assertApiConfigured();

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

function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function bindNavbarScrollLinks() {
  const links = document.querySelectorAll("[data-scroll-target]");
  if (!links.length) return;

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const target = a.getAttribute("data-scroll-target");
      if (!target) return;

      // If we're not on home, go home first, then scroll.
      if (window.location.hash !== "#/") {
        navigate("/");
      }

      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        if (scrollToSection(target) || tries > 30) {
          clearInterval(timer);
        }
      }, 50);
    });
  });
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

  // Single-page apps should reset scroll between routes.
  // Prevents landing mid-page (e.g., graph section) after navigation.
  try {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  } catch {
    window.scrollTo(0, 0);
  }

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
  if (!isDash) bindNavbarScrollLinks();
  ensureLucide();

  try {
    await page.afterRender?.();
  } catch (e) {
    console.error(e);
    captureException(e, { stage: "route-afterRender", path });
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
  } catch (e) {
    captureException(e, { stage: "hydrate-backend-state" });
  }
})();

