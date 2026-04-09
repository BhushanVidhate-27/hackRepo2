import { apiFetch } from "../lib/api.js";
import { buttonClass, inputClass } from "../lib/uiPrimitives.js";
import { navigate } from "../router.js";

const DRAFT_KEY = "uiDraft";
const PARAMS_KEY = "simulationParams";
const MAX_JSON_IMPORT_BYTES = 256 * 1024;

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function uid() {
  return String(Date.now()) + String(Math.floor(Math.random() * 1000));
}

function getLayerColor(index) {
  const colors = [
    "from-red-50 to-orange-50 border-red-200 text-red-700",
    "from-green-50 to-emerald-50 border-green-200 text-green-700",
    "from-blue-50 to-cyan-50 border-blue-200 text-blue-700",
    "from-purple-50 to-pink-50 border-purple-200 text-purple-700",
    "from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700",
  ];
  return colors[index % colors.length];
}

function buildInitialState() {
  const state = {
    hotTemp: "",
    coldTemp: "",
    layers: [{ id: "1", thickness: "", conductivity: "", unit: "cm" }],
  };

  const draft = safeParse(sessionStorage.getItem(DRAFT_KEY));
  if (draft && typeof draft === "object") {
    if (typeof draft.hotTemp === "string") state.hotTemp = draft.hotTemp;
    if (typeof draft.coldTemp === "string") state.coldTemp = draft.coldTemp;
    if (Array.isArray(draft.layers) && draft.layers.length) state.layers = draft.layers;
    return state;
  }

  const params = safeParse(sessionStorage.getItem(PARAMS_KEY));
  if (!params || typeof params !== "object") return state;

  const hot = params?.boundary?.T_left;
  const cold = params?.boundary?.T_inf;
  if (typeof hot === "number") state.hotTemp = String(hot);
  if (typeof cold === "number") state.coldTemp = String(cold);

  if (Array.isArray(params?.layers) && params.layers.length) {
    state.layers = params.layers.map((l, idx) => ({
      id: String(idx + 1),
      thickness: typeof l?.thickness === "number" ? String((l.thickness * 100).toFixed(2)) : "",
      conductivity: typeof l?.k === "number" ? String(l.k) : "",
      unit: "cm",
    }));
  }

  return state;
}

function schedulePersistDraft(draft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  apiFetch("/api/state", { method: "PUT", json: { uiDraft: draft } }).catch(() => {});
}

function totalThicknessCm(layers) {
  return layers.reduce((sum, layer) => {
    const t = parseFloat(layer.thickness) || 0;
    return sum + (layer.unit === "mm" ? t / 10 : t);
  }, 0);
}

/**
 * @param {unknown} parsed
 * @returns {{ kind: "uiDraft" | "simulationParams", data: object }}
 */
function normalizeImportedPayload(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON root must be an object.");
  }
  const root = parsed;
  if (root.uiDraft && typeof root.uiDraft === "object" && !Array.isArray(root.uiDraft)) {
    return { kind: "uiDraft", data: root.uiDraft };
  }
  if (root.simulationParams && typeof root.simulationParams === "object" && !Array.isArray(root.simulationParams)) {
    return { kind: "simulationParams", data: root.simulationParams };
  }
  if (root.boundary && typeof root.boundary === "object" && Array.isArray(root.layers)) {
    return { kind: "simulationParams", data: root };
  }
  if ("layers" in root || "hotTemp" in root || "coldTemp" in root) {
    return { kind: "uiDraft", data: root };
  }
  throw new Error('Expected "uiDraft", "simulationParams", boundary+layers, or uiDraft-shaped fields.');
}

/**
 * @param {object} d
 * @returns {{ hotTemp: string, coldTemp: string, layers: { id: string, thickness: string, conductivity: string, unit: string }[] }}
 */
function draftFromUiDraftObject(d) {
  const hotTemp =
    d.hotTemp !== undefined && d.hotTemp !== null && d.hotTemp !== "" ? String(d.hotTemp).trim() : "";
  const coldTemp =
    d.coldTemp !== undefined && d.coldTemp !== null && d.coldTemp !== "" ? String(d.coldTemp).trim() : "";
  if (!Array.isArray(d.layers) || !d.layers.length) {
    throw new Error("uiDraft.layers must be a non-empty array.");
  }
  const layers = d.layers.map((raw, idx) => {
    const l = raw && typeof raw === "object" ? raw : {};
    const unit = l.unit === "mm" ? "mm" : "cm";
    const thickness =
      l.thickness !== undefined && l.thickness !== null ? String(l.thickness).trim() : "";
    const conductivity =
      l.conductivity !== undefined && l.conductivity !== null ? String(l.conductivity).trim() : "";
    const id = typeof l.id === "string" && l.id ? l.id : uid();
    if (!thickness || !conductivity) {
      throw new Error(`layers[${idx}]: thickness and conductivity are required.`);
    }
    return { id, thickness, conductivity, unit };
  });
  return { hotTemp, coldTemp, layers };
}

/**
 * @param {object} p
 * @returns {{ hotTemp: string, coldTemp: string, layers: { id: string, thickness: string, conductivity: string, unit: string }[] }}
 */
function draftFromSimulationParamsObject(p) {
  const b = p.boundary;
  if (!b || typeof b !== "object") {
    throw new Error("simulationParams.boundary is required.");
  }
  const tl = b.T_left;
  const tinf = b.T_inf;
  if (!Number.isFinite(tl) || !Number.isFinite(tinf)) {
    throw new Error("boundary.T_left and boundary.T_inf must be finite numbers.");
  }
  if (!Array.isArray(p.layers) || !p.layers.length) {
    throw new Error("simulationParams.layers must be a non-empty array.");
  }
  const layers = p.layers.map((raw, idx) => {
    const l = raw && typeof raw === "object" ? raw : {};
    const th = l.thickness;
    const k = l.k;
    if (!Number.isFinite(th) || th <= 0) {
      throw new Error(`layers[${idx}].thickness must be a positive number (meters).`);
    }
    if (!Number.isFinite(k) || k <= 0) {
      throw new Error(`layers[${idx}].k must be a positive number (W/m·K).`);
    }
    return {
      id: String(idx + 1),
      thickness: String(Number((th * 100).toFixed(4))),
      conductivity: String(k),
      unit: "cm",
    };
  });
  return { hotTemp: String(tl), coldTemp: String(tinf), layers };
}

/**
 * @param {string} text
 */
function parseImportedJsonText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON.");
  }
  const norm = normalizeImportedPayload(parsed);
  if (norm.kind === "uiDraft") {
    return draftFromUiDraftObject(norm.data);
  }
  return draftFromSimulationParamsObject(norm.data);
}

function buildExampleJsonBlob() {
  const example = {
    version: 1,
    uiDraft: {
      hotTemp: "35",
      coldTemp: "10",
      layers: [
        { thickness: "12", conductivity: "0.8", unit: "cm" },
        { thickness: "50", conductivity: "0.04", unit: "mm" },
      ],
    },
  };
  return new Blob([`${JSON.stringify(example, null, 2)}\n`], { type: "application/json" });
}

export function renderInputDashboard() {
  const state = buildInitialState();
  const totalCm = totalThicknessCm(state.layers);
  const tempDiff = (parseFloat(state.hotTemp) || 0) - (parseFloat(state.coldTemp) || 0);

  return {
    title: "Thermal Simulation Input",
    html: `
      <div class="min-h-screen bg-[#F8F9FB] py-8">
        <div class="max-w-[1440px] mx-auto px-8">
          <div class="mb-8">
            <h1 class="text-3xl text-[#0A2540] mb-2">Thermal Simulation Input</h1>
            <p class="text-gray-600">Configure your composite wall parameters</p>
            <div class="mt-4 flex flex-wrap items-center gap-3">
              <input type="file" id="jsonImportInput" accept="application/json,.json" class="hidden" />
              <button type="button" id="jsonImportBtn" class="${buttonClass({ variant: "outline", className: "gap-2" })}">
                <i data-lucide="upload" class="w-4 h-4"></i> Load from JSON
              </button>
              <button type="button" id="jsonExampleBtn" class="${buttonClass({ variant: "outline", className: "gap-2" })}">
                <i data-lucide="download" class="w-4 h-4"></i> Example JSON
              </button>
            </div>
            <p id="jsonImportHint" class="text-xs text-gray-500 mt-2 max-w-3xl">
              Accepts <span class="font-medium text-gray-700">uiDraft</span> (form fields) or
              <span class="font-medium text-gray-700">simulationParams</span> (solver: layer thickness in meters, k in W/m·K). Optional wrapper:
              <code class="text-[11px] bg-gray-100 px-1 rounded">{ "version": 1, "uiDraft": { ... } }</code>
            </p>
            <div id="jsonImportFeedback" class="text-sm mt-3 hidden" role="status"></div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6">
                <h2 class="text-xl text-[#0A2540] mb-6">Boundary Temperatures</h2>
                <div class="grid md:grid-cols-2 gap-6">
                  <div>
                    <label class="text-sm text-gray-700 mb-2 block">Hot Side (°C)</label>
                    <input id="hotTemp" type="number" placeholder="e.g. 20–80" class="${inputClass} text-lg" value="${escapeHtml(
                      state.hotTemp
                    )}" />
                  </div>
                  <div>
                    <label class="text-sm text-gray-700 mb-2 block">Cold Side (°C)</label>
                    <input id="coldTemp" type="number" placeholder="e.g. -20–30" class="${inputClass} text-lg" value="${escapeHtml(
                      state.coldTemp
                    )}" />
                  </div>
                </div>
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div class="text-sm text-gray-600">ΔT: <span class="font-semibold text-[#0A2540]" id="deltaT">${tempDiff.toFixed(
                    1
                  )}°C</span></div>
                </div>
              </div>

              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl text-[#0A2540]">Layer Configuration</h2>
                  <button id="addLayerBtn" class="${buttonClass({ variant: "outline", size: "sm", className: "gap-2" })}">
                    <i data-lucide="plus" class="w-4 h-4"></i> Add Layer
                  </button>
                </div>

                <div class="space-y-4" id="layersContainer">
                  ${state.layers
                    .map((layer, index) => renderLayerRow(layer, index, state.layers.length))
                    .join("")}
                </div>

                <div class="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="text-sm text-blue-900">
                    Layers: <span class="font-semibold" id="layerCount">${state.layers.length}</span> | Total: <span class="font-semibold" id="totalThickness">${totalCm.toFixed(
                      1
                    )} cm</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6">
                <h3 class="text-lg text-[#0A2540] mb-4">Summary</h3>
                <div class="space-y-4">
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-gray-600 mb-1">Thickness</div>
                    <div class="text-2xl text-[#0A2540]" id="summaryThickness">${totalCm.toFixed(1)} cm</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-gray-600 mb-1">ΔT</div>
                    <div class="text-2xl text-[#0A2540]" id="summaryDeltaT">${tempDiff.toFixed(1)}°C</div>
                  </div>
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <div class="text-xs text-gray-600 mb-1">Layers</div>
                    <div class="text-2xl text-[#0A2540]" id="summaryLayers">${state.layers.length}</div>
                  </div>
                </div>
              </div>

              <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 border-yellow-200 bg-yellow-50">
                <div class="flex gap-3">
                  <i data-lucide="alert-circle" class="w-5 h-5 text-yellow-600 mt-0.5"></i>
                  <div>
                    <div class="text-sm font-medium text-yellow-900 mb-1">Tip</div>
                    <div class="text-xs text-yellow-800">Add insulation layers for better performance.</div>
                  </div>
                </div>
              </div>

              <button
                id="runSimBtn"
                class="${buttonClass({
                  className:
                    "w-full bg-[#3A86FF] hover:bg-[#2A76EF] text-white py-6 text-lg",
                })}"
              >
                Run Simulation <i data-lucide="arrow-right" class="ml-2 w-5 h-5"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
    afterRender() {
      const hotEl = document.getElementById("hotTemp");
      const coldEl = document.getElementById("coldTemp");
      const layersEl = document.getElementById("layersContainer");
      const addBtn = document.getElementById("addLayerBtn");
      const runBtn = document.getElementById("runSimBtn");
      const jsonImportInput = document.getElementById("jsonImportInput");
      const jsonImportBtn = document.getElementById("jsonImportBtn");
      const jsonExampleBtn = document.getElementById("jsonExampleBtn");
      const jsonImportFeedback = document.getElementById("jsonImportFeedback");

      function setJsonFeedback(message, tone) {
        if (!jsonImportFeedback) return;
        jsonImportFeedback.textContent = message;
        jsonImportFeedback.classList.remove("hidden", "text-red-700", "text-green-800", "text-gray-700");
        if (tone === "ok") jsonImportFeedback.classList.add("text-green-800");
        else if (tone === "muted") jsonImportFeedback.classList.add("text-gray-700");
        else jsonImportFeedback.classList.add("text-red-700");
        jsonImportFeedback.classList.remove("hidden");
      }

      function hideJsonFeedback() {
        jsonImportFeedback?.classList.add("hidden");
        if (jsonImportFeedback) jsonImportFeedback.textContent = "";
      }

      function assertDraftRunnable(draft) {
        const parsedHot = parseFloat(draft.hotTemp);
        const parsedCold = parseFloat(draft.coldTemp);
        if (!Number.isFinite(parsedHot) || !Number.isFinite(parsedCold)) {
          throw new Error("Hot and cold sides must be valid numbers.");
        }
        for (let i = 0; i < draft.layers.length; i++) {
          const layer = draft.layers[i];
          const thicknessNum = parseFloat(layer.thickness);
          if (!Number.isFinite(thicknessNum) || thicknessNum <= 0) {
            throw new Error(`Layer ${i + 1}: thickness must be a positive number.`);
          }
          const k = parseFloat(layer.conductivity);
          if (!Number.isFinite(k) || k <= 0) {
            throw new Error(`Layer ${i + 1}: k must be a positive number.`);
          }
        }
      }

      function applyDraftToForm(draft) {
        if (hotEl) hotEl.value = draft.hotTemp;
        if (coldEl) coldEl.value = draft.coldTemp;
        if (layersEl) {
          layersEl.innerHTML = draft.layers
            .map((layer, index) => renderLayerRow(layer, index, draft.layers.length))
            .join("");
        }
        try {
          if (window.lucide?.createIcons) window.lucide.createIcons();
        } catch {
          // ignore icon rendering failures
        }
      }

      jsonImportBtn?.addEventListener("click", () => {
        hideJsonFeedback();
        jsonImportInput?.click();
      });

      jsonExampleBtn?.addEventListener("click", () => {
        hideJsonFeedback();
        const blob = buildExampleJsonBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "thermal-input-example.json";
        a.rel = "noopener";
        a.click();
        URL.revokeObjectURL(url);
        setJsonFeedback('Downloaded "thermal-input-example.json". Edit and use Load from JSON.', "muted");
      });

      jsonImportInput?.addEventListener("change", () => {
        const file = jsonImportInput.files?.[0];
        jsonImportInput.value = "";
        if (!file) return;

        if (file.size > MAX_JSON_IMPORT_BYTES) {
          setJsonFeedback(`File is too large (max ${Math.round(MAX_JSON_IMPORT_BYTES / 1024)} KB).`, "err");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const text = String(reader.result ?? "");
            const draft = parseImportedJsonText(text);
            assertDraftRunnable(draft);
            applyDraftToForm(draft);
            schedulePersistDraft(readCurrentDraft());
            refreshDerived();
            setJsonFeedback("Loaded inputs from JSON.", "ok");
          } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to import JSON.";
            setJsonFeedback(msg, "err");
          }
        };
        reader.onerror = () => setJsonFeedback("Could not read the file.", "err");
        reader.readAsText(file);
      });

      function readCurrentDraft() {
        const draft = {
          hotTemp: String(hotEl?.value ?? ""),
          coldTemp: String(coldEl?.value ?? ""),
          layers: Array.from(layersEl.querySelectorAll("[data-layer-row]")).map((row) => {
            const id = row.getAttribute("data-layer-id") || uid();
            const thickness = row.querySelector("[data-field='thickness']")?.value ?? "";
            const conductivity = row.querySelector("[data-field='conductivity']")?.value ?? "";
            const unit = row.querySelector("[data-field='unit']")?.value ?? "cm";
            return { id, thickness, conductivity, unit };
          }),
        };
        return draft;
      }

      function refreshDerived() {
        const draft = readCurrentDraft();
        const totalCm = totalThicknessCm(draft.layers);
        const tempDiff = (parseFloat(draft.hotTemp) || 0) - (parseFloat(draft.coldTemp) || 0);

        document.getElementById("deltaT").textContent = `${tempDiff.toFixed(1)}°C`;
        document.getElementById("layerCount").textContent = String(draft.layers.length);
        document.getElementById("totalThickness").textContent = `${totalCm.toFixed(1)} cm`;
        document.getElementById("summaryThickness").textContent = `${totalCm.toFixed(1)} cm`;
        document.getElementById("summaryDeltaT").textContent = `${tempDiff.toFixed(1)}°C`;
        document.getElementById("summaryLayers").textContent = String(draft.layers.length);
      }

      function saveDraft() {
        const draft = readCurrentDraft();
        schedulePersistDraft(draft);
        refreshDerived();
      }

      hotEl?.addEventListener("input", saveDraft);
      coldEl?.addEventListener("input", saveDraft);

      layersEl?.addEventListener("input", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.matches("input") || target.matches("select")) saveDraft();
      });

      layersEl?.addEventListener("click", (e) => {
        const target = e.target;
        const btn = target?.closest?.("[data-action='remove-layer']");
        if (!btn) return;
        const row = btn.closest("[data-layer-row]");
        if (!row) return;
        if (layersEl.querySelectorAll("[data-layer-row]").length <= 1) return;
        row.remove();
        saveDraft();
      });

      addBtn?.addEventListener("click", () => {
        const idx = layersEl.querySelectorAll("[data-layer-row]").length;
        const layer = { id: uid(), thickness: "", conductivity: "", unit: "cm" };
        const wrapper = document.createElement("div");
        wrapper.innerHTML = renderLayerRow(layer, idx, idx + 1);
        layersEl.appendChild(wrapper.firstElementChild);
        saveDraft();
      });

      runBtn?.addEventListener("click", () => {
        const draft = readCurrentDraft();
        const parsedHot = parseFloat(draft.hotTemp);
        const parsedCold = parseFloat(draft.coldTemp);
        if (!Number.isFinite(parsedHot) || !Number.isFinite(parsedCold)) {
          alert("Please enter valid temperatures");
          return;
        }

        const processed = [];
        for (const layer of draft.layers) {
          const thicknessNum = parseFloat(layer.thickness);
          if (!Number.isFinite(thicknessNum) || thicknessNum <= 0) {
            alert("Invalid layer thickness");
            return;
          }
          const thicknessM = layer.unit === "mm" ? thicknessNum / 1000 : thicknessNum / 100;
          const k = parseFloat(layer.conductivity);
          if (!Number.isFinite(k) || k <= 0) {
            alert("Invalid thermal conductivity");
            return;
          }
          processed.push({ thickness: thicknessM, k });
        }

        if (!processed.length) {
          alert("At least one valid layer required");
          return;
        }

        const params = {
          layers: processed,
          boundary: { T_left: parsedHot, T_inf: parsedCold, h: 10 },
          area: 1,
          totalThickness: processed.reduce((s, l) => s + l.thickness, 0),
        };

        sessionStorage.setItem(PARAMS_KEY, JSON.stringify(params));
        navigate("/simulation");
      });

      // initial persist/derived refresh
      saveDraft();
    },
  };
}

function renderLayerRow(layer, index, layerCount) {
  const colorClass = getLayerColor(index);
  const pos = index === 0 ? "Hot" : index === layerCount - 1 ? "Cold" : "Middle";
  const [grad, border, text] = colorClass.split(" ");

  const showRemove = layerCount > 1;
  return `
    <div data-layer-row data-layer-id="${escapeHtml(layer.id)}" class="p-4 bg-gradient-to-r ${grad} rounded-lg border ${border}">
      <div class="flex items-center justify-between mb-3">
        <div class="${text}">Layer ${index + 1} (${pos})</div>
        ${
          showRemove
            ? `<button data-action="remove-layer" class="${buttonClass({
                variant: "ghost",
                size: "sm",
                className: "h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600",
              })}">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>`
            : ""
        }
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] gap-4 items-end">
        <div>
          <label class="text-sm text-gray-700 mb-2 block">Thickness</label>
          <input
            data-field="thickness"
            type="number"
            placeholder="${layer.unit === "mm" ? "e.g. 5–500" : "e.g. 1–50"}"
            class="${inputClass} h-11 text-base w-full"
            value="${escapeHtml(layer.thickness)}"
          />
        </div>

        <div>
          <label class="text-sm text-gray-700 mb-2 block">Unit</label>
          <select data-field="unit" class="${inputClass} h-11 text-base w-full">
            <option value="cm" ${layer.unit === "cm" ? "selected" : ""}>cm</option>
            <option value="mm" ${layer.unit === "mm" ? "selected" : ""}>mm</option>
          </select>
        </div>

        <div>
          <label class="text-sm text-gray-700 mb-2 block">k (W/m·K)</label>
          <input
            data-field="conductivity"
            type="number"
            placeholder="e.g. 0.02–2.0"
            class="${inputClass} h-11 text-base w-full"
            value="${escapeHtml(layer.conductivity)}"
          />
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

