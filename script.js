/* script.js — Easy PC demo
   Todo en vanilla JS. Contiene:
   - Lógica UI del wizard (progress, pasos, validaciones)
   - Motor simulado: "base de datos" interna de componentes y requisitos
   - Algoritmo simple para generar 3 builds: Económica, Balanceada, Potente
   - Presentación de resultados con animaciones
*/

/* ---------- Utility helpers ---------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const formatPrice = p => {
  // display price with thousands and $ sign
  return `$${p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

/* ---------- UI elements ---------- */
const fab = $('#fab');
const panel = $('#easypc-panel');
const openBtn = $('#open-easypc');
const closeBtn = $('#panel-close');
const panelCloseButton = $('#close-panel');
const restartBtn = $('#restart');
const prevBtn = $('#prev-btn');
const nextBtn = $('#next-btn');
const progressBar = $('#progress-bar');
const steps = $$('.step');
const totalSteps = steps.length;
let currentStep = 1;

/* Wizard Data store */
const wizardData = {
  use: [],
  budget: 1200,
  apps: [],
  games: [],
  resolution: '1080p',
  peripherals: 'no',
  upgrade: 'yes',
  cooling: 'air'
};

/* ---------- Sample internal DB (simulado) ---------- */
/* Each component has: id, name, category, price (USD), perf (numeric), tags */
const COMPONENTS = [
  // CPUs
  {id:'cpu-i3', name:'Intel Core i3-12100F', category:'CPU', price:120, perf:40, tags:['basic','estudio']},
  {id:'cpu-i5', name:'Intel Core i5-12400F', category:'CPU', price:200, perf:70, tags:['gaming','balanced']},
  {id:'cpu-ryzen5', name:'AMD Ryzen 5 5600X', category:'CPU', price:220, perf:85, tags:['gaming','design','balanced']},
  {id:'cpu-i7', name:'Intel Core i7-12700K', category:'CPU', price:420, perf:140, tags:['pro','workstation']},
  // GPUs
  {id:'gpu-gtx1650', name:'NVIDIA GTX 1650', category:'GPU', price:150, perf:50, tags:['basic','entry']},
  {id:'gpu-rtx3050', name:'NVIDIA RTX 3050', category:'GPU', price:250, perf:90, tags:['gaming','balanced']},
  {id:'gpu-rtx4060', name:'NVIDIA RTX 4060', category:'GPU', price:350, perf:120, tags:['gaming','pro']},
  {id:'gpu-rtx4080', name:'NVIDIA RTX 4080', category:'GPU', price:1200, perf:260, tags:['workstation','pro']},
  // RAM
  {id:'ram-8', name:'16GB DDR4 3200MHz', category:'RAM', price:45, perf:40},
  {id:'ram-16', name:'32GB DDR4 3600MHz', category:'RAM', price:90, perf:85},
  {id:'ram-32', name:'64GB DDR5 5200MHz', category:'RAM', price:260, perf:160},
  // Storage
  {id:'ssd-256', name:'SSD 500GB NVMe', category:'Storage', price:40, perf:50},
  {id:'ssd-1tb', name:'SSD 1TB NVMe', category:'Storage', price:80, perf:80},
  {id:'ssd-2tb', name:'SSD 2TB NVMe', category:'Storage', price:140, perf:130},
  // Motherboard / PSU / Case / Cooler
  {id:'mobo-basic', name:'Motherboard B660', category:'Motherboard', price:90, perf:40},
  {id:'mobo-pro', name:'Motherboard Z690', category:'Motherboard', price:210, perf:80},
  {id:'psu-550', name:'Fuente 650W 80+ Bronze', category:'PSU', price:70, perf:40},
  {id:'psu-850', name:'Fuente 850W 80+ Gold', category:'PSU', price:140, perf:80},
  {id:'case-basic', name:'Case compact', category:'Case', price:50, perf:18},
  {id:'case-prem', name:'Case premium con vidrio', category:'Case', price:110, perf:30},
  {id:'cool-air', name:'Cooler aire premium', category:'Cooler', price:35, perf:30},
  {id:'cool-liquid', name:'Enfriamiento líquido AIO 240mm', category:'Cooler', price:120, perf:80},
  // Peripherals (optional)
  {id:'monitor-24', name:'Monitor 24" 1080p 144Hz', category:'Monitor', price:160, perf:50},
  {id:'monitor-27', name:'Monitor 27" 1440p 165Hz', category:'Monitor', price:320, perf:110},
  {id:'keyboard', name:'Teclado mecánico RGB', category:'Keyboard', price:80, perf:10},
  {id:'mouse', name:'Mouse gaming 16000 dpi', category:'Mouse', price:60, perf:12},
];

/* Simulated requirements DB for games/apps (name -> perfScore) */
const REQUIREMENTS = {
  'Valorant': 40,
  'Fortnite': 55,
  'League of Legends': 30,
  'Cyberpunk 2077': 160,
  'Call of Duty': 110,
  'GTA V': 90,
  'Minecraft': 35,
  'Adobe Photoshop': 60,
  'Adobe Premiere': 100,
  'Blender': 120,
  'AutoCAD': 80
};

/* ---------- Wizard functionality ---------- */
function showPanel(){
  panel.classList.remove('hidden');
  // init
  goToStep(1);
}
function hidePanel(){
  panel.classList.add('hidden');
  // reset UI states if desired
}

fab.addEventListener('click', showPanel);
openBtn.addEventListener('click', showPanel);
closeBtn.addEventListener('click', hidePanel);
panelCloseButton.addEventListener('click', hidePanel);
restartBtn.addEventListener('click', () => {
  // reset data and UI
  resetWizard();
});

panelCloseButton.addEventListener('click', hidePanel);

/* step navigation */
function goToStep(n){
  currentStep = Math.max(1, Math.min(totalSteps, n));
  steps.forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.step,10) === currentStep);
  });
  updateProgress();
  updateNavButtons();
}
function updateProgress(){
  const pct = Math.round((currentStep-1)/(totalSteps-1) * 100);
  progressBar.style.setProperty('--w', pct + '%');
}
function updateNavButtons(){
  prevBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
  nextBtn.textContent = currentStep === totalSteps ? 'Finalizar' : 'Siguiente';
}

/* prev/next handlers with minimal validation */
prevBtn.addEventListener('click', () => goToStep(currentStep-1));
nextBtn.addEventListener('click', () => {
  if (currentStep < totalSteps) {
    // simple validation example on step 1: at least one use selected
    if (currentStep === 1){
      const checked = $$('.pill input:checked', steps[currentStep-1]);
      if (!checked.length){
        alert('Selecciona al menos una opción de uso.');
        return;
      }
    }
    goToStep(currentStep+1);
  } else {
    // finalize -> process data and show results
    collectAllData();
    generateRecommendations();
  }
});

/* ---------- Step inputs binding ---------- */
// step 1: use options (checkbox pills)
$$('.pill').forEach(p => {
  p.addEventListener('click', (ev) => {
    const input = p.querySelector('input');
    input.checked = !input.checked;
    p.classList.toggle('active', input.checked);
  });
});

// budget range
const budgetRange = $('#budget-range');
const budgetValue = $('#budget-value');
budgetRange.addEventListener('input', e => {
  const val = parseInt(e.target.value,10);
  wizardData.budget = val;
  budgetValue.textContent = formatPrice(val);
});

// apps checkboxes
$$('input[name="apps"]').forEach(cb => {
  cb.addEventListener('change', () => {
    // nothing immediate; collected later
  });
});

// game autocomplete + tag picking
const gamesList = Object.keys(REQUIREMENTS).sort();
const gameInput = $('#game-input');
const suggestions = $('#suggestions');
const gamesPicked = $('#games-picked');

gameInput.addEventListener('input', () => {
  const q = gameInput.value.trim().toLowerCase();
  if (!q){ suggestions.classList.add('hidden'); return; }
  const matches = gamesList.filter(g => g.toLowerCase().includes(q)).slice(0,6);
  suggestions.innerHTML = matches.map(m=>`<li data-val="${m}">${m}</li>`).join('');
  if (matches.length) suggestions.classList.remove('hidden');
  else suggestions.classList.add('hidden');
});
suggestions.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  addGameTag(li.dataset.val);
  gameInput.value = '';
  suggestions.classList.add('hidden');
});
function addGameTag(name){
  if (wizardData.games.includes(name)) return;
  wizardData.games.push(name);
  const el = document.createElement('div');
  el.className = 'tag';
  el.textContent = name;
  el.addEventListener('click', () => {
    wizardData.games = wizardData.games.filter(g=>g!==name);
    el.remove();
  });
  gamesPicked.appendChild(el);
}

// resolution radios
$$('input[name="resolution"]').forEach(r => {
  r.addEventListener('change', () => wizardData.resolution = r.value);
});

// peripherals chips
$$('.chip').forEach(ch => {
  ch.addEventListener('click', () => {
    const name = ch.dataset.name;
    const val = ch.dataset.value;
    // deactivate same-name chips
    $$(`.chip[data-name="${name}"]`).forEach(c => c.classList.remove('active'));
    ch.classList.add('active');
    wizardData[name] = val;
  });
});
// init chips for default values
$$('.chip[data-name="peripherals"]').forEach(c => {
  if (c.dataset.value === wizardData.peripherals) c.classList.add('active');
});
$$('.chip[data-name="upgrade"]').forEach(c => {
  if (c.dataset.value === wizardData.upgrade) c.classList.add('active');
});

// cooling radios
$$('input[name="cooling"]').forEach(r => {
  r.addEventListener('change', () => wizardData.cooling = r.value);
});

/* collect remaining form data before processing */
function collectAllData(){
  wizardData.use = $$('input[name="use"]:checked').map(i => i.value);
  wizardData.apps = $$('input[name="apps"]:checked').map(i => i.value);
  // budget is already bound
  wizardData.resolution = ($('input[name="resolution"]:checked')||{value:'1080p'}).value;
  wizardData.cooling = ($('input[name="cooling"]:checked')||{value:'air'}).value;
  // games were added through tags into wizardData.games
}

/* ---------- Recommendation engine (simple, explainable) ---------- */

/*
 Strategy:
 - Compute a target performance score:
   base from selected use-cases + max requirement from chosen games/apps + resolution factor.
 - For each tier:
   - Económica: use ~60% of budget, Balanced ~95%, Potente ~budget or up to 140% if budget <1200
   - Greedy pick: choose CPU, GPU, RAM, Storage, Motherboard, PSU, Case, Cooler.
   - Add peripherals if requested.
 - Ensure selected combination perf >= target roughly (we approximate by summing perf of CPU+GPU+RAM).
 - Provide short technical justification.
*/

function estimateTargetPerf(){
  // base from 'use' tags
  let base = 40;
  if (wizardData.use.includes('gaming')) base += 40;
  if (wizardData.use.includes('diseño')) base += 40;
  if (wizardData.use.includes('workstation')) base += 60;
  // highest requirement from games/apps chosen
  let reqMax = 0;
  wizardData.games.forEach(g => { reqMax = Math.max(reqMax, REQUIREMENTS[g] || 0) });
  wizardData.apps.forEach(a => { reqMax = Math.max(reqMax, REQUIREMENTS[a] || 0) });
  // resolution multiplier
  const resMul = wizardData.resolution === '1080p' ? 1 : wizardData.resolution === '1440p' ? 1.35 : 1.9;
  const target = Math.round(Math.max(base, reqMax) * resMul);
  return target;
}

function selectComponentsForBudget(budget){
  // Categories we must pick: CPU, GPU, RAM, Storage, Motherboard, PSU, Case, Cooler
  // Simple greedy: prioritize CPU & GPU, then RAM, storage, etc.
  const chosen = [];
  const categories = ['CPU','GPU','RAM','Storage','Motherboard','PSU','Case','Cooler'];
  let remaining = budget;

  // helper: pick best fitting component from list by performance/price ratio but under remaining
  function pickBest(cat, preferPerfMin=0){
    const candidates = COMPONENTS.filter(c => c.category===cat && c.price <= remaining);
    if (!candidates.length) return null;
    // prefer those with adequate perf, else fallback to best perf/price
    candidates.sort((a,b) => {
      const scoreA = (a.perf||10)/(a.price||1);
      const scoreB = (b.perf||10)/(b.price||1);
      return scoreB - scoreA;
    });
    // choose top that meets preferPerfMin if possible
    for (let c of candidates){
      if ((c.perf||0) >= preferPerfMin) return c;
    }
    return candidates[0];
  }

  // pick GPU and CPU first with slight preference to GPU if gaming heavy
  const targetPerf = estimateTargetPerf();
  // heuristics: if gaming selected, bias to GPU
  const gaming = wizardData.use.includes('gaming');
  // try multiple passes to pick meaningful components
  // CPU
  let cpu = pickBest('CPU', gaming ? Math.round(targetPerf*0.25) : Math.round(targetPerf*0.15));
  if (cpu){ chosen.push(cpu); remaining -= cpu.price; }
  // GPU
  let gpu = pickBest('GPU', gaming ? Math.round(targetPerf*0.4) : Math.round(targetPerf*0.2));
  if (gpu){ chosen.push(gpu); remaining -= gpu.price; }
  // RAM
  let ram = pickBest('RAM', 40);
  if (ram){ chosen.push(ram); remaining -= ram.price; }
  // Storage
  let stor = pickBest('Storage', 40);
  if (stor){ chosen.push(stor); remaining -= stor.price; }
  // Motherboard
  let mobo = pickBest('Motherboard', 30);
  if (mobo){ chosen.push(mobo); remaining -= mobo.price; }
  // PSU
  let psu = pickBest('PSU', 40);
  if (psu){ chosen.push(psu); remaining -= psu.price; }
  // Case
  let cse = pickBest('Case', 10);
  if (cse){ chosen.push(cse); remaining -= cse.price; }
  // Cooler (respect user preference)
  const coolingPref = wizardData.cooling === 'liquid' ? 'cool-liquid' : null;
  let cooler = null;
  if (coolingPref){
    cooler = COMPONENTS.find(p=>p.id===coolingPref && p.price <= remaining);
    if (!cooler) cooler = pickBest('Cooler', 20);
  } else {
    cooler = pickBest('Cooler', 10);
  }
  if (cooler){ chosen.push(cooler); remaining -= cooler.price; }

  // Add peripherals if requested
  if (wizardData.peripherals === 'yes'){
    // choose modest monitor depending on resolution
    if (wizardData.resolution==='4k'){
      const mon = COMPONENTS.find(p=>p.id==='monitor-27' && p.price <= remaining);
      if (mon){ chosen.push(mon); remaining -= mon.price; }
    } else if (wizardData.resolution==='1440p'){
      const mon = COMPONENTS.find(p=>p.id==='monitor-27' && p.price <= remaining);
      if (mon){ chosen.push(mon); remaining -= mon.price; }
    } else {
      const mon = COMPONENTS.find(p=>p.id==='monitor-24' && p.price <= remaining);
      if (mon){ chosen.push(mon); remaining -= mon.price; }
    }
    const kb = COMPONENTS.find(p=>p.id==='keyboard' && p.price <= remaining);
    if (kb){ chosen.push(kb); remaining -= kb.price; }
    const ms = COMPONENTS.find(p=>p.id==='mouse' && p.price <= remaining);
    if (ms){ chosen.push(ms); remaining -= ms.price; }
  }

  // Compute total price
  const total = chosen.reduce((s,c)=>s+(c.price||0),0);

  return {chosen, total, remaining};
}

function buildTieredRecommendations(){
  const baseBudget = wizardData.budget;
  // tiers multipliers
  const econBud = Math.max(250, Math.round(baseBudget * 0.6));
  const balBud = Math.max(350, Math.round(baseBudget * 0.95));
  const potBud = Math.max(500, Math.round(Math.min(baseBudget*1.2, baseBudget + 1500))); // allow some stretch

  const econ = selectComponentsForBudget(econBud);
  const bal = selectComponentsForBudget(balBud);
  const pot = selectComponentsForBudget(potBud);

  return [
    {slug:'econ', title:'Económica', color:'--purple-weak', budget:econBud, data:econ, note:'Ahorra sin sacrificar lo esencial — buena para trabajo de oficina y juegos ligeros.'},
    {slug:'bal', title:'Balanceada', color:'--purple-dark', budget:balBud, data:bal, note:'Equilibrio ideal entre rendimiento y costo para gaming y creación de contenido.'},
    {slug:'pot', title:'Potente', color:'--purple-dark', budget:potBud, data:pot, note:'Rendimiento alto para juegos exigentes y tareas de diseño/profesionales.'}
  ];
}

function generateRecommendations(){
  // hide wizard, show results
  $('#wizard-form').classList.add('hidden');
  const results = $('#results');
  results.classList.remove('hidden');

  const targetPerf = estimateTargetPerf();
  const recos = buildTieredRecommendations();

  const recoList = $('#reco-list');
  recoList.innerHTML = '';

  recos.forEach((r, idx) => {
    const div = document.createElement('div');
    div.className = `reco-card delay-${idx}`;
    div.innerHTML = `
      <div class="reco-title">
        <div style="width:12px;height:12px;border-radius:6px;background:linear-gradient(90deg,var(--purple-dark),var(--purple-weak));box-shadow:0 6px 18px rgba(106,13,173,0.12)"></div>
        <div>${r.title}</div>
        <div style="margin-left:auto;font-size:13px;color:var(--muted)">Presupuesto objetivo: ${formatPrice(r.budget)}</div>
      </div>
      <div class="comp-list"></div>
      <div class="justif"></div>
      <div class="reco-actions">
        <a class="btn ghost" href="#" onclick="return false">Comprar ahora</a>
        <a class="btn" href="#" onclick="return false">Agendar asesoría</a>
      </div>
    `;
    // populate components
    const compList = div.querySelector('.comp-list');
    const chosen = r.data.chosen;
    if (chosen.length === 0){
      compList.innerHTML = '<div class="muted">No se encontraron componentes dentro del presupuesto.</div>';
    } else {
      chosen.forEach(c => {
        const item = document.createElement('div');
        item.className = 'comp-item';
        item.innerHTML = `<div>${c.category} · ${c.name}</div><div class="price">${formatPrice(c.price)}</div>`;
        compList.appendChild(item);
      });
      const total = r.data.total;
      const totalRow = document.createElement('div');
      totalRow.className = 'comp-item';
      totalRow.style.borderTop = '1px solid rgba(255,255,255,0.03)';
      totalRow.style.paddingTop = '8px';
      totalRow.innerHTML = `<div style="font-weight:900">Precio total estimado</div><div class="price">${formatPrice(total)}</div>`;
      compList.appendChild(totalRow);
    }
    // justification (short)
    const justif = div.querySelector('.justif');
    // approximate perf estimate
    const cpu = chosen.find(x=>x.category==='CPU');
    const gpu = chosen.find(x=>x.category==='GPU');
    const ram = chosen.find(x=>x.category==='RAM');
    const perfEstimate = (cpu?.perf||0) + (gpu?.perf||0) + (ram?.perf||0);
    const meets = perfEstimate >= estimateTargetPerf();
    justif.innerHTML = `<strong>${meets ? 'Cumple' : 'Aproximado'} con tus necesidades.</strong> ${r.note} <div class="muted">Estimación de rendimiento: ${perfEstimate} (objetivo ~ ${estimateTargetPerf()}).</div>`;
    recoList.appendChild(div);
  });

  // show result panel animation handled by CSS
}

/* reset wizard to start over */
function resetWizard(){
  // clear tags
  $('#games-picked').innerHTML = '';
  wizardData.games = [];
  // clear selections
  $$('input[type="checkbox"]').forEach(i => i.checked = false);
  $$('input[type="radio"]').forEach(r => { /* keep defaults */ });
  // reset budget to default
  wizardData.budget = 1200;
  budgetRange.value = 1200;
  budgetValue.textContent = formatPrice(1200);
  // show wizard again
  $('#wizard-form').classList.remove('hidden');
  $('#results').classList.add('hidden');
  goToStep(1);
}

/* close result panel button */
if (panelCloseButton) panelCloseButton.addEventListener('click', hidePanel);

/* init */
(function init(){
  // set initial budget display
  budgetValue.textContent = formatPrice(budgetRange.value);
  // set some initial wizard step visibility
  goToStep(1);
  // accessibility: close panel with Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hidePanel(); });
})();
