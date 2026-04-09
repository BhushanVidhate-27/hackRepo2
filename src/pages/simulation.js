import { apiFetch, apiFetchWithRetry } from "../lib/api.js";
import { computeWallLocal } from "../lib/localHeatCompute.js";
import { formatApiError } from "../lib/apiError.js";
import { recordMaterialUsageFromParams } from "../lib/materialUsage.js";
import { captureException } from "../lib/telemetry.js";
import { formatValidationIssues, validateComputePayload } from "../lib/validateComputePayload.js";
import { getCurrentWeatherContext } from "../lib/weatherContext.js";
import { computeWeatherAdjustedScore } from "../lib/weatherScore.js";
import { buttonClass } from "../lib/uiPrimitives.js";
import { navigate } from "../router.js";

const PARAMS_KEY = "simulationParams";
const RESULT_KEY = "simulationResult";

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function renderRunning() {
  return `
    <div class="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div class="max-w-2xl w-full px-8">
        <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-12 text-center border-gray-200">
          <h1 class="text-3xl text-[#0A2540] mb-3">Running Simulation</h1>
          <p class="text-gray-600 mb-8">
            Computing heat flux and interface temperatures using the backend solver...
          </p>

          <div class="mb-8">
            <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div class="h-2 bg-[#3A86FF] w-[70%]"></div>
            </div>
          </div>

          <div id="simProgressSteps" class="space-y-4 text-left max-w-md mx-auto">
            ${renderStep("Validating inputs", "green", true)}
            ${renderStep("Boundary conditions applied", "green", true)}
            ${renderStep("Solving heat transfer equations...", "blue", true)}
            ${renderStep("Generating visualizations", "gray", false)}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderError(error) {
  return `
    <div class="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div class="max-w-2xl w-full px-8">
        <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-12 text-center border-gray-200">
          <h1 class="text-3xl text-[#0A2540] mb-3">Simulation Failed</h1>
          <p class="text-gray-600 mb-8">We couldn't compute results with the current inputs.</p>

          <div class="mb-8">
            <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div class="h-2 bg-red-500 w-full"></div>
            </div>
          </div>

          <div class="space-y-4 text-left max-w-md mx-auto">
            ${renderStep("Validating inputs", "green", true)}
            ${renderStep("Boundary conditions applied", "green", true)}
            ${renderStep("Solving heat transfer equations...", "red", false, true)}
            ${renderStep("Generating visualizations", "gray", false)}
          </div>

          <div class="mt-8 pt-6 border-t border-gray-200 text-left">
            <div class="text-sm font-medium text-red-900 mb-2">Error</div>
            <div class="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">${escapeHtml(
              error
            )}</div>
            <div class="mt-4 flex gap-3">
              <button id="backBtn" class="${buttonClass({ variant: "outline" })}">Back to Inputs</button>
              <button id="retryBtn" class="${buttonClass({
                className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white",
              })}">Retry</button>
              <button id="proceedBtn" class="${buttonClass({
                className: "bg-[#3A86FF] hover:bg-[#2A76EF] text-white",
              })}">Proceed to Results</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function isValidComputeResult(result, layerCount) {
  if (!result || typeof result !== "object") return false;
  if (typeof result.heat_flux !== "number" || typeof result.resistance !== "number") return false;
  if (!Array.isArray(result.temperatures)) return false;
  if (result.temperatures.length !== layerCount + 1) return false;
  return true;
}

function paintSimulationComplete() {
  const el = document.getElementById("simProgressSteps");
  if (!el) return;
  el.innerHTML = `
            ${renderStep("Validating inputs", "green", true)}
            ${renderStep("Boundary conditions applied", "green", true)}
            ${renderStep("Solving heat transfer equations...", "green", true)}
            ${renderStep("Generating visualizations", "green", true)}
          `;
  try {
    window.lucide?.createIcons?.();
  } catch {
    // ignore
  }
}

function renderStep(label, tone, done, isError = false) {
  const toneClass =
    tone === "green"
      ? "bg-green-50 border-green-200"
      : tone === "blue"
        ? "bg-blue-50 border-blue-200"
        : tone === "red"
          ? "bg-red-50 border-red-200"
          : "bg-gray-50 border-gray-200";

  const textClass =
    tone === "green"
      ? "text-green-900"
      : tone === "blue"
        ? "text-blue-900"
        : tone === "red"
          ? "text-red-900"
          : "text-gray-600";

  const icon = isError ? "x-circle" : done ? "check-circle-2" : "";

  return `
    <div class="flex items-center gap-3 p-3 rounded-lg border ${toneClass}">
      ${
        icon
          ? `<i data-lucide="${icon}" class="w-5 h-5 ${
              isError ? "text-red-600" : "text-green-600"
            } flex-shrink-0"></i>`
          : `<div class="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>`
      }
      <span class="text-sm ${textClass}">${label}</span>
    </div>
  `;
}

export function renderSimulationScreen() {
  return {
    title: "Running Simulation",
    html: renderRunning(),
    async afterRender() {
      const params = safeParse(sessionStorage.getItem(PARAMS_KEY));
      if (!params) {
        document.getElementById("app").innerHTML = renderError(
          "Missing simulation inputs. Please start a new simulation."
        );
        bindErrorButtons();
        return;
      }

      const validation = validateComputePayload(params);
      if (!validation.ok) {
        const msg = formatValidationIssues(validation.errors);
        document.getElementById("app").innerHTML = renderError(`Invalid simulation parameters: ${msg}`);
        bindErrorButtons();
        return;
      }

      try {
        let materials = {};
        try {
          materials = (await apiFetch("/api/materials")) || {};
        } catch {
          // optional
        }

        try {
          recordMaterialUsageFromParams(params, materials || {});
        } catch {
          // ignore analytics failures
        }

        const layerCount = (params.layers || []).length;
        let result = null;
        try {
          result = await apiFetchWithRetry("/api/compute", { method: "POST", json: params });
        } catch {
          result = null;
        }

        if (!isValidComputeResult(result, layerCount)) {
          const local = computeWallLocal(params, materials || {});
          const { __computedLocally, ...rest } = local;
          result = rest;
        } else {
          delete result.__computedLocally;
        }

        let weatherContext = null;
        let weatherError = null;
        try {
          weatherContext = await getCurrentWeatherContext();
        } catch (e) {
          weatherError = e instanceof Error ? e.message : "Unable to fetch weather context.";
        }

        const weatherScore = computeWeatherAdjustedScore({
          result,
          modeId: params.insulationModeId,
          weatherContext,
        });
        result.derived = {
          ...(result.derived || {}),
          weatherAdjustedScore: weatherScore.score,
          weatherAvailable: weatherScore.available,
          weatherScoreBreakdown: {
            baseScore: weatherScore.baseScore,
            modeMultiplier: weatherScore.modeMultiplier,
            weatherTimeFactor: weatherScore.weatherTimeFactor,
          },
          weatherContext: weatherScore.weatherContext,
          weatherScoreReason: weatherError || weatherScore.reason,
          insulationMode: weatherScore.mode,
        };

        sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));

        try {
          await apiFetch("/api/state", {
            method: "PUT",
            json: { simulationParams: params, simulationResult: result },
          });
        } catch {
          // ignore persistence failures
        }

        paintSimulationComplete();
        navigate("/results");
      } catch (e) {
        captureException(e, { stage: "simulation-compute" });
        const msg = formatApiError(e);
        document.getElementById("app").innerHTML = renderError(msg);
        bindErrorButtons();
      }
    },
  };
}

function bindErrorButtons() {
  document.getElementById("backBtn")?.addEventListener("click", () => navigate("/dashboard"));
  document.getElementById("retryBtn")?.addEventListener("click", () => navigate("/simulation"));
  document.getElementById("proceedBtn")?.addEventListener("click", () => navigate("/results"));
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

