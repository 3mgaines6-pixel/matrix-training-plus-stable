/****************************
 * MATRIX TRAINING PLUS
 * apps.js (separate file)
 ****************************/

/* ===== STORAGE KEYS ===== */
const HISTORY_KEY = "mtp-history-v1";
const WEIGHT_KEY  = "mtp-user-weights";
const CARDIO_KEY  = "mtp-cardio-v1";
const META_KEY    = "mtp-meta-v1";

/* ===== LOAD STORAGE ===== */
const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};
const userWeights = JSON.parse(localStorage.getItem(WEIGHT_KEY)) || {};
const cardio = JSON.parse(localStorage.getItem(CARDIO_KEY)) || {};
const meta = JSON.parse(localStorage.getItem(META_KEY)) || { weekIndex: 0, weekStart: Date.now() };

/* ===== SAVE HELPERS ===== */
const save = (k,v)=>localStorage.setItem(k,JSON.stringify(v));
const saveHistory=()=>save(HISTORY_KEY,history);
const saveWeights=()=>save(WEIGHT_KEY,userWeights);
const saveCardio=()=>save(CARDIO_KEY,cardio);
const saveMeta=()=>save(META_KEY,meta);

/* ===== RULES ===== */
const RULES = {
  HEAVY:{sets:3,reps:"6–8",top:8,tempo:"3–1–2",step:5},
  LIGHT:{sets:3,reps:"10–12",top:12,tempo:"2–1–2",step:2.5},
  CORE:{sets:2,reps:"12–15",top:15,tempo:"2–2–2",step:2.5}
};

/* ===== MACHINE MAP ===== */
const M = {
  PRESS: { id: 'PRESS', number: '15', label: '#15 LEG PRESS' },
  SLC:   { id: 'SLC',   number: '12', label: '#12 SEATED LEG CURL' },
  CURL:  { id: 'CURL',  number: '1',  label: '#1 DEPENDENT CURL' },
  TRI:   { id: 'TRI',   number: '2',  label: '#2 TRICEPS PRESS' },
  ABS:   { id: 'ABS',   number: '3',  label: '#3 ABD CRUNCH' },
  BACK:  { id: 'BACK',  number: '4',  label: '#4 BACK EXTENSION' },
  ROW:   { id: 'ROW',   number: '5',  label: '#5 SEATED ROW' },
  SH:    { id: 'SH',    number: '6',  label: '#6 SHOULDER PRESS' },
  CHEST: { id: 'CHEST', number: '7',  label: '#7 CHEST PRESS' },
  LAT:   { id: 'LAT',   number: '8',  label: '#8 LAT PULLDOWN' },
  PEC:   { id: 'PEC',   number: '9',  label: '#9 PEC FLY / REAR DELT' },
  PLC:   { id: 'PLC',   number: '10', label: '#10 PRONE LEG CURL' },
  LEGEXT:{ id: 'LEGEXT',number: '11', label: '#11 LEG EXTENSION' },
  ADD:   { id: 'ADD',   number: '13', label: '#13 HIP ADDUCTOR' },
  ABD:   { id: 'ABD',   number: '14', label: '#14 HIP ABDUCTOR' }
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

/* ===== ROTATION PLANS ===== */
const rotationPlans = [ workouts ];

/* ===== NORMALIZE meta.weekIndex ===== */
if (Array.isArray(rotationPlans) && rotationPlans.length > 0) {
  meta.weekIndex = (typeof meta.weekIndex === 'number' && meta.weekIndex >= 0)
    ? meta.weekIndex % rotationPlans.length
    : 0;
  saveMeta();
}

/* ===== STATE ===== */
let selectedDay = "Monday";
/* ===== LIVE SET STATE (Option A) ===== */
const liveSets = {};

/* ===== HELPERS ===== */
function safeId(key){ return String(key).replace(/\W+/g,'_'); }
function el(id){ return document.getElementById(id); }
const w = m => userWeights[m] ?? 0;
const setW = (m, v) => {
  const num = parseFloat(v);
  if (Number.isNaN(num)) return;

  userWeights[m] = Math.max(0, num);
  saveWeights();
  showToast(`Weight set: ${userWeights[m]} lb`);
};

const topHit = (t, sets) => sets.every(r => r >= RULES[t].top);
const earned = (m,t) => {
  const entries = history[m] || [];
  if(entries.length < 3) return false;
  const last3 = entries.slice(0,3);
  return last3.every(e => e.sets.length === RULES[t].sets && topHit(t, e.sets));
};

/* ===== TOAST ===== */
function showToast(msg, ms=1400){
  let t = document.querySelector('.toast');
  if(!t){
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), ms);
}

/* ===== RENDER HELPERS ===== */
function renderExercise(x){
  const r = RULES[x.t] || {sets:0,reps:'',tempo:'',step:0};
  const id = x.m?.id || 'UNKNOWN';
  const sid = safeId(id);
  const wt = userWeights[id] || 0;
  const last = history[id]?.[0];
  const lastText = last ? `Last: ${last.w} · ${last.sets.join('/')}` : 'No history';
  const readyBtn = (id !== 'UNKNOWN' && earned(id,x.t)) ? `<button class="ready-btn" onclick="confirmIncrease('${id}','${x.t}')">Ready to increase +${r.step}</button>` : '';
  return `
    <div class="exercise ${x.t?.toLowerCase() || ''}">
      <div class="exercise-header">
        <div>
          <span class="badge-number">${x.m?.number ?? '?'}</span>
          <strong>${x.m?.label ?? 'Unknown machine'}</strong>
          <div class="muscle">${x.g ?? ''} • ${x.t ?? ''}</div>
        </div>
      <div class="weight">
  <button onclick="setW('${id}', ${wt - r.step})">−</button>

  <input
    type="number"
    min="0"
    step="${r.step}"
    value="${wt}"
    onblur="setW('${id}', Number(this.value))"
    onkeydown="if(event.key==='Enter'){ this.blur(); }"
    style="
      width:70px;
      text-align:center;
      font-weight:600;
    "
  /> lb

  <button onclick="setW('${id}', ${wt + r.step})">+</button>
</div>
      </div>
      <p>${r.sets} × ${r.reps} · Tempo ${r.tempo}</p>
      <p>${lastText}</p>
      ${Array.from({length:r.sets}).map((_,i)=>`Set ${i+1}: <input id="${sid}-${i}" type="number" min="0" step="1">`).join('<br>')}
      <div style="margin-top:8px">
        <button onclick="logEx('${id}','${x.t}')">Log</button>
        ${readyBtn}
      </div>
    </div>
  `;
}

/* ===== VIEWS ===== */
function renderDayView(){
  const plan = rotationPlans[meta.weekIndex] || rotationPlans[0];
  if(!plan){
    workout.innerHTML = '<section class="workout-container"><p>No workout plan found.</p></section>';
    return;
  }
  const d = plan[selectedDay];
  if(!d){
    workout.innerHTML = `<section class="workout-container"><p>No day "${selectedDay}" in current plan.</p></section>`;
    return;
  }
  workout.innerHTML = `<h1>${selectedDay} — ${d.title}</h1>${d.ex.map(x=>renderExercise(x)).join('')}`;
}

/* Cardio view */
function renderCardio(){
  workout.innerHTML = `
    <section class="cardio-panel cardio-backdrop">
      <h2>Cardio</h2>
      <p>Choose treadmill or outdoor</p>
      <div style="width:100%;max-width:420px">
        <label>Miles <input id="cardio-miles" type="number" min="0" step="0.1"></label>
        <label>Calories <input id="cardio-cal" type="number" min="0" step="1"></label>
        <label>Elev <input id="cardio-elev" type="number" min="0" step="1"></label>
        <div style="margin-top:12px">
          <button onclick="saveCardioFromPanel()">Save</button>
          <button onclick="renderTrends()">Trends</button>
        </div>
      </div>
    </section>`;
  const c = cardio[selectedDay] || { miles:'', cal:'', elev:'' };
  if(el('cardio-miles')) el('cardio-miles').value = c.miles || '';
  if(el('cardio-cal')) el('cardio-cal').value = c.cal || '';
  if(el('cardio-elev')) el('cardio-elev').value = c.elev || '';
}

function saveCardioFromPanel(){
  const miles = + (el('cardio-miles')?.value || 0);
  const cal = + (el('cardio-cal')?.value || 0);
  const elev = + (el('cardio-elev')?.value || 0);
  cardio[selectedDay] = { miles, cal, elev };
  saveCardio();
  showToast('Cardio saved ✓');
}

/* Trends view */
function renderTrends(){
  workout.innerHTML = `
    <section class="workout-container">
      <h2>Trends</h2>
      <div class="trends-controls">
        <button class="trend-btn" onclick="drawTrend('weekly')">Weekly</button>
        <button class="trend-btn" onclick="drawTrend('monthly')">Monthly</button>
        <button class="trend-btn" onclick="drawTrend('yearly')">Yearly</button>
      </div>
      <div id="trend-canvas" style="margin-top:12px"></div>
    </section>`;
  drawTrend('weekly');
}

function drawTrend(range){
  const elc = document.getElementById('trend-canvas');
  const totalMiles = Object.values(cardio).reduce((s,c)=>s + (c.miles||0),0);
  const totalCal = Object.values(cardio).reduce((s,c)=>s + (c.cal||0),0);
  if(elc) elc.innerHTML = `<p>${range} trends — Total miles: ${totalMiles} · Total calories: ${totalCal}</p>`;
}

/* Weekly summary */
function weeklySummaryHTML(){
  let days=0,mi=0,cal=0,elv=0;
  let tot={HEAVY:[0,0],LIGHT:[0,0],CORE:[0,0]};
  Object.entries(history).forEach(([m,h])=>{
    h.slice(0,7).forEach(e=>{
      const type = Object.values(rotationPlans[meta.weekIndex]).flatMap(d=>d.ex).find(x=>x.m.id===m)?.t;
      if(!type) return;
      e.sets.forEach(r=>{
        tot[type][0]++;
        if(r >= RULES[type].top) tot[type][1]++;
      });
    });
  });
  Object.values(cardio).forEach(c=>{
    if(c.miles||c.cal||c.elev) days++;
    mi += c.miles || 0;
    cal += c.cal || 0;
    elv += c.elev || 0;
  });
  const pct = t => tot[t][0] ? Math.round(tot[t][1]/tot[t][0]*100) : 0;
  return `
    <section class="workout-container">
      <h2>Weekly Summary</h2>
      <p>Days with cardio data: ${days} / 5</p>
      <p>Cardio — Miles: ${mi} · Calories: ${cal} · Elev: ${elv}</p>
      <p>Training Quality</p>
      <ul>
        <li>Heavy: ${pct("HEAVY")}% on target</li>
        <li>Light: ${pct("LIGHT")}% on target</li>
        <li>Core: ${pct("CORE")}% on target</li>
      </ul>
    </section>
  `;
}

function renderWeeklySummary(){
  workout.innerHTML = weeklySummaryHTML();
}

/* ===== LOGGING ===== */
function logEx(m,t){
  const r = RULES[t];
  const sets=[];
  for(let i=0;i<r.sets;i++){
    const input = document.getElementById(`${safeId(m)}-${i}`);
    sets.push(+ (input?.value || 0));
  }
  history[m] = history[m] || [];
  history[m].unshift({ d: Date.now(), w: w(m), sets });
  history[m] = history[m].slice(0,50);
  saveHistory();
  showToast('Logged ✓');
  render();
}

/* ===== PROGRESSION ===== */
function confirmIncrease(id,type){
  const last3 = (history[id]||[]).slice(0,3).map(h=>h.sets.join('/')).join(' | ');
  const step = RULES[type].step;
  const ok = confirm(`Last 3 sessions: ${last3}\nIncrease weight by ${step}?`);
  if(ok){
    setW(id, (userWeights[id]||0) + step);
    showToast('Weight increased ✓');
  }
}

/* ===== AUTO ROTATION ===== */
function checkAutoRotate(weeksToRotate = 4){
  const now = Date.now();
  const weeksElapsed = Math.floor((now - meta.weekStart) / (7*24*60*60*1000));
  if(weeksElapsed >= weeksToRotate){
    meta.weekStart = now;
    meta.weekIndex = (meta.weekIndex + 1) % rotationPlans.length;
    saveMeta();
    showToast('Program rotated for the next block ✓');
    render();
  }
}

/* ===== ROUTER ===== */
function selectDay(d){
  selectedDay = d;
  if(Array.isArray(dayButtons)) dayButtons.forEach(b=>b.classList.toggle('active', b.dataset.day === d));
  render();
}

function render(){
  if(!workout){
    console.error('MATRIX DEBUG: #workout element not found.');
    return;
  }
  renderDayView();
}

/* ===== INIT ===== */
let workout, dayButtons;
document.addEventListener('DOMContentLoaded', ()=>{
  workout = el('workout');
  dayButtons = Array.from(document.querySelectorAll('.day-btn'));

  // attach fallback listeners in case inline onclicks are not used
  const bCardio = el('btn-cardio');
  const bTrends = el('btn-trends');
  const bSummary = el('btn-summary');
  if(bCardio) bCardio.onclick = ()=>renderCardio();
  if(bTrends) bTrends.onclick = ()=>renderTrends();
  if(bSummary) bSummary.onclick = ()=>renderWeeklySummary();

  // set active day button
  dayButtons.forEach(b=>b.classList.toggle('active', b.dataset.day === selectedDay));

  checkAutoRotate(4);
  render();
  
});
