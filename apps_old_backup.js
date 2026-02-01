// apps.js
// Matrix Training Plus – upgraded with per‑set weights, rolling 7‑day summary,
// top‑reps + top‑weights, and adaptive top‑weight logic (W3).

// -----------------------------
// Global state and configuration
// -----------------------------

// Example RULES – adjust to match your actual app if needed
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
  return h[0]; // assuming newest first
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

// This should be wired to your set/weight input fields.
// For example, you might have inputs like:
//   reps input:  <input id="setReps">
//   weight input:<input id="setWeight">
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
  // newest first
  h.unshift(entry);

  // clear current
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

// Example progression logic – adjust as needed
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

  // Reps: did you hit top reps on all sets in the last session?
  const repsTop = last.sets.every(r => r >= rule.top);

  // Weight: did your max weight increase vs previous session?
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
// Weekly Summary (Step 7)
// -----------------------------
//
// Option C: show both top‑reps and top‑weights
// W3: top‑weight = last session’s max weight for that machine
// D1: rolling 7‑day window

function weeklySummaryHTML() {
  const now = nowMs();
  const cutoff = now - daysToMs(7);

  // tot[type] = [ totalSets, topRepsSets, topWeightSets ]
  const tot = {
    HEAVY: [0, 0, 0],
    LIGHT: [0, 0, 0],
    CORE:  [0, 0, 0]
  };

  Object.entries(history).forEach(([machine, h]) => {
    if (!Array.isArray(h) || h.length === 0) return;

    // Determine last session's max weight for this machine (W3)
    const lastSession = h[0];
    const lastSessionMaxWeight = lastSession.weights && lastSession.weights.length
      ? Math.max(...lastSession.weights)
      : null;

    h.forEach(e => {
      if (!e || !e.type || !RULES[e.type]) return;
      if (typeof e.time !== "number") return;
      if (e.time < cutoff) return; // only last 7 days

      const type = e.type;
      const rule = RULES[type];

      e.sets.forEach((reps, idx) => {
        const weight = e.weights && e.weights[idx] != null ? e.weights[idx] : null;

        // total sets
        tot[type][0]++;

        // top reps?
        if (reps >= rule.top) {
          tot[type][1]++;
        }

        // top weight? (W3 – compare to last session max weight)
        if (lastSessionMaxWeight != null && weight != null && weight >= lastSessionMaxWeight) {
          tot[type][2]++;
        }
      });
    });
  });

  // Build HTML summary
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
/* ===== ROUTER ===== */

// currently selected day
let selectedDay = "Monday";

// collect the day buttons after DOM loads
let dayButtons = [];

// called when user clicks a day button
function selectDay(d) {
  selectedDay = d;

  if (Array.isArray(dayButtons)) {
    dayButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.day === d);
    });
  }

  render();
}

// main render function
function render() {
  if (!workout) {
    console.error("MATRIX DEBUG: #workout element not found.");
    return;
  }
  renderDayView();
}

// renders the workout for the selected day
function renderDayView() {
  const el = document.getElementById("workout");
  if (!el) return;

  // You must define your weekly workout plan here.
  // Example structure:
  const weeklyPlan = {
    Monday:   ["Chest Press", "Row", "Leg Press"],
    Tuesday:  ["Lat Pulldown", "Shoulder Press"],
    Wednesday:["Leg Curl", "Leg Extension"],
    Thursday: ["Chest Press", "Row"],
    Friday:   ["Core", "Back Extension"]
  };

  const machines = weeklyPlan[selectedDay] || [];

  el.innerHTML = `
    <h3>${selectedDay}</h3>
    <ul>
      ${machines.map(m => `<li onclick="selectMachine('${m}')">${m}</li>`).join("")}
    </ul>
  `;
}

// -----------------------------
// Initialization
// -----------------------------

function initApp() {
  // collect day buttons
  dayButtons = Array.from(document.querySelectorAll(".day-btn"));

  // highlight the default selected day
  selectDay(selectedDay);

  updateTypeUI();
  renderCurrentSets();
  renderLastForMachine();
  weeklySummaryHTML();
}




