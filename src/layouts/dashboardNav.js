import { apiFetch } from "../lib/api.js";
import { buttonClass } from "../lib/uiPrimitives.js";

const navItems = [
  { path: "/dashboard", label: "Input", icon: "home" },
  { path: "/results", label: "Results", icon: "bar-chart-3" },
  { path: "/visualization", label: "Visualization", icon: "layers" },
  { path: "/comparison", label: "Compare", icon: "git-compare" },
  { path: "/report", label: "Report", icon: "file-text" },
];

export function renderDashboardNav(activePath) {
  return `
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div class="max-w-[1440px] mx-auto px-8">
        <div class="flex items-center justify-between h-16">
          <a href="#/" class="flex items-center">
            <span class="text-lg text-[#0A2540]">Thermal Analysis</span>
          </a>

          <div class="flex items-center gap-1">
            ${navItems
              .map((item) => {
                const isActive = activePath === item.path;
                return `
                  <a href="#${item.path}">
                    <button
                      data-nav="${item.path}"
                      class="${buttonClass({
                        variant: isActive ? "default" : "ghost",
                        size: "sm",
                        className: isActive
                          ? "bg-[#3A86FF] text-white h-7 px-2 text-xs"
                          : "text-[#0A2540] hover:bg-gray-100 h-7 px-2 text-xs",
                      })}"
                    >
                      ${item.label}
                    </button>
                  </a>
                `;
              })
              .join("")}
          </div>

          <div class="flex items-center gap-2">
            <button
              id="clearSavedBtn"
              class="${buttonClass({
                variant: "ghost",
                size: "sm",
                className: "text-[#0A2540] hover:bg-gray-100 h-7 px-2 text-xs",
              })}"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

export function bindDashboardNav() {
  const btn = document.getElementById("clearSavedBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const ok = window.confirm("Clear saved simulation data?");
    if (!ok) return;

    try {
      await apiFetch("/api/state", { method: "DELETE" });
    } catch {
      // ignore; still clear local copy
    }

    sessionStorage.removeItem("simulationParams");
    sessionStorage.removeItem("simulationResult");
    sessionStorage.removeItem("uiDraft");
    sessionStorage.removeItem("comparisonCache");
    window.location.hash = "#/dashboard";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

