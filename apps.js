console.log('APPS.JS LOADED');

/****************************
 * MATRIX TRAINING PLUS
 ****************************/

/* ===== STATE ===== */
let currentView = 'workout';
let selectedDay = 'Monday';
let workout, dayButtons;

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
  PRESS:{id:'PRESS',number:'15',label:'#15 LEG PRESS'},
  SLC:{id:'SLC',number:'12',label:'#12 SEATED LEG CURL'},
  CURL:{id:'CURL',number:'1',label:'#1 DEPENDENT CURL'},
  TRI:{id:'TRI',number:'2',label:'#2 TRICEPS PRESS'},
  ABS:{id:'ABS',number:'3',label:'#3 ABD CRUNCH'},
  BACK:{id:'BACK',number:'4',label:'#4 BACK EXTENSION'},
  ROW:{id:'ROW',number:'5',label:'#5 SEATED ROW'},
  SH:{id:'SH',number:'6',label:'#6 SHOULDER PRESS'},
  CHEST:{id:'CHEST',number:'7',label:'#7 CHEST PRESS'},
  LAT:{id:'LAT',number:'8',label:'#8 LAT PULLDOWN'},
  PEC:{id:'PEC',number:'9',label:'#9 PEC FLY / REAR DELT'},
  PLC:{id:'PLC',number:'10',label:'#10 PRONE LEG CURL'},
  LEGEXT:{id:'LEGEXT',number:'11',label:'#11 LEG EXTENSION'},
  ADD:{id:'ADD',number:'13',label:'#13 HIP ADDUCTOR'},
  ABD:{id:'ABD',number:'14',label:'#14 HIP ABDUCTOR'}
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

const rotationPlans = [workouts];

/* ===== HELPERS ===== */
function el(id){ return document.getElementById(id); }

/* ===== RENDER EXERCISE ===== */
function renderExercise(x){
  const r = RULES[x.t];
  const id = x.m.id;
  const wt = userWeights[id] || 0;

  return `
    <div class="exercise ${x.t.toLowerCase()}">
      <div class="exercise-header">
        <div>
          <span class="badge-number">${x.m.number}</span>
          <strong>${x.m.label}</strong>
          <div class="muscle">${x.g} • ${x.t}</div>
        </div>
        <div class="weight">
          <button onclick="setW('${id}',${wt - r.step})">−</button>
          <span>${wt} lb</span>
          <button onclick="setW('${id}',${wt + r.step})">+</button>
        </div>
      </div>
      <div class="day-rules">${r.sets} sets • ${r.reps} • Tempo ${r.tempo}</div>
    </div>
  `;
}

/* ===== WEIGHT SETTER ===== */
function setW(m,v){
  const n = Math.max(0,Number(v)||0);
  userWeights[m]=n;
  saveWeights();
  render();
}

/* ===== DAY VIEW (ONLY ONE) ===== */
function renderDayView(){
  const plan = rotationPlans[meta.weekIndex] || rotationPlans[0];
  const d = plan[selectedDay];
  if(!d){
    workout.innerHTML = `<p>No workout for ${selectedDay}</p>`;
    return;
  }
  let html = `<h1>${selectedDay} — ${d.title}</h1>`;
  html += d.ex.map(renderExercise).join('');
  workout.innerHTML = html;
}

/* ===== CARDIO ===== */
function renderCardio(){
  workout.innerHTML = `<h2>Cardio</h2>`;
}

/* ===== TRENDS ===== */
function renderTrends(){
  workout.innerHTML = `<h2>Trends</h2>`;
}

/* ===== WEEKLY ===== */
function renderWeeklySummary(){
  workout.innerHTML = `<h2>Weekly Summary</h2>`;
}

/* ===== ROUTER ===== */
function render(){
  if(!workout) return;
  if(currentView==='cardio') return renderCardio();
  if(currentView==='trends') return renderTrends();
  if(currentView==='summary') return renderWeeklySummary();
  renderDayView();
}

function selectDay(d){
  selectedDay=d;
  currentView='workout';
  dayButtons.forEach(b=>b.classList.toggle('active',b.dataset.day===d));
  render();
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded',()=>{
  workout = el('workout');
  dayButtons = Array.from(document.querySelectorAll('.day-btn'));
  dayButtons.forEach(b=>b.onclick=()=>selectDay(b.dataset.day));

  el('btn-cardio').onclick=()=>{currentView='cardio';render();};
  el('btn-trends').onclick=()=>{currentView='trends';render();};
  el('btn-summary').onclick=()=>{currentView='summary';render();};

  render();
});