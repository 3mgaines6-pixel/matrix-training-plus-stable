/* ============================================================
   MACHINE, WORKOUTS, RULES, HISTORY, HELPERS
   (unchanged core logic)
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

const machineByNumber = {};
Object.values(M).forEach(m => machineByNumber[m.number] = m);

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
      { m: M.CHEST,  t: "LIGHT" },
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

 RULES = {
  HEAVY: { sets: 3, bottom: 6, top: 8, increment: 5 },
  LIGHT: { sets: 3, bottom: 10, top: 12, increment: 2.5 },
  CORE:  { sets: 3, bottom: 12, top: 15, increment: 0 }
};

function historyKey(machineNumber, type) {
  return `${machineNumber}_${type}`;
}

function loadHistory(machineNumber, type) {
   key = historyKey(machineNumber, type);
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveHistory(machineNumber, type, session) {
   key = historyKey(machineNumber, type);
   h = loadHistory(machineNumber, type);
  h.push(session);
  localStorage.setItem(key, JSON.stringify(h));
}

function formatSession(session) {
  return session.sets.map(s => `${s.reps}@${s.weight}`).join(", ");
}

function getLastSession(machineNumber, type) {
   h = loadHistory(machineNumber, type);
  return h.length ? h[h.length - 1] : null;
}

function earnedProgression(machineNumber, type) {
   h = loadHistory(machineNumber, type);
  if (h.length < 3) return false;

   top = RULES[type].top;
   lastThree = h.slice(-3);

  return lastThree.every(s => s.sets.every(set => set.reps >= top));
}

/* ============================================================
   SECTION 2 — DAY SELECTOR + EXERCISE LIST
   ============================================================ */

// persist selected day across reloads
let selectedDay = localStorage.getItem("selectedDay") || "Monday";

function render() {
  renderDayHeader();
  renderExerciseList();
  renderBottomNav();
  updateDayButtons();
}

function renderDayHeader() {
   day = workouts[selectedDay];
   titleEl = document.getElementById("day-title");

  if (day && titleEl) {
    titleEl.textContent = `${selectedDay} — ${day.title}`;
  }
}

function selectDay(day) {
  selectedDay = day;
  localStorage.setItem("selectedDay", selectedDay);
  render();
}

function renderExerciseList() {
   container = document.getElementById("exercise-list");
  if (!container) return;

   day = workouts[selectedDay];
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
    // defensive dataset: include both machine and type
    row.dataset.machine = machine.number;
    row.dataset.type = type;

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

function renderBottomNav() {
  // placeholder for future nav rendering
}

/* ============================================================
   SECTION 3 — DRAWER SYSTEM
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

function openDrawer(machineNumber, type) {
  drawerMachine = machineNumber;
  drawerType = type;

  const machine = machineByNumber[machineNumber];
  const rule = RULES[type];

  const nameEl = document.getElementById("drawer-machine-name");
  const metaEl = document.getElementById("drawer-machine-meta");
  const lastEl = document.getElementById("last-session-value");
  const suggestedEl = document.getElementById("suggested-weight-value");
if (nameEl) nameEl.textContent = `#${machine.number} ${machine.name}`;
if (metaEl) metaEl.textContent = `${machine.muscle} • ${type} • ${rule.sets}×${rule.bottom}–${rule.top}`;

// Reset tempo UI
tempoOpen = false;
const tempoLabel = document.getElementById("tempo-label");
const tempoValue = document.getElementById("tempo-value");
if (tempoLabel) tempoLabel.textContent = "Tempo ▸";
if (tempoValue) tempoValue.classList.add("hidden");

// ⭐ Set tempo based on training type
let t = "—";
if (type === "HEAVY") t = "3-1-2";
if (type === "LIGHT") t = "2-1-2";
if (type === "CORE")  t = "2-2-2";

if (tempoValue) tempoValue.textContent = t;

// Load last session
const last = getLastSession(machineNumber, type);
if (lastEl) lastEl.textContent = last ? formatSession(last) : "None";


  const suggested = getSuggestedWeight(machineNumber, type);
  if (suggestedEl) suggestedEl.textContent = suggested ? `${suggested} lb` : "—";

  document.querySelectorAll(".reps-input").forEach(i => i.value = "");
  document.querySelectorAll(".weight-input").forEach(i => i.value = "");

  if (suggested) {
    document.querySelectorAll(".weight-input").forEach(i => i.value = suggested);
  }

  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  if (drawer) drawer.classList.add("open");
  if (overlay) overlay.classList.add("visible");
}

function closeDrawer() {
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("visible");

  drawerMachine = null;
  drawerType = null;
}

function toggleTempo() {
  tempoOpen = !tempoOpen;

  const tempoLabel = document.getElementById("tempo-label");
  const tempoValue = document.getElementById("tempo-value");

  if (tempoLabel) tempoLabel.textContent = tempoOpen ? "Tempo ▾" : "Tempo ▸";
  if (tempoValue) tempoValue.classList.toggle("hidden");
}

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
  const el = document.getElementById("timer-display");
  if (el) el.textContent = `${m}:${s}`;
}

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
  render();
}

/* ============================================================
   SECTION 4 — LISTENERS, WEEKLY SUMMARY, INIT
   ============================================================ */
function closeDrawer() {
  drawerOpen = false;
  tempoOpen = false;

  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  const tempoLabel = document.getElementById("tempo-label");
  const tempoValue = document.getElementById("tempo-value");

  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("visible");

  if (tempoLabel) tempoLabel.textContent = "Tempo ▸";
  if (tempoValue) tempoValue.classList.add("hidden");

  if (typeof drawerMachine !== "undefined") drawerMachine = null;
  if (typeof drawerType !== "undefined") drawerType = null;

  if (typeof render === "function") render();
}


function attachDayButtons() {
  document.querySelectorAll(".day-button").forEach(btn => {
    if (!btn.__dayAttached) {
      btn.addEventListener("click", () => selectDay(btn.dataset.day || btn.textContent.trim()));
      btn.__dayAttached = true;
    }
  });
  updateDayButtons();
}

function updateDayButtons() {
  document.querySelectorAll(".day-button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.day === selectedDay);
  });
}

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

// Delegated drawer listeners (top-level)
function attachDrawerListeners() {
  if (attachDrawerListeners._attached) return;
  attachDrawerListeners._attached = true;

  document.addEventListener("click", function (e) {
    const target = e.target;

    if (target.closest && target.closest("#close-drawer")) {
      closeDrawer();
      return;
    }

    if (target.closest && target.closest("#overlay")) {
      closeDrawer();
      return;
    }

    if (target.closest && target.closest("#tempo-toggle")) {
      toggleTempo();
      return;
    }

    if (target.closest && target.closest("#start-timer")) {
      startRestTimer();
      return;
    }

    if (target.closest && target.closest("#log-button")) {
      logExercise();
      return;
    }
  });

  console.log("Drawer delegation listeners attached");
}
function getTodayWorkoutDay() {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, ...
  const map = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday"
  };
  return map[jsDay] || null;
}

// App init (top-level)
function initApp() {
  // restore saved day OR auto-select today
  const saved = localStorage.getItem("selectedDay");
  if (saved) {
    selectedDay = saved;
  } else {
    const today = getTodayWorkoutDay();
    if (today) selectedDay = today;
  }

  // Attach listeners and UI wiring
  attachDrawerListeners();
  attachDayButtons();

  // Ensure drawer starts closed
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("overlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("visible");

  render();
  renderWeeklySummary();
}


document.addEventListener("DOMContentLoaded", initApp);
