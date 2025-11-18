/* script.js — Easy PC Demo Corregido
   - Se corrigen errores de selección
   - Uso de COP en precio
   - Botones elegibles correctamente
   - Resultados full screen
   - Lógica estable y simplificada
*/

/* ---------- Helpers ---------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

// Formatear precios a pesos COP
const formatPrice = p => {
  return `$${p.toLocaleString("es-CO")}`;
};

/* ---------- UI Elements ---------- */
const panel = $('#easypc-panel');
const openBtn = $('#open-easypc');
const closeBtn = $('#panel-close');
const fab = $('#fab');
const restartBtn = $('#restart');

const prevBtn = $('#prev-btn');
const nextBtn = $('#next-btn');
const progressBar = $('#progress-bar');
const steps = $$('.step');
let currentStep = 1;

const totalSteps = steps.length;

/* ---------- Data del Wizard ---------- */
const wizardData = {
  use: [],
  budget: 2000000,  // COP por defecto
  apps: [],
  games: [],
  resolution: '1080p',
  peripherals: 'no',
  upgrade: 'yes',
  cooling: 'air'
};

/* ---------- Base de datos de componentes ---------- */
const COMPONENTS = [
  // CPU
  {id:'cpu-i3', name:'Intel Core i3-12100F', category:'CPU', price:500000, perf:40},
  {id:'cpu-i5', name:'Intel Core i5-12400F', category:'CPU', price:800000, perf:70},
  {id:'cpu-ryzen5', name:'AMD Ryzen 5 5600X', category:'CPU', price:900000, perf:85},
  {id:'cpu-i7', name:'Intel Core i7-12700K', category:'CPU', price:1700000, perf:140},

  // GPU
  {id:'gpu-1650', name:'GTX 1650', category:'GPU', price:700000, perf:50},
  {id:'gpu-3050', name:'RTX 3050', category:'GPU', price:1200000, perf:90},
  {id:'gpu-4060', name:'RTX 4060', category:'GPU', price:1800000, perf:120},
  {id:'gpu-4080', name:'RTX 4080', category:'GPU', price:5400000, perf:260},

  // RAM
  {id:'ram-16', name:'16GB DDR4', category:'RAM', price:200000, perf:40},
  {id:'ram-32', name:'32GB DDR4', category:'RAM', price:400000, perf:85},
  {id:'ram-64', name:'64GB DDR5', category:'RAM', price:950000, perf:160},

  // Storage
  {id:'ssd500', name:'SSD 500GB NVMe', category:'Storage', price:180000, perf:50},
  {id:'ssd1tb', name:'SSD 1TB NVMe', category:'Storage', price:320000, perf:80},

  // Others
  {id:'mobo-b660', name:'Motherboard B660', category:'Motherboard', price:450000, perf:40},
  {id:'psu650', name:'Fuente 650W', category:'PSU', price:250000, perf:40},
  {id:'case-basic', name:'Case básico', category:'Case', price:150000, perf:10},
  {id:'cooler-air', name:'Cooler Aire', category:'Cooler', price:120000, perf:20},
];

/* ---------- Requisitos Apps/Juegos ---------- */
const REQUIREMENTS = {
  'Valorant': 40,
  'Fortnite': 55,
  'League of Legends': 30,
  'Cyberpunk 2077': 160,
  'Call of Duty': 110,
};

/* ---------- Panel Events ---------- */
fab.onclick = showPanel;
openBtn.onclick = showPanel;
closeBtn.onclick = hidePanel;

function showPanel() {
  panel.classList.remove("hidden");
  goToStep(1);
}

function hidePanel() {
  panel.classList.add("hidden");
}

/* ---------- Wizard Navigation ---------- */
function goToStep(n) {
  currentStep = n;
  steps.forEach(s => s.classList.remove("active"));
  steps[n - 1].classList.add("active");

  updateProgress();
}

function updateProgress() {
  const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;
  progressBar.style.width = pct + "%";
}

prevBtn.onclick = () => {
  if (currentStep > 1) goToStep(currentStep - 1);
};

nextBtn.onclick = () => {
  if (currentStep === totalSteps) {
    collectAllData();
    generateRecommendations();
  } else {
    goToStep(currentStep + 1);
  }
};

/* ---------- SELECCIÓN DE PILLS (Arreglado) ---------- */
$$('.pill').forEach(pill => {
  pill.addEventListener("click", () => {
    const input = pill.querySelector("input");

    input.checked = !input.checked;
    pill.classList.toggle("active", input.checked);
  });
});

/* ---------- Presupuesto (COP) ---------- */
const budgetRange = $('#budget-range');
const budgetValue = $('#budget-value');

budgetRange.addEventListener("input", e => {
  wizardData.budget = parseInt(e.target.value, 10);
  budgetValue.textContent = formatPrice(wizardData.budget);
});

/* ---------- Apps ---------- */
$$('input[name="apps"]').forEach(cb => {
  cb.addEventListener("change", () => {});
});

/* ---------- Juegos ---------- */
const gameInput = $('#game-input');
const gamesPicked = $('#games-picked');
const suggestions = $('#suggestions');

const gamesList = Object.keys(REQUIREMENTS);

gameInput.addEventListener("input", () => {
  const q = gameInput.value.toLowerCase();
  const match = gamesList.filter(g => g.toLowerCase().includes(q));

  suggestions.innerHTML = match.map(m =>
    `<li data-val="${m}">${m}</li>`
  ).join("");

  suggestions.classList.toggle("hidden", match.length === 0);
});

suggestions.onclick = e => {
  const li = e.target.closest("li");
  if (!li) return;

  addGame(li.dataset.val);
  suggestions.classList.add("hidden");
  gameInput.value = "";
};

function addGame(name) {
  if (wizardData.games.includes(name)) return;

  wizardData.games.push(name);

  const tag = document.createElement("div");
  tag.className = "tag";
  tag.textContent = name;

  tag.onclick = () => {
    wizardData.games = wizardData.games.filter(g => g !== name);
    tag.remove();
  };

  gamesPicked.appendChild(tag);
}

/* ---------- Chips (Periféricos / Upgrade) ---------- */
$$('.chip').forEach(chip => {
  chip.addEventListener("click", () => {
    const name = chip.dataset.name;
    const val = chip.dataset.value;

    $$(`.chip[data-name="${name}"]`).forEach(c => c.classList.remove("active"));

    chip.classList.add("active");
    wizardData[name] = val;
  });
});

/* ---------- Radios ---------- */
$$('input[name="resolution"]').forEach(r => {
  r.onchange = () => wizardData.resolution = r.value;
});
$$('input[name="cooling"]').forEach(r => {
  r.onchange = () => wizardData.cooling = r.value;
});

/* ---------- Recolección de Datos ---------- */
function collectAllData() {
  wizardData.use = $$('input[name="use"]:checked').map(i => i.value);
  wizardData.apps = $$('input[name="apps"]:checked').map(i => i.value);
}

/* ---------- Generador de Builds ---------- */
function generateRecommendations() {
  $('#wizard-form').classList.add("hidden");
  $('#results').classList.remove("hidden");

  const cont = $('#reco-list');
  cont.innerHTML = "";

  const budgets = {
    econ: wizardData.budget * 0.6,
    bal: wizardData.budget * 0.95,
    pot: wizardData.budget * 1.2
  };

  Object.entries(budgets).forEach(([name, bud], i) => {
    const build = generateBuild(bud);

    const div = document.createElement("div");
    div.className = "reco-card full";

    div.innerHTML = `
      <h2>${name === "econ" ? "Económica" : name === "bal" ? "Balanceada" : "Potente"}</h2>
      <h3>Presupuesto: ${formatPrice(bud)}</h3>

      <div class="comp-list">
        ${build.map(c => `
          <div class="comp-item">
            <span>${c.category} – ${c.name}</span>
            <span>${formatPrice(c.price)}</span>
          </div>
        `).join("")}
      </div>
    `;

    cont.appendChild(div);
  });
}

function generateBuild(budget) {
  let remaining = budget;
  const picked = [];

  const cats = ["CPU", "GPU", "RAM", "Storage", "Motherboard", "PSU", "Case", "Cooler"];

  for (const cat of cats) {
    const items = COMPONENTS
      .filter(c => c.category === cat && c.price <= remaining)
      .sort((a, b) => b.perf - a.perf);

    if (items.length > 0) {
      picked.push(items[0]);
      remaining -= items[0].price;
    }
  }

  return picked;
}

/* ---------- Reset ---------- */
restartBtn.onclick = () => {
  wizardData.games = [];
  gamesPicked.innerHTML = "";

  $('#wizard-form').classList.remove("hidden");
  $('#results').classList.add("hidden");

  goToStep(1);
};
