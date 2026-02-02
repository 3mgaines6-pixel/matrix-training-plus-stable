/* ===== MACHINE MAP (CLEAN VERSION) ===== */
const M = {
  PRESS:  { id: "PRESS",  number: 15, label: "#15 LEG PRESS" },
  SLC:    { id: "SLC",    number: 12, label: "#12 SEATED LEG CURL" },
  CURL:   { id: "CURL",   number: 1,  label: "#1 DEPENDENT CURL" },
  TRI:    { id: "TRI",    number: 2,  label: "#2 TRICEPS PRESS" },
  ABS:    { id: "ABS",    number: 3,  label: "#3 ABD CRUNCH" },
  BACK:   { id: "BACK",   number: 4,  label: "#4 BACK EXTENSION" },
  ROW:    { id: "ROW",    number: 5,  label: "#5 SEATED ROW" },
  SH:     { id: "SH",     number: 6,  label: "#6 SHOULDER PRESS" },
  CHEST:  { id: "CHEST",  number: 7,  label: "#7 CHEST PRESS" },
  LAT:    { id: "LAT",    number: 8,  label: "#8 LAT PULLDOWN" },
  PEC:    { id: "PEC",    number: 9,  label: "#9 PEC FLY / REAR DELT" },
  PLC:    { id: "PLC",    number: 10, label: "#10 PRONE LEG CURL" },
  LEGEXT: { id: "LEGEXT", number: 11, label: "#11 LEG EXTENSION" },
  ADD:    { id: "ADD",    number: 13, label: "#13 HIP ADDUCTOR" },
  ABD:    { id: "ABD",    number: 14, label: "#14 HIP ABDUCTOR" }
};

/* ===== WORKOUT PLAN ===== */
const workouts = {
  Monday:{title:"LOWER — HEAVY",ex:[
    {m:M.PRESS,g:"Quads / Glutes",t:"HEAVY"},
    {m:M.SLC,g:"Hamstrings",t:"LIGHT"},
    {m:M.ADD,g:"Inner Thighs",t:"LIGHT"},
    {m:M.ABD,g:"Glutes",t:"LIGHT"},
    {m:M.ABS,g:"Core",t:"CORE"}]},
  Tuesday:{title:"UPPER — HEAVY + LIGHT",ex:[
    {m:M.CHEST,g:"Chest",t:"HEAVY"},
    {m:M.LAT,g:"Back",t:"HEAVY"},
    {m:M.ROW,g:"Mid Back",t:"LIGHT"},
    {m:M.SH,g:"Shoulders",t:"LIGHT"},
    {m:M.TRI,g:"Arms",t:"LIGHT"}]},
  Wednesday:{title:"FULL BODY",ex:[
    {m:M.PRESS,g:"Quads / Glutes",t:"HEAVY"},
    {m:M.CHEST,g:"Chest",t:"HEAVY"},
    {m:M.ROW,g:"Back",t:"LIGHT"},
    {m:M.ABD,g:"Glutes",t:"LIGHT"},
    {m:M.ABS,g:"Core",t:"CORE"}]},
  Thursday:{title:"LOWER — LIGHT / KNEE SAFE",ex:[
    {m:M.PRESS,g:"Quads",t:"LIGHT"},
    {m:M.SLC,g:"Hamstrings",t:"LIGHT"},
    {m:M.ADD,g:"Hips",t:"LIGHT"},
    {m:M.ABD,g:"Hips",t:"LIGHT"},
    {m:M.BACK,g:"Lower Back",t:"CORE"}]},
  Friday:{title:"UPPER — LIGHT / PUMP",ex:[
    {m:M.ROW,g:"Back",t:"LIGHT"},
    {m:M.SH,g:"Shoulders",t:"LIGHT"},
    {m:M.PEC,g:"Chest / Rear Delts",t:"LIGHT"},
    {m:M.TRI,g:"Arms",t:"LIGHT"},
    {m:M.CURL,g:"Arms",t:"LIGHT"}]}
};

// -----------------------------
// Global state and configuration
// -----------------------------

const RULES = {
  HEAVY: { sets: 3, reps: 2, top: 2 },
  LIGHT: { sets: 3, reps: 15, top: 15 },
  CORE:  { sets: 3, reps: 20, top: 20 }
};

// history[machine] = [ { type, sets:[...], weights:[...], time } , ... ]
let history = {};

// current machine and type
let currentMachine = null;
let currentType = "HEAVY";

// current set reps and weights for the active log
let currentSets = [];
let currentSetWeights = [];

// -----------------------------
// Utility helpers
// -----------------------------

function $(id) {
  return document.getElementById(id);
}

function nowMs() {
  return Date.now();
}

function daysToMs(days) {
  return days * 24 * 60 * 60 * 1000;
}

// Safely get history array for a machine
function getMachineHistory(machine) {
  if (!history[machine]) history[machine] = [];
  return history[machine];
}

// Get the most recent entry for a machine, or null
function getLastEntry(machine) {
  const h = history[machine];
  if (!h || h.length === 0) return null;
  return h[0]; // newest first
}

// -----------------------------
// Machine selection and UI hooks
// -----------------------------

function selectMachine(machine) {
  currentMachine = machine;
  renderLastForMachine();
  renderHistoryForMachine();
}

// Call this when user changes type (HEAVY/LIGHT/CORE)
function setType(type) {
  if (!RULES[type]) return;
  currentType = type;
  updateTypeUI();
}

function updateTypeUI() {
  const el = $("currentType");
  if (el) el.textContent = currentType;
}

// -----------------------------
// Input handling for sets & weights
// -----------------------------

function handleSetInput() {
  const repsInput = $("setReps");
  const weightInput = $("setWeight");
  if (!repsInput || !weightInput) return;

  const reps = parseInt(repsInput.value, 10);
  const weight = parseFloat(weightInput.value);

  if (!Number.isFinite(reps) || reps <= 0) return;
  if (!Number.isFinite(weight) || weight <= 0) return;

  currentSets.push(reps);
  currentSetWeights.push(weight);

  repsInput.value = "";
  weightInput.value = "";

  renderCurrentSets();
}

function renderCurrentSets() {
  const el = $("currentSets");
  if (!el) return;
  if (currentSets.length === 0) {
    el.textContent = "No sets logged yet.";
    return;
  }
  const parts = currentSets.map((r, i) => `${r} @ ${currentSetWeights[i]}`);
  el.textContent = parts.join(", ");
}

// -----------------------------
// Logging an exercise
// -----------------------------

function logEx() {
  if (!currentMachine) {
    alert("Select a machine first.");
    return;
  }
  if (!RULES[currentType]) {
    alert("Invalid type.");
    return;
  }
  if (currentSets.length === 0 || currentSetWeights.length === 0) {
    alert("Add at least one set with reps and weight.");
    return;
  }
  if (currentSets.length !== currentSetWeights.length) {
    alert("Mismatch between sets and weights.");
    return;
  }

  const entry = {
    type: currentType,
    sets: currentSets.slice(),
    weights: currentSetWeights.slice(),
    time: nowMs()
  };

  const h = getMachineHistory(currentMachine);
  h.unshift(entry); // newest first

  currentSets = [];
  currentSetWeights = [];
  renderCurrentSets();
  renderLastForMachine();
  renderHistoryForMachine();
}

// -----------------------------
// "Last" display and progression
// -----------------------------

function renderLastForMachine() {
  const el = $("lastDisplay");
  if (!el || !currentMachine) return;

  const last = getLastEntry(currentMachine);
  if (!last) {
    el.textContent = "Last: none";
    return;
  }

  const { type, sets, weights } = last;
  const parts = sets.map((r, i) => `${r} @ ${weights[i]}`);
  el.textContent = `Last (${type}): ${parts.join(", ")}`;
}

// Returns an object describing whether you've "earned" a bump.
function earned(machine) {
  const h = getMachineHistory(machine);
  if (h.length < 2) return { reps: false, weight: false };

  const last = h[0];
  const prev = h[1];

  if (!last || !prev) return { reps: false, weight: false };
  if (last.type !== prev.type) return { reps: false, weight: false };

  const rule = RULES[last.type];
  if (!rule) return { reps: false, weight: false };

  const repsTop = last.sets.every(r => r >= rule.top);
  const lastMaxW = Math.max(...last.weights);
  const prevMaxW = Math.max(...prev.weights);
  const weightTop = lastMaxW > prevMaxW;

  return { reps: repsTop, weight: weightTop };
}

// -----------------------------
// History rendering (per machine)
// -----------------------------

function renderHistoryForMachine() {
  const el = $("historyDisplay");
  if (!el || !currentMachine) return;

  const h = getMachineHistory(currentMachine);
  if (!h.length) {
    el.textContent = "No history yet.";
    return;
  }

  const lines = h.map(e => {
    const date = new Date(e.time).toLocaleString();
    const setsStr = e.sets.map((r, i) => `${r} @ ${e.weights[i]}`).join(", ");
    return `${date} – ${e.type}: ${setsStr}`;
  });

  el.textContent = lines.join("\n");
}

// -----------------------------
// Weekly Summary (rolling 7 days)
// -----------------------------

function weeklySummaryHTML() {
  const now = nowMs();
  const cutoff = now - daysToMs(7);

  const tot = {
    HEAVY: [0, 0, 0],
    LIGHT: [0, 0, 0],
    CORE:  [0, 0, 0]
  };

  Object.entries(history).forEach(([machine, h]) => {
    if (!Array.isArray(h) || h.length === 0) return;

    const lastSession = h[0];
    const lastSessionMaxWeight = lastSession.weights && lastSession.weights.length
      ? Math.max(...lastSession.weights)
      : null;

    h.forEach(e => {
      if (!e || !e.type || !RULES[e.type]) return;
      if (typeof e.time !== "number") return;
      if (e.time < cutoff) return;

      const type = e.type;
      const rule = RULES[type];

      e.sets.forEach((reps, idx) => {
        const weight = e.weights && e.weights[idx] != null ? e.weights[idx] : null;

        tot[type][0]++;

        if (reps >= rule.top) {
          tot[type][1]++;
        }

        if (lastSessionMaxWeight != null && weight != null && weight >= lastSessionMaxWeight) {
          tot[type][2]++;
        }
      });
    });
  });

  let html = "<h3>Last 7 Days Summary</h3>";
  html += "<table>";
  html += "<tr><th>Type</th><th>Total Sets</th><th>Top Reps Sets</th><th>Top Weight Sets</th></tr>";

  ["HEAVY", "LIGHT", "CORE"].forEach(type => {
    const [total, topReps, topWeight] = tot[type];
    html += `<tr>
      <td>${type}</td>
      <td>${total}</td>
      <td>${topReps}</td>
      <td>${topWeight}</td>
    </tr>`;
  });

  html += "</table>";

  const el = $("weeklySummary");
  if (el) el.innerHTML = html;

  return html;
}

/* ============================================================
   NEW UI LAYER – CLEAN, EXPANDABLE, ONE-OPEN-AT-A-TIME
============================================================ */

// currently selected day
let selectedDay = "Monday";
// which machine card is expanded
let expandedMachine = null;
// which machines have tempo visible
let tempoVisible = {};

// main render
function render() {
  renderDaySelector();
  renderDayView();
  weeklySummaryHTML();
  updateTypeUI();
  renderCurrentSets();
}

// day selector (Mon–Fri)
function renderDaySelector() {
  const days = Object.keys(workouts);
  const el = $("daySelector");
  if (!el) return;

  el.innerHTML = days.map(day => `
    <button class="day-btn ${day === selectedDay ? "active" : ""}"
            onclick="selectDay('${day}')">
      ${day}
    </button>
  `).join("");
}

function selectDay(day) {
  selectedDay = day;
  expandedMachine = null;
  render();
}

// render all machines for the selected day
function renderDayView() {
  const container = $("workout");
  if (!container) return;

  const day = workouts[selectedDay];
  if (!day) {
    container.innerHTML = "<p>No workout found.</p>";
    return;
  }

  const blocks = day.ex.map(ex => renderMachineCard(ex)).join("");

  container.innerHTML = `
    <h2>${day.title}</h2>
    <div class="machine-list">
      ${blocks}
    </div>
  `;
}

// single machine card (collapsed or expanded)
function renderMachineCard(ex) {
  const machineId = ex.m.id;
  const info = M[machineId];
  const isOpen = expandedMachine === machineId;

  return `
    <div class="machine-card">
      <div class="machine-header" onclick="toggleMachine('${machineId}')">
        <span class="machine-label">${info.label}</span>
        <span class="arrow">${isOpen ? "▾" : "▸"}</span>
      </div>
      ${isOpen ? renderMachineBlock(ex, info) : ""}
    </div>
  `;
}

function toggleMachine(machineId) {
  expandedMachine = expandedMachine === machineId ? null : machineId;
  render();
}

// expanded machine block
function renderMachineBlock(ex, info) {
  const machineId = ex.m.id;
  const last = getLastEntry(machineId);
  const lastText = last
    ? last.sets.map((r, i) => `${r} @ ${last.weights[i]}`).join(", ")
    : "none";

  return `
    <div class="machine-expanded">
      <div class="machine-info">
        <div><strong>Muscle:</strong> ${ex.g}</div>
        <div><strong>Type:</strong> ${ex.t}</div>
        <div><strong>Reps:</strong> ${getRepScheme(ex.t)}</div>
      </div>

      <div class="tempo-toggle" onclick="toggleTempo('${machineId}')">
        Tempo ${tempoVisible[machineId] ? "▾" : "▸"}
      </div>
      ${tempoVisible[machineId] ? `<div class="tempo-details">3‑1‑2</div>` : ""}

      <div class="last-used">
        <strong>Last used:</strong> ${lastText}
      </div>

      <button class="log-select-btn" onclick="selectMachineFromUI('${machineId}')">
        Use this machine in logging panel
      </button>

      <button class="rest-btn" onclick="startRestTimer('${machineId}')">
        Start Rest Timer
      </button>
      <div id="rest-timer-${machineId}" class="rest-timer"></div>
    </div>
  `;
}

function toggleTempo(machineId) {
  tempoVisible[machineId] = !tempoVisible[machineId];
  render();
}

function getRepScheme(type) {
  if (type === "HEAVY") return "3 × 6–8";
  if (type === "LIGHT") return "3 × 10–12";
  return "3 × 12–15";
}

function startRestTimer(machineId) {
  let time = 90;
  const el = $(`rest-timer-${machineId}`);
  if (!el) return;

  clearInterval(el._timerId);

  el._timerId = setInterval(() => {
    el.textContent = `Rest: ${time}s`;
    time--;
    if (time < 0) {
      clearInterval(el._timerId);
      el.textContent = "Rest complete!";
    }
  }, 1000);
}

function selectMachineFromUI(machineId) {
  selectMachine(machineId);
}

// -----------------------------
// Initialization
// -----------------------------

function initApp() {
  render();
}

document.addEventListener("DOMContentLoaded", initApp);

