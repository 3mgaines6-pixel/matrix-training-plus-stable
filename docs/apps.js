/* ============================================================
   MACHINE MAP, WORKOUTS, RULES
   ============================================================ */

const M = {
  PRESS:  { id: "PRESS",  number: 15, name: "LEG PRESS",          muscle: "Quads / Glutes" },
  SLC:    { id: "SLC",    number: 12, name: "SEATED LEG CURL",    muscle: "Hamstrings" },
  CURL:   { id: "CURL",   number: 1,  name: "DEPENDENT CURL",     muscle: "Arms" },
  TRI:    { id: "TRI",    number: 2,  name: "TRICEPS PRESS",      muscle: "Arms" },
  ABS:    { id: "ABS",    number: 3,  name: "ABD CRUNCH",         muscle: "Core" },
  BACK:   { id: "BACK",    number: 4,  name: "BACK EXTENSION",     muscle: "Lower Back" },
  ROW:    { id: "ROW",     number: 5,  name: "SEATED ROW",         muscle: "Mid Back" },
  SH:     { id: "SH",      number: 6,  name: "SHOULDER PRESS",     muscle: "Shoulders" },
  CHEST:  { id: "CHEST",   number: 7,  name: "CHEST PRESS",        muscle: "Chest" },
  LAT:    { id: "LAT",     number: 8,  name: "LAT PULLDOWN",       muscle: "Back" },
  PEC:    { id: "PEC",     number: 9,  name: "PEC FLY / REAR DELT",muscle: "Chest / Rear Delts" },
  PLC:    { id: "PLC",     number: 10, name: "PRONE LEG CURL",     muscle: "Hamstrings" },
  LEGEXT: { id: "LEGEXT",  number: 11, name: "LEG EXTENSION",      muscle: "Quads" },
  ADD:    { id: "ADD",     number: 13, name: "HIP ADDUCTOR",       muscle: "Inner Thighs" },
  ABD:    { id: "ABD",     number: 14, name: "HIP ABDUCTOR",       muscle: "Glutes" }
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
      { m: M.ABS,    t: "CORE" }
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
      { m: M.ABS,    t: "CORE" }
    ]
  },

  Thursday: {
    title: "LOWER — LIGHT / KNEE SAFE",
    ex: [
      { m: M.PRESS,  t: "LIGHT" },
      { m: M.SLC,    t: "LIGHT" },
      { m: M.ADD,    t: "LIGHT" },
      { m: M.ABD,    t: "LIGHT" },
      { m: M.BACK,   t: "CORE" }
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

const RULES = {
  HEAVY: { sets: 3, bottom: 6, top: 8, increment: 5 },
  LIGHT: { sets: 3, bottom: 10, top: 12, increment: 2.5 },
  CORE:  { sets: 3, bottom: 12, top: 15, increment: 0 }
};

/* ============================================================
   STRENGTH HISTORY
   ============================================================ */

function historyKey(machineNumber, type) {
  return `${machineNumber}_${type}`;
}

function loadHistory(machineNumber, type) {
  return JSON.parse(localStorage.getItem(historyKey(machineNumber, type)) || "[]");
}

function saveHistory(machineNumber, type, session) {
  const h = loadHistory(machineNumber, type);
  h.push(session);
  localStorage.setItem(historyKey(machineNumber, type), JSON.stringify(h));
}

function getLastSession(machineNumber, type) {
  const h = loadHistory(machineNumber, type);
  return h.length ? h[h.length - 1] : null;
}

function formatSession(session) {
  const base = session.sets.map(s => `${s.reps}@${s.weight}`).join(", ");
  return session.handle ? `${base} (${session.handle})` : base;
}

/* ============================================================
   CARDIO HISTORY
   ============================================================ */

function loadCardio() {
  return JSON.parse(localStorage.getItem("cardioHistory") || "[]");
}

function saveCardio(entry) {
  const h = loadCardio();
  h.push(entry);
  localStorage.setItem("cardioHistory", JSON.stringify(h));
}
/* ============================================================
   DAY SELECTOR + RENDERING
   ============================================================ */

let selectedDay = localStorage.getItem("selectedDay") || "Monday";

function render() {
  renderDayHeader();
  renderExerciseList();
  updateDayButtons();
}

function renderDayHeader() {
  const day = workouts[selectedDay];
  const titleEl = document.getElementById("day-title");
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
  const container = document.getElementById("exercise-list");
  if (!container) return;

  const day = workouts[selectedDay];
  if (!day) {
    container.innerHTML = "<p>No workout found.</p>";
    return;
  }

  container.innerHTML = "";

  day.ex.forEach(ex => {
    const machine = ex.m;
    const type = ex.t;
    const rule = RULES[type];

    const row = document.createElement("button");
    row.className = "exercise-row";
    row.dataset.machine = machine.number;
    row.dataset.type = type;

    row.innerHTML = `
      <div class="ex-title">#${machine.number} ${machine.name}</div>
      <div class="ex-sub">${machine.muscle} • ${type} • ${rule.sets}×${rule.bottom}–${rule.top}</div>
    `;

    row.addEventListener("click", () => openDrawer(machine.number, type));
    container.appendChild(row);
  });
}

/* ============================================================
   DRAWER SYSTEM (STRENGTH)
   ============================================================ */

let drawerMachine = null;
let drawerType = null;
let tempoOpen = false;
let restTimerId = null;
let restSeconds = 0;

function getSuggestedWeight(machineNumber, type) {
  const history = loadHistory(machineNumber, type);
  if (!history.length) return null;

  const last = history[history.length - 1];
  const lastSet = last.sets[last.sets.length - 1];
  const rule = RULES[type];

  return lastSet.reps >= rule.top
    ? lastSet.weight + rule.increment
    : lastSet.weight;
}

function openDrawer(machineNumber, type) {
  drawerMachine = machineNumber;
  drawerType = type;

  const machine = machineByNumber[machineNumber];
  const rule = RULES[type];

  document.getElementById("drawer-machine-name").textContent =
    `#${machine.number} ${machine.name}`;

  document.getElementById("drawer-machine-meta").textContent =
    `${machine.muscle} • ${type} • ${rule.sets}×${rule.bottom}–${rule.top}`;

  // Tempo reset
  tempoOpen = false;
  document.getElementById("tempo-label").textContent = "Tempo ▸";
  document.getElementById("tempo-value").classList.add("hidden");

  // Tempo value
  let t = "—";
  if (type === "HEAVY") t = "3-1-2";
  if (type === "LIGHT") t = "2-1-2";
  if (type === "CORE")  t = "2-2-2";
  document.getElementById("tempo-value").textContent = t;

  // Last session
  const last = getLastSession(machineNumber, type);
  document.getElementById("last-session-value").textContent =
    last ? formatSession(last) : "None";

  // Suggested weight
  const suggested = getSuggestedWeight(machineNumber, type);
  document.getElementById("suggested-weight-value").textContent =
    suggested ? `${suggested} lb` : "—";

  // Reset inputs
  document.querySelectorAll(".reps-input").forEach(i => i.value = "");
  document.querySelectorAll(".weight-input").forEach(i => i.value = suggested || "");

  // Handle toggle (only machines 2 and 6)
  const toggle = document.getElementById("handle-toggle");
  if (machineNumber === 2 || machineNumber === 6) {
    toggle.classList.remove("hidden");
  } else {
    toggle.classList.add("hidden");
  }
  document.querySelector('input[name="handle-pos"][value="inner"]').checked = true;

  // Open drawer
  document.getElementById("drawer").classList.add("open");
  document.getElementById("overlay").classList.add("visible");
}

function closeDrawer() {
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("visible");

  drawerMachine = null;
  drawerType = null;

  tempoOpen = false;
  document.getElementById("tempo-label").textContent = "Tempo ▸";
  document.getElementById("tempo-value").classList.add("hidden");

  render();
}

function toggleTempo() {
  tempoOpen = !tempoOpen;
  document.getElementById("tempo-label").textContent =
    tempoOpen ? "Tempo ▾" : "Tempo ▸";
  document.getElementById("tempo-value").classList.toggle("hidden");
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
  document.getElementById("timer-display").textContent = `${m}:${s}`;
}

function logExercise() {
  if (!drawerMachine || !drawerType) return;

  const repsInputs = [...document.querySelectorAll(".reps-input")];
  const weightInputs = [...document.querySelectorAll(".weight-input")];

  const sets = [];

  for (let i = 0; i < repsInputs.length; i++) {
    const reps = parseInt(repsInputs[i].value, 10);
    const weight = parseFloat(weightInputs[i].value);

    if (Number.isFinite(reps) && Number.isFinite(weight)) {
      sets.push({ reps, weight });
    }
  }

  if (!sets.length) {
    alert("Enter at least one set.");
    return;
  }

  // Handle position (only for machines 2 and 6)
  const handle =
    document.querySelector('input[name="handle-pos"]:checked')?.value || "inner";

  const session = {
    time: Date.now(),
    sets,
    handle
  };

  saveHistory(drawerMachine, drawerType, session);

  closeDrawer();
}
/* ============================================================
   CARDIO DRAWER + LOGGING
   ============================================================ */

function openCardioDrawer() {
  document.getElementById("cardio-drawer").classList.remove("hidden");
  document.getElementById("overlay").classList.add("visible");
}

function closeCardioDrawer() {
  document.getElementById("cardio-drawer").classList.add("hidden");
  document.getElementById("overlay").classList.remove("visible");
}

function logCardio() {
  const minutes = parseInt(document.getElementById("cardio-minutes").value, 10);
  const miles = parseFloat(document.getElementById("cardio-miles").value);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    alert("Enter minutes.");
    return;
  }

  const entry = {
    time: Date.now(),
    minutes,
    miles: Number.isFinite(miles) ? miles : 0
  };

  saveCardio(entry);
  closeCardioDrawer();
  renderWeeklySummary();
}

/* ============================================================
   WEEKLY SUMMARY (STRENGTH + CARDIO)
   ============================================================ */

function renderWeeklySummary() {
  const now = Date.now();
  const cutoff = now - (7 * 24 * 60 * 60 * 1000);

  const totals = {
    HEAVY: { sets: 0, topReps: 0, topWeight: 0 },
    LIGHT: { sets: 0, topReps: 0, topWeight: 0 },
    CORE:  { sets: 0, topReps: 0, topWeight: 0 }
  };

  // Strength summary
  Object.values(M).forEach(machine => {
    ["HEAVY", "LIGHT", "CORE"].forEach(type => {
      const h = loadHistory(machine.number, type);
      if (!h.length) return;

      const rule = RULES[type];
      const lastMax = Math.max(...h[h.length - 1].sets.map(s => s.weight));

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

  // Cardio summary
  const cardio = loadCardio().filter(e => e.time >= cutoff);
  const totalMinutes = cardio.reduce((a, c) => a + c.minutes, 0);
  const totalMiles = cardio.reduce((a, c) => a + c.miles, 0);

  el.innerHTML += `
    <h3>Cardio (Last 7 Days)</h3>
    <table>
      <tr><th>Sessions</th><th>Minutes</th><th>Miles</th></tr>
      <tr><td>${cardio.length}</td><td>${totalMinutes}</td><td>${totalMiles.toFixed(2)}</td></tr>
    </table>
  `;
}
/* ============================================================
   INIT + LISTENERS
   ============================================================ */

function getTodayWorkoutDay() {
  const jsDay = new Date().getDay();
  const map = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday" };
  return map[jsDay] || null;
}

function initApp() {
  const saved = localStorage.getItem("selectedDay");
  if (saved) {
    selectedDay = saved;
  } else {
    const today = getTodayWorkoutDay();
    if (today) selectedDay = today;
  }

  attachDayButtons();
  attachDrawerListeners();
  attachBottomNav();

  // Ensure drawers start closed
  document.getElementById("drawer").classList.remove("open");
  document.getElementById("cardio-drawer").classList.add("hidden");
  document.getElementById("overlay").classList.remove("visible");

  render();
  renderWeeklySummary();
}

/* ============================================================
   DAY BUTTON LISTENERS
   ============================================================ */

function attachDayButtons() {
  document.querySelectorAll(".day-button").forEach(btn => {
    if (!btn.__attached) {
      btn.addEventListener("click", () => selectDay(btn.dataset.day));
      btn.__attached = true;
    }
  });
  updateDayButtons();
}

function updateDayButtons() {
  document.querySelectorAll(".day-button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.day === selectedDay);
  });
}

/* ============================================================
   DRAWER + CARDIO LISTENERS
   ============================================================ */

function attachDrawerListeners() {
  if (attachDrawerListeners._attached) return;
  attachDrawerListeners._attached = true;

  document.addEventListener("click", e => {
    const t = e.target;

    // Strength drawer close
    if (t.closest("#close-drawer")) return closeDrawer();
    if (t.closest("#overlay") && document.getElementById("drawer").classList.contains("open"))
      return closeDrawer();

    // Tempo toggle
    if (t.closest("#tempo-toggle")) return toggleTempo();

    // Rest timer
    if (t.closest("#start-timer")) return startRestTimer();

    // Log strength
    if (t.closest("#log-button")) return logExercise();

    // Cardio drawer close
    if (t.closest("#cardio-close")) return closeCardioDrawer();
  });

  // Cardio log button
  document.getElementById("cardio-log-button").addEventListener("click", logCardio);
}

/* ============================================================
   BOTTOM NAV LISTENERS (Cardio, Trends, Weekly)
   ============================================================ */

function attachBottomNav() {
  const cardioBtn = document.getElementById("nav-cardio");
  const trendsBtn = document.querySelector("nav button:nth-child(2)");
  const weeklyBtn = document.querySelector("nav button:nth-child(3)");

  // Cardio drawer
  cardioBtn.addEventListener("click", () => {
    openCardioDrawer();
  });

  // Trends placeholder (simple alert for now)
  trendsBtn.addEventListener("click", () => {
    alert("Trends screen coming soon.");
  });

  // Weekly scroll-to-summary
  weeklyBtn.addEventListener("click", () => {
    document.getElementById("weeklySummary").scrollIntoView({ behavior: "smooth" });
  });
}

/* ============================================================
   START APP
   ============================================================ */

document.addEventListener("DOMContentLoaded", initApp);

