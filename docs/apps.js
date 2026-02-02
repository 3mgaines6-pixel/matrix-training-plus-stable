/* ============================================================
   MACHINE MAP — NUMBER-FIRST LOOKUP
   ============================================================ */

const M = {
  PRESS:  { id: "PRESS",  number: 15, name: "LEG PRESS",          muscle: "Quads / Glutes" },
  SLC:    { id: "SLC",    number: 12, name: "SEATED LEG CURL",    muscle: "Hamstrings" },
  CURL:   { id: "CURL",   number: 1,  name: "DEPENDENT CURL",     muscle: "Arms" },
  TRI:    { id: "TRI",    number: 2,  name: "TRICEPS PRESS",      muscle: "Arms" },
  ABS:    { id: "ABS",    number: 3,  name: "ABD CRUNCH",         muscle: "Core" },
  BACK:   { id: "BACK",   number: 4,  name: "BACK EXTENSION",     muscle: "Lower Back" },
  ROW:    { id: "ROW",    number: 5,  name: "SEATED ROW",         muscle: "Mid Back" },
  SH:     { id: "SH",     number: 6,  name: "SHOULDER PRESS",     muscle: "Shoulders" },
  CHEST:  { id: "CHEST",  number: 7,  name: "CHEST PRESS",        muscle: "Chest" },
  LAT:    { id: "LAT",    number: 8,  name: "LAT PULLDOWN",       muscle: "Back" },
  PEC:    { id: "PEC",    number: 9,  name: "PEC FLY / REAR DELT",muscle: "Chest / Rear Delts" },
  PLC:    { id: "PLC",    number: 10, name: "PRONE LEG CURL",     muscle: "Hamstrings" },
  LEGEXT: { id: "LEGEXT", number: 11, name: "LEG EXTENSION",      muscle: "Quads" },
  ADD:    { id: "ADD",    number: 13, name: "HIP ADDUCTOR",       muscle: "Inner Thighs" },
  ABD:    { id: "ABD",    number: 14, name: "HIP ABDUCTOR",       muscle: "Glutes" }
};

/* Build reverse lookup: number → machine object */
const machineByNumber = {};
Object.values(M).forEach(m => machineByNumber[m.number] = m);


/* ============================================================
   WORKOUT PLAN — USING MACHINE OBJECTS
   ============================================================ */

const workouts = {
  Monday: {
    title: "LOWER — HEAVY",
    ex: [
      { m: M.PRESS,  t: "HEAVY" },
      { m: M.SLC,    t: "LIGHT" },
      { m: M.ADD,    t: "LIGHT" },
      { m: M.ABD,    t: "LIGHT" },
      { m: M.ABS,    t: "CORE"  }
    ]
  },

  Tuesday: {
    title: "UPPER — HEAVY + LIGHT",
    ex: [
      { m: M.CHEST,  t: "HEAVY" },
      { m: M.LAT,    t: "HEAVY" },
      { m: M.ROW,    t: "LIGHT" },
      { m: M.SH,     t: "LIGHT" },
      { m: M.TRI,    t: "LIGHT" }
    ]
  },

  Wednesday: {
    title: "FULL BODY",
    ex: [
      { m: M.PRESS,  t: "HEAVY" },
      { m: M.CHEST,  t: "HEAVY" },
      { m: M.ROW,    t: "LIGHT" },
      { m: M.ABD,    t: "LIGHT" },
      { m: M.ABS,    t: "CORE"  }
    ]
  },

  Thursday: {
    title: "LOWER — LIGHT / KNEE SAFE",
    ex: [
      { m: M.PRESS,  t: "LIGHT" },
      { m: M.SLC,    t: "LIGHT" },
      { m: M.ADD,    t: "LIGHT" },
      { m: M.ABD,    t: "LIGHT" },
      { m: M.BACK,   t: "CORE"  }
    ]
  },

  Friday: {
    title: "UPPER — LIGHT / PUMP",
    ex: [
      { m: M.ROW,    t: "LIGHT" },
      { m: M.SH,     t: "LIGHT" },
      { m: M.PEC,    t: "LIGHT" },
      { m: M.TRI,    t: "LIGHT" },
      { m: M.CURL,   t: "LIGHT" }
    ]
  }
};


/* ============================================================
   TRAINING RULES — PER TYPE
   ============================================================ */

const RULES = {
  HEAVY: { sets: 3, bottom: 6, top: 8, increment: 5 },
  LIGHT: { sets: 3, bottom: 10, top: 12, increment: 2.5 },
  CORE:  { sets: 3, bottom: 12, top: 15, increment: 0 }
};


/* ============================================================
   HISTORY SYSTEM — NUMBER-FIRST KEYS
   ============================================================ */

function historyKey(machineNumber, type) {
  return `${machineNumber}_${type}`;
}

function loadHistory(machineNumber, type) {
  const key = historyKey(machineNumber, type);
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveHistory(machineNumber, type, session) {
  const key = historyKey(machineNumber, type);
  const h = loadHistory(machineNumber, type);
  h.push(session);
  localStorage.setItem(key, JSON.stringify(h));
}


/* ============================================================
   HELPERS
   ============================================================ */

function formatSession(session) {
  return session.sets.map(s => `${s.reps}@${s.weight}`).join(", ");
}

function getLastSession(machineNumber, type) {
  const h = loadHistory(machineNumber, type);
  return h.length ? h[h.length - 1] : null;
}

function earnedProgression(machineNumber, type) {
  const h = loadHistory(machineNumber, type);
  if (h.length < 3) return false;

  const top = RULES[type].top;
  const lastThree = h.slice(-3);

  return lastThree.every(s => s.sets.every(set => set.reps >= top));
}
/* ============================================================
   SECTION 2 — DAY SELECTOR + SIMPLE EXERCISE LIST RENDERING
   ============================================================ */

let selectedDay = "Monday";

/* Render the entire screen */
function render() {
  renderDayHeader();
  renderExerciseList();
  renderBottomNav(); // optional, but keeps structure clean
}

/* ------------------------------------------------------------
   DAY HEADER
   ------------------------------------------------------------ */

function renderDayHeader() {
  const day = workouts[selectedDay];
  const titleEl = document.getElementById("day-title");

  if (day && titleEl) {
    titleEl.textContent = `${selectedDay} — ${day.title}`;
  }
}

/* ------------------------------------------------------------
   DAY SELECTOR (if you add buttons later)
   ------------------------------------------------------------ */

function selectDay(day) {
  selectedDay = day;
  render();
}

/* ------------------------------------------------------------
   EXERCISE LIST — SIMPLE ROWS
   ------------------------------------------------------------ */

function renderExerciseList() {
  const container = document.getElementById("exercise-list");
  if (!container) return;

  const day = workouts[selectedDay];
  if (!day) {
    container.innerHTML = "<p>No workout found.</p>";
    return;
  }

  container.innerHTML = ""; // clear existing

  day.ex.forEach(ex => {
    const machine = ex.m;
    const type = ex.t;
    const rule = RULES[type];

    const row = document.createElement("button");
    row.className = "exercise-row";
    row.dataset.machine = machine.number;

    row.innerHTML = `
      <div class="ex-title">#${machine.number} ${machine.name}</div>
      <div class="ex-sub">${machine.muscle} • ${type} • ${rule.sets}×${rule.bottom}–${rule.top}</div>
    `;

    row.addEventListener("click", () => {
      openDrawer(machine.number, type);
    });

    container.appendChild(row);
  });
}

/* ------------------------------------------------------------
   OPTIONAL — Bottom Navigation (static for now)
   ------------------------------------------------------------ */

function renderBottomNav() {
  // Your HTML already has static nav buttons.
  // This function is here for future V2 expansion.
}
/* ============================================================
   SECTION 3 — DRAWER SYSTEM (CORRECTED)
   ============================================================ */

let drawerMachine = null;
let drawerType = null;
let tempoOpen = false;
let restTimerId = null;
let restSeconds = 0;
function getSuggestedWeight(machineNumber, type) {
  const history = loadHistory(machineNumber, type);
  if (!history.length) return null;

  const lastSession = history[history.length - 1];
  const lastSet = lastSession.sets[lastSession.sets.length - 1];
  const lastWeight = lastSet.weight;
  const lastReps = lastSet.reps;

  const rule = RULES[type];

  if (lastReps >= rule.top) {
    return lastWeight + rule.increment;
  }

  return lastWeight;
}

/* ------------------------------------------------------------
   OPEN DRAWER
   ------------------------------------------------------------ */

function openDrawer(machineNumber, type) {
  drawerMachine = machineNumber;
  drawerType = type;

  const machine = machineByNumber[machineNumber];
  const rule = RULES[type];

  // Header
  document.getElementById("drawer-machine-name").textContent =
    `#${machine.number} ${machine.name}`;

  document.getElementById("drawer-machine-meta").textContent =
    `${machine.muscle} • ${type} • ${rule.sets}×${rule.bottom}–${rule.top}`;

  // Tempo collapsed by default
  tempoOpen = false;
  document.getElementById("tempo-label").textContent = "Tempo ▸";
  document.getElementById("tempo-value").classList.add("hidden");

  // Last session
  const last = getLastSession(machineNumber, type);
  document.getElementById("last-session-value").textContent =
    last ? formatSession(last) : "None";

  // Suggested weight
  const suggested = getSuggestedWeight(machineNumber, type);
  document.getElementById("suggested-weight-value").textContent =
    suggested ? `${suggested} lb` : "—";

  // Clear set inputs
  document.querySelectorAll(".reps-input").forEach(i => i.value = "");
  document.querySelectorAll(".weight-input").forEach(i => i.value = "");

  // Auto-fill weights if suggested exists
  if (suggested) {
    document.querySelectorAll(".weight-input").forEach(i => i.value = suggested);
  }

  // Show drawer + overlay
  document.getElementById("drawer").classList.add("open");
  document.getElementById("overlay").classList.add("visible");
}

/* ------------------------------------------------------------
   CLOSE DRAWER
   ------------------------------------------------------------ */

function closeDrawer() {
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("visible");

  drawerMachine = null;
  drawerType = null;
}

/* ------------------------------------------------------------
   TEMPO TOGGLE
   ------------------------------------------------------------ */

function toggleTempo() {
  tempoOpen = !tempoOpen;

  document.getElementById("tempo-label").textContent =
    tempoOpen ? "Tempo ▾" : "Tempo ▸";

  document.getElementById("tempo-value").classList.toggle("hidden");
}

/* ------------------------------------------------------------
   REST TIMER
   ------------------------------------------------------------ */

function startRestTimer() {
  if (restTimerId) clearInterval(restTimerId);

  restSeconds = 90;
  updateTimerDisplay();

  restTimerId = setInterval(() => {
    restSeconds--;
    updateTimerDisplay();

    if (restSeconds <= 0) {
      clearInterval(restTimerId);
      restTimerId = null;
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = String(Math.floor(restSeconds / 60)).padStart(2, "0");
  const s = String(restSeconds % 60).padStart(2, "0");
  document.getElementById("timer-display").textContent = `${m}:${s}`;
}

/* ------------------------------------------------------------
   LOGGING THE EXERCISE
   ------------------------------------------------------------ */

function logExercise() {
  if (!drawerMachine || !drawerType) return;

  const repsInputs = Array.from(document.querySelectorAll(".reps-input"));
  const weightInputs = Array.from(document.querySelectorAll(".weight-input"));

  const sets = [];

  for (let i = 0; i < repsInputs.length; i++) {
    const reps = parseInt(repsInputs[i].value, 10);
    const weight = parseFloat(weightInputs[i].value);

    if (Number.isFinite(reps) && Number.isFinite(weight)) {
      sets.push({ reps, weight });
    }
  }

  if (sets.length === 0) {
    alert("Enter at least one set.");
    return;
  }

  const session = {
    time: Date.now(),
    sets
  };

  saveHistory(drawerMachine, drawerType, session);

  closeDrawer();
  render(); // refresh list + weekly summary
}

/* ------------------------------------------------------------
   ATTACH EVENT LISTENERS INSIDE initApp()
   ------------------------------------------------------------ */

function attachDrawerListeners() {
  document.getElementById("overlay").addEventListener("click", closeDrawer);
  document.getElementById("close-drawer").addEventListener("click", closeDrawer);
  document.getElementById("tempo-toggle").addEventListener("click", toggleTempo);
  document.getElementById("start-timer").addEventListener("click", startRestTimer);
  document.getElementById("log-button").addEventListener("click", logExercise);
}

/* ============================================================
   SECTION 4 — WEEKLY SUMMARY + INIT
   ============================================================ */

/* ------------------------------------------------------------
   WEEKLY SUMMARY (rolling 7 days)
   ------------------------------------------------------------ */

function renderWeeklySummary() {
  const now = Date.now();
  const cutoff = now - (7 * 24 * 60 * 60 * 1000);

  const totals = {
    HEAVY: { sets: 0, topReps: 0, topWeight: 0 },
    LIGHT: { sets: 0, topReps: 0, topWeight: 0 },
    CORE:  { sets: 0, topReps: 0, topWeight: 0 }
  };

  Object.values(M).forEach(machine => {
    ["HEAVY", "LIGHT", "CORE"].forEach(type => {
      const h = loadHistory(machine.number, type);
      if (!h.length) return;

      const rule = RULES[type];
      const lastMax = Math.max(
        ...h[h.length - 1].sets.map(s => s.weight)
      );

      h.forEach(session => {
        if (session.time < cutoff) return;

        session.sets.forEach(set => {
          totals[type].sets++;

          if (set.reps >= rule.top) totals[type].topReps++;
          if (set.weight >= lastMax) totals[type].topWeight++;
        });
      });
    });
  });

  const el = document.getElementById("weeklySummary");
  if (!el) return;

  el.innerHTML = `
    <h3>Last 7 Days Summary</h3>
    <table>
      <tr><th>Type</th><th>Total Sets</th><th>Top Reps</th><th>Top Weight</th></tr>
      <tr><td>HEAVY</td><td>${totals.HEAVY.sets}</td><td>${totals.HEAVY.topReps}</td><td>${totals.HEAVY.topWeight}</td></tr>
      <tr><td>LIGHT</td><td>${totals.LIGHT.sets}</td><td>${totals.LIGHT.topReps}</td><td>${totals.LIGHT.topWeight}</td></tr>
      <tr><td>CORE</td><td>${totals.CORE.sets}</td><td>${totals.CORE.topReps}</td><td>${totals.CORE.topWeight}</td></tr>
    </table>
  `;
}

/* ------------------------------------------------------------
   INITIALIZATION
   ------------------------------------------------------------ */

function initApp() {
  render();
  renderWeeklySummary();

  // Attach drawer event listeners AFTER DOM is ready
  attachDrawerListeners();

  // Ensure drawer starts closed
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("visible");
}

/* Run app on load */
document.addEventListener("DOMContentLoaded", initApp);
