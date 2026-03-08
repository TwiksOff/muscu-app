/* ═══════════════════════════════════════════════════
   IRON LOG — app.js
   ═══════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────────────────────
// EXERCISE LIBRARY — catalogue centralisé
// ─────────────────────────────────────────────────────

const EXERCISE_LIBRARY = {
  'Pectoraux': [
    'Développé couché barre',
    'Développé couché haltères',
    'Développé incliné barre',
    'Développé incliné haltères',
    'Développé décliné barre',
    'Écarté couché haltères',
    'Écarté à la poulie',
    'Pompes lestées',
    'Dips pectoraux',
  ],
  'Épaules': [
    'Développé militaire barre',
    'Développé militaire haltères',
    'Élévations latérales haltères',
    'Élévations latérales poulie',
    'Élévations frontales',
    'Oiseau haltères',
    'Face pull poulie',
    'Shrug barre',
    'Shrug haltères',
  ],
  'Dos': [
    'Tractions',
    'Tractions lestées',
    'Tractions prise neutre',
    'Rowing barre',
    'Rowing haltères',
    'Rowing poulie basse',
    'Tirage vertical poulie',
    'Pull-over haltères',
    'Soulevé de terre',
    'Soulevé de terre roumain',
    'Good morning',
  ],
  'Biceps': [
    'Curl barre droite',
    'Curl barre EZ',
    'Curl haltères assis',
    'Curl haltères debout',
    'Curl concentré',
    'Curl marteau',
    'Curl poulie basse',
    'Curl 21',
  ],
  'Triceps': [
    'Dips triceps',
    'Développé couché prise serrée',
    'Barre au front',
    'Extension triceps poulie haute',
    'Extension triceps haltère',
    'Kickback haltères',
    'JM press',
  ],
  'Quadriceps': [
    'Squat barre',
    'Squat avant barre',
    'Presse à cuisses',
    'Leg extension',
    'Fentes barre',
    'Fentes haltères',
    'Hack squat',
    'Bulgarian split squat',
    'Step-up haltères',
  ],
  'Ischio / Fessiers': [
    'Soulevé de terre jambes tendues',
    'Soulevé de terre roumain',
    'Leg curl couché',
    'Leg curl assis',
    'Hip thrust barre',
    'Glute bridge',
    'Good morning',
    'Fentes arrière',
  ],
  'Mollets': [
    'Mollets debout barre',
    'Mollets debout haltères',
    'Mollets assis',
    'Mollets à la presse',
    'Mollets à une jambe',
  ],
  'Abdominaux': [
    'Crunchs',
    'Crunchs poulie',
    'Relevé de jambes',
    'Planche',
    'Roulette abdominale',
    'Russian twist',
    'Gainage latéral',
  ],
};

// ─────────────────────────────────────────────────────
// DATA STORE — Sessions
// ─────────────────────────────────────────────────────

const DB = {
  get sessions() {
    try { return JSON.parse(localStorage.getItem('ironlog_v2') || '[]'); }
    catch (e) { return []; }
  },
  save(sessions) { localStorage.setItem('ironlog_v2', JSON.stringify(sessions)); },
  add(s)  { const l = this.sessions; l.unshift(s); this.save(l); },
  update(s) { const l = this.sessions; const i = l.findIndex(x => x.id === s.id); if (i !== -1) { l[i] = s; this.save(l); } },
  remove(id) { this.save(this.sessions.filter(s => s.id !== id)); },
  find(id)   { return this.sessions.find(s => s.id === id); },
};

// ─────────────────────────────────────────────────────
// DATA STORE — Presets
// ─────────────────────────────────────────────────────

const PRESETS = {
  get list() {
    try { return JSON.parse(localStorage.getItem('ironlog_presets') || '[]'); }
    catch (e) { return []; }
  },
  save(list) { localStorage.setItem('ironlog_presets', JSON.stringify(list)); },
  add(p)     { const l = this.list; l.unshift(p); this.save(l); },
  update(p)  { const l = this.list; const i = l.findIndex(x => x.id === p.id); if (i !== -1) { l[i] = p; this.save(l); } },
  remove(id) { this.save(this.list.filter(p => p.id !== id)); },
  find(id)   { return this.list.find(p => p.id === id); },
};

// ─────────────────────────────────────────────────────
// CUSTOM EXERCISES (ajoutés par l'utilisateur)
// ─────────────────────────────────────────────────────

const CUSTOM_EX = {
  get list() {
    try { return JSON.parse(localStorage.getItem('ironlog_custom_ex') || '[]'); }
    catch (e) { return []; }
  },
  add(name) {
    const l = this.list;
    if (!l.includes(name)) { l.push(name); localStorage.setItem('ironlog_custom_ex', JSON.stringify(l)); }
  },
};

// Retourne tous les noms d'exercices connus (bibliothèque + custom + historique sessions)
function getAllKnownExercises() {
  const known = new Set();
  // Bibliothèque
  Object.values(EXERCISE_LIBRARY).flat().forEach(n => known.add(n));
  // Custom
  CUSTOM_EX.list.forEach(n => known.add(n));
  // Historique sessions
  DB.sessions.forEach(s => s.exercises.forEach(e => known.add(e.name)));
  // Presets
  PRESETS.list.forEach(p => p.exercises.forEach(e => known.add(e.name)));
  return [...known].sort((a, b) => a.localeCompare(b, 'fr'));
}

// ─────────────────────────────────────────────────────
// SEED DEMO DATA
// ─────────────────────────────────────────────────────

function seedData() {
  if (DB.sessions.length > 0) return;
  const D = 86400000, now = Date.now();
  DB.save([
    {
      id: 's1', name: 'Push A', note: 'Énergie haute, bonne séance',
      date: isoDate(now - D * 1),
      exercises: [
        { id:'e1', name:'Développé couché barre',      sets:[{w:100,r:8,n:''},{w:102.5,r:8,n:''},{w:105,r:6,n:'Difficile'}] },
        { id:'e2', name:'Développé incliné haltères',   sets:[{w:36,r:10,n:''},{w:36,r:10,n:''},{w:38,r:8,n:''}] },
        { id:'e3', name:'Élévations latérales haltères',sets:[{w:14,r:15,n:''},{w:14,r:15,n:''},{w:16,r:12,n:''}] },
        { id:'e4', name:'Extension triceps poulie haute',sets:[{w:32,r:12,n:''},{w:34,r:12,n:''},{w:36,r:10,n:''}] },
      ]
    },
    {
      id: 's2', name: 'Pull A', note: '',
      date: isoDate(now - D * 3),
      exercises: [
        { id:'e5', name:'Tractions lestées',  sets:[{w:15,r:7,n:''},{w:15,r:6,n:''},{w:15,r:5,n:''}] },
        { id:'e6', name:'Rowing barre',       sets:[{w:80,r:8,n:''},{w:82.5,r:8,n:''},{w:85,r:6,n:''}] },
        { id:'e7', name:'Curl haltères assis',sets:[{w:18,r:12,n:''},{w:20,r:10,n:''},{w:20,r:9,n:''}] },
      ]
    },
    {
      id: 's3', name: 'Legs A', note: 'DOMS intenses le lendemain !',
      date: isoDate(now - D * 5),
      exercises: [
        { id:'e8',  name:'Squat barre',      sets:[{w:130,r:5,n:''},{w:135,r:5,n:''},{w:140,r:4,n:'PR !'}] },
        { id:'e9',  name:'Presse à cuisses', sets:[{w:200,r:10,n:''},{w:220,r:10,n:''},{w:240,r:8,n:''}] },
        { id:'e10', name:'Leg curl couché',  sets:[{w:45,r:12,n:''},{w:47.5,r:12,n:''},{w:50,r:10,n:''}] },
      ]
    },
    {
      id: 's4', name: 'Push B', note: '',
      date: isoDate(now - D * 8),
      exercises: [
        { id:'e11', name:'Développé couché barre',     sets:[{w:97.5,r:8,n:''},{w:100,r:8,n:''},{w:100,r:7,n:''}] },
        { id:'e12', name:'Développé militaire barre',  sets:[{w:62.5,r:6,n:''},{w:65,r:6,n:''},{w:67.5,r:5,n:''}] },
      ]
    },
    {
      id: 's5', name: 'Pull B', note: '',
      date: isoDate(now - D * 10),
      exercises: [
        { id:'e13', name:'Tractions lestées', sets:[{w:12.5,r:6,n:''},{w:15,r:6,n:''},{w:15,r:5,n:''}] },
        { id:'e14', name:'Rowing barre',      sets:[{w:77.5,r:8,n:''},{w:80,r:8,n:''},{w:80,r:7,n:''}] },
      ]
    },
  ]);

  // Presets de démo
  if (PRESETS.list.length === 0) {
    PRESETS.save([
      {
        id: 'p1', name: 'Push PPL', color: '#c9aa6f',
        exercises: [
          { name:'Développé couché barre',       defaultSets: 3 },
          { name:'Développé incliné haltères',    defaultSets: 3 },
          { name:'Élévations latérales haltères', defaultSets: 3 },
          { name:'Extension triceps poulie haute',defaultSets: 3 },
        ]
      },
      {
        id: 'p2', name: 'Pull PPL', color: '#6f9ec9',
        exercises: [
          { name:'Tractions lestées',   defaultSets: 3 },
          { name:'Rowing barre',        defaultSets: 3 },
          { name:'Curl haltères assis', defaultSets: 3 },
          { name:'Face pull poulie',    defaultSets: 3 },
        ]
      },
      {
        id: 'p3', name: 'Legs PPL', color: '#7ec96f',
        exercises: [
          { name:'Squat barre',      defaultSets: 4 },
          { name:'Presse à cuisses', defaultSets: 3 },
          { name:'Leg curl couché',  defaultSets: 3 },
          { name:'Hip thrust barre', defaultSets: 3 },
        ]
      },
    ]);
  }
}

// ─────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────

const PAGES = ['dashboard', 'sessions', 'detail', 'presets', 'progress'];

function showPage(name) {
  PAGES.forEach(p => document.getElementById('page-' + p).classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === name);
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'sessions')  renderSessions();
  if (name === 'presets')   renderPresets();
  if (name === 'progress')  renderProgress();
}

// ─────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────

function renderDashboard() {
  const sessions = DB.sessions;
  const now = new Date();
  const day7 = new Date(now - 7 * 86400000);
  const h = now.getHours();
  document.getElementById('greeting-label').textContent = h < 12 ? 'Bonjour' : 'Bonsoir';
  document.getElementById('greeting-date').textContent =
    now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' }).toUpperCase();

  const thisWeek = sessions.filter(s => new Date(s.date) >= day7).length;
  const uniqueEx = new Set(sessions.flatMap(s => s.exercises.map(e => e.name))).size;
  const totalVol = Math.round(sessions.reduce((a,s) =>
    a + s.exercises.reduce((b,e) => b + e.sets.reduce((c,x) => c + x.w*x.r, 0), 0), 0));

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-pill">
      <div class="stat-pill-label">Total</div>
      <div class="stat-pill-value">${sessions.length}</div>
      <div class="stat-pill-unit">séances</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Cette semaine</div>
      <div class="stat-pill-value">${thisWeek}</div>
      <div class="stat-pill-unit">séances</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Exercices</div>
      <div class="stat-pill-value">${uniqueEx}</div>
      <div class="stat-pill-unit">uniques</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Volume</div>
      <div class="stat-pill-value">${fmtNum(totalVol)}</div>
      <div class="stat-pill-unit">kg total</div>
    </div>
  `;

  const recentEl = document.getElementById('recent-sessions');
  if (sessions.length === 0) {
    recentEl.innerHTML = emptyState('💪','Aucune séance','Appuyez sur + pour commencer');
  } else {
    recentEl.innerHTML = `<div class="session-cards">${sessions.slice(0,3).map(sessionCardHTML).join('')}</div>`;
  }
  renderHeatmap('week-heatmap-dash', sessions);
}

// ─────────────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────────────

function renderSessions() {
  const sessions = DB.sessions;
  const el = document.getElementById('all-sessions');
  if (sessions.length === 0) {
    el.innerHTML = emptyState('📋','Aucune séance','Créez votre première séance\nen appuyant sur le bouton +');
    return;
  }
  el.innerHTML = `<div class="session-cards">${sessions.map(sessionCardHTML).join('')}</div>`;
}

function sessionCardHTML(s) {
  const totalSets = s.exercises.reduce((a,e) => a + e.sets.length, 0);
  const totalVol  = Math.round(s.exercises.reduce((a,e) => a + e.sets.reduce((b,x) => b + x.w*x.r, 0), 0));
  const tags = s.exercises.slice(0,4).map(e => `<span class="ex-tag">${esc(e.name)}</span>`).join('');
  const more = s.exercises.length > 4 ? `<span class="ex-tag">+${s.exercises.length-4}</span>` : '';
  return `
    <div class="session-card" onclick="showSessionDetail('${s.id}')">
      <div class="sc-row1">
        <div class="sc-name">${esc(s.name)}</div>
        <div class="sc-actions" onclick="event.stopPropagation()">
          <button class="sc-action" onclick="openEditSession('${s.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="sc-action danger" onclick="confirmDeleteSession('${s.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
      <div class="sc-date">${formatDate(s.date)}</div>
      <div class="sc-meta">
        <span class="sc-meta-item"><strong>${s.exercises.length}</strong> ex.</span>
        <span class="sc-meta-item"><strong>${totalSets}</strong> séries</span>
        <span class="sc-meta-item"><strong>${fmtNum(totalVol)}</strong> kg vol.</span>
      </div>
      <div class="sc-tags">${tags}${more}</div>
    </div>`;
}

// ─────────────────────────────────────────────────────
// SESSION DETAIL
// ─────────────────────────────────────────────────────

function showSessionDetail(id) {
  const s = DB.find(id);
  if (!s) return;
  const totalSets = s.exercises.reduce((a,e) => a + e.sets.length, 0);
  const totalVol  = Math.round(s.exercises.reduce((a,e) => a + e.sets.reduce((b,x) => b + x.w*x.r, 0), 0));
  const maxW = Math.max(...s.exercises.flatMap(e => e.sets.map(x => x.w)));

  document.getElementById('detail-top-actions').innerHTML = `
    <div style="display:flex;gap:8px">
      <button class="icon-btn" onclick="openEditSession('${s.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn" style="color:var(--red);border-color:rgba(224,82,82,0.2)" onclick="confirmDeleteSession('${s.id}',true)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>`;

  const exercisesHTML = s.exercises.map(e => {
    const eMaxW = Math.max(...e.sets.map(x => x.w));
    const eVol  = Math.round(e.sets.reduce((a,x) => a + x.w*x.r, 0));
    const rows  = e.sets.map((set, i) => `
      <div class="set-row-display">
        <div class="set-num-disp">${i+1}</div>
        <div class="set-weight">${set.w} kg</div>
        <div class="set-reps">${set.r} reps</div>
        <div class="set-vol">${Math.round(set.w*set.r)} kg</div>
      </div>
      ${set.n ? `<div class="set-note-row">"${esc(set.n)}"</div>` : ''}`).join('');
    return `
      <div class="ex-block">
        <div class="ex-block-head">
          <div class="ex-block-name">${esc(e.name)}</div>
          <div class="ex-block-summary">${eMaxW}kg max · ${eVol}kg vol</div>
        </div>
        <div class="sets-list">${rows}</div>
      </div>`;
  }).join('');

  document.getElementById('session-detail-content').innerHTML = `
    <div class="detail-hero">
      <div class="detail-title">${esc(s.name)}</div>
      <div class="detail-date">${formatDate(s.date)}</div>
      ${s.note ? `<div class="detail-note">${esc(s.note)}</div>` : ''}
      <div class="detail-stats-row">
        <div class="detail-stat"><div class="detail-stat-value">${s.exercises.length}</div><div class="detail-stat-label">Exercices</div></div>
        <div class="detail-stat"><div class="detail-stat-value">${totalSets}</div><div class="detail-stat-label">Séries</div></div>
        <div class="detail-stat"><div class="detail-stat-value">${fmtNum(totalVol)}</div><div class="detail-stat-label">kg vol.</div></div>
        <div class="detail-stat"><div class="detail-stat-value">${maxW}</div><div class="detail-stat-label">kg max</div></div>
      </div>
    </div>
    <div class="section-header"><span class="section-title">Exercices</span></div>
    <div class="exercise-blocks">${exercisesHTML}</div>
    <div style="height:20px"></div>`;

  showPage('detail');
}

// ─────────────────────────────────────────────────────
// NEW / EDIT SESSION
// ─────────────────────────────────────────────────────

let _editId = null;
let _exercises = []; // { id, name, sets:[{w,r,n}] }

function openNewSessionModal(presetId) {
  _editId = null;
  _exercises = [];

  if (presetId) {
    const preset = PRESETS.find(presetId);
    if (preset) {
      _exercises = preset.exercises.map(pe => ({
        id: uid(),
        name: pe.name,
        sets: Array.from({ length: pe.defaultSets }, () => ({ w: 0, r: 0, n: '' }))
      }));
    }
  }

  document.getElementById('sheet-title').textContent = presetId ? 'Depuis preset' : 'Nouvelle séance';
  renderSessionForm(null, presetId);
  openSheet();
}

function openEditSession(id) {
  const s = DB.find(id);
  if (!s) return;
  _editId = id;
  _exercises = JSON.parse(JSON.stringify(s.exercises));
  document.getElementById('sheet-title').textContent = 'Modifier';
  renderSessionForm(s);
  openSheet();
}

function renderSessionForm(s, presetId) {
  const today = isoDate(Date.now());
  let defaultName = '';
  if (presetId) {
    const p = PRESETS.find(presetId);
    if (p) defaultName = p.name;
  }

  document.getElementById('sheet-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Nom de la séance</label>
      <input class="form-input" id="f-name" placeholder="Push A, Legs, Full Body…"
        value="${s ? esc(s.name) : esc(defaultName)}" autocomplete="off">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="f-date" value="${s ? s.date : today}">
      </div>
      <div class="form-group">
        <label class="form-label">Note rapide</label>
        <input class="form-input" id="f-note" placeholder="Ressenti…"
          value="${s ? esc(s.note || '') : ''}" autocomplete="off">
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="form-label" style="margin:0">Exercices</div>
      <button class="btn-ghost btn" style="width:auto;padding:6px 12px" onclick="addExercise()">+ Exercice</button>
    </div>
    <div id="form-exercises"></div>
    <div style="height:8px"></div>
  `;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-primary" onclick="saveSession()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Enregistrer
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>
  `;
  renderFormExercises();
}

function renderFormExercises() {
  const container = document.getElementById('form-exercises');
  if (!container) return;
  if (_exercises.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:20px 0;color:var(--text-3);font-family:var(--font-mono);font-size:11px">Aucun exercice. Appuyez sur + pour en ajouter.</div>`;
    return;
  }
  container.innerHTML = _exercises.map((ex, ei) => {
    const sets = ex.sets.map((set, si) => `
      <div class="form-set-row">
        <div class="set-num-label">${si+1}</div>
        <input class="form-input" type="number" step="0.5" min="0" inputmode="decimal" placeholder="kg"
          value="${set.w || ''}" oninput="_exercises[${ei}].sets[${si}].w=parseFloat(this.value)||0">
        <input class="form-input" type="number" min="0" inputmode="numeric" placeholder="reps"
          value="${set.r || ''}" oninput="_exercises[${ei}].sets[${si}].r=parseInt(this.value)||0">
        <input class="form-input" placeholder="note" value="${esc(set.n||'')}"
          oninput="_exercises[${ei}].sets[${si}].n=this.value" autocomplete="off">
        <button class="rm-btn" onclick="removeSet(${ei},${si})">−</button>
      </div>`).join('');

    const nameDisplay = ex.name
      ? `<span class="ex-name-text">${esc(ex.name)}</span>`
      : `<span class="ex-name-placeholder">Choisir un exercice…</span>`;

    return `
      <div class="form-ex-block">
        <div class="form-ex-header">
          <div class="ex-name-field" onclick="openPicker(${ei})">
            ${nameDisplay}
            <svg class="ex-name-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button class="rm-btn" onclick="removeExercise(${ei})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="form-set-header">
          <div></div>
          <div class="form-label">Poids</div>
          <div class="form-label">Reps</div>
          <div class="form-label">Note</div>
          <div></div>
        </div>
        ${sets}
        <button class="btn btn-ghost" style="width:auto;padding:6px 0;margin-top:4px" onclick="addSet(${ei})">+ Série</button>
      </div>`;
  }).join('');
}

function addExercise() {
  _exercises.push({ id: uid(), name: '', sets: [{ w: 0, r: 0, n: '' }] });
  renderFormExercises();
  const body = document.getElementById('sheet-body');
  setTimeout(() => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }), 50);
}

function removeExercise(i) { _exercises.splice(i, 1); renderFormExercises(); }
function addSet(ei) { _exercises[ei].sets.push({ w: 0, r: 0, n: '' }); renderFormExercises(); }
function removeSet(ei, si) {
  if (_exercises[ei].sets.length <= 1) { toast('Au moins 1 série requise', 'error'); return; }
  _exercises[ei].sets.splice(si, 1);
  renderFormExercises();
}

function saveSession() {
  const name = (document.getElementById('f-name')?.value || '').trim();
  const date  = document.getElementById('f-date')?.value;
  const note  = (document.getElementById('f-note')?.value || '').trim();
  if (!name) { toast('Entrez un nom de séance', 'error'); return; }
  if (!date) { toast('Choisissez une date', 'error'); return; }
  const validEx = _exercises.filter(e => e.name.trim());
  if (validEx.length === 0) { toast('Ajoutez au moins 1 exercice', 'error'); return; }

  const session = { id: _editId || uid(), name, date, note, exercises: validEx };
  if (_editId) { DB.update(session); toast('Séance modifiée ✓'); }
  else         { DB.add(session);    toast('Séance enregistrée ✓'); }

  closeSheet();
  const p = document.querySelector('.page.active')?.id;
  if (p === 'page-sessions')  renderSessions();
  else if (p === 'page-dashboard') renderDashboard();
  else if (p === 'page-detail')    showSessionDetail(session.id);
}

// ─────────────────────────────────────────────────────
// EXERCISE PICKER
// ─────────────────────────────────────────────────────

let _pickerTargetIndex = -1; // index dans _exercises en cours d'édition

function openPicker(exerciseIndex) {
  _pickerTargetIndex = exerciseIndex;
  document.getElementById('picker-search').value = '';
  renderPickerItems('');
  document.getElementById('picker-overlay').classList.add('open');
  document.getElementById('picker-sheet').classList.add('open');
  setTimeout(() => document.getElementById('picker-search').focus(), 300);
}

function closePicker() {
  document.getElementById('picker-overlay').classList.remove('open');
  document.getElementById('picker-sheet').classList.remove('open');
}

function filterPicker(query) {
  renderPickerItems(query.trim());
}

function renderPickerItems(query) {
  const body = document.getElementById('picker-body');
  const q = normalizeStr(query);

  // Exercices récemment utilisés dans les sessions (max 8)
  const recentNames = [];
  const seen = new Set();
  DB.sessions.forEach(s => s.exercises.forEach(e => {
    if (!seen.has(e.name)) { seen.add(e.name); recentNames.push(e.name); }
  }));
  const recent = recentNames.slice(0, 8);

  if (!q) {
    // Affichage par défaut : récents + catégories
    let html = '';

    if (recent.length > 0) {
      html += `<div class="picker-category">Récemment utilisés</div>`;
      html += recent.map(n => pickerItemHTML(n)).join('');
    }

    Object.entries(EXERCISE_LIBRARY).forEach(([cat, names]) => {
      html += `<div class="picker-category">${esc(cat)}</div>`;
      html += names.map(n => pickerItemHTML(n)).join('');
    });

    // Custom exercises
    const customs = CUSTOM_EX.list;
    if (customs.length > 0) {
      html += `<div class="picker-category">Exercices personnalisés</div>`;
      html += customs.map(n => pickerItemHTML(n)).join('');
    }

    body.innerHTML = html;
    return;
  }

  // Filtrage avec la requête
  const allNames = getAllKnownExercises();
  const matches = allNames.filter(n => normalizeStr(n).includes(q));

  if (matches.length === 0) {
    body.innerHTML = `
      <div class="picker-no-results">Aucun résultat pour "${esc(query)}"</div>
      <div class="picker-item create" onclick="createCustomExercise('${esc(query)}')">
        <div class="picker-item-name">
          <div class="picker-create-icon">+</div>
          Créer "${esc(query)}"
        </div>
      </div>`;
    return;
  }

  let html = matches.map(n => pickerItemHTML(n)).join('');

  // Proposer "créer" si aucun résultat exact
  const exactMatch = allNames.some(n => normalizeStr(n) === q);
  if (!exactMatch) {
    html += `
      <div class="picker-item create" onclick="createCustomExercise('${esc(query)}')">
        <div class="picker-item-name">
          <div class="picker-create-icon">+</div>
          Créer "${esc(query)}"
        </div>
      </div>`;
  }

  body.innerHTML = html;
}

function pickerItemHTML(name) {
  // Trouver la catégorie musculaire si dispo
  let muscle = '';
  for (const [cat, names] of Object.entries(EXERCISE_LIBRARY)) {
    if (names.includes(name)) { muscle = cat; break; }
  }
  return `
    <div class="picker-item" onclick="selectExercise('${esc(name)}')">
      <div class="picker-item-name">${esc(name)}</div>
      ${muscle ? `<div class="picker-item-muscle">${esc(muscle)}</div>` : ''}
    </div>`;
}

function selectExercise(name) {
  if (_pickerTargetIndex >= 0 && _pickerTargetIndex < _exercises.length) {
    _exercises[_pickerTargetIndex].name = name;
    renderFormExercises();
  } else if (_pickerPresetTarget) {
    // Mode preset
    _presetExercises.push({ name, defaultSets: 3 });
    renderPresetFormExercises();
  }
  closePicker();
}

function createCustomExercise(name) {
  const cleaned = name.trim();
  if (!cleaned) return;
  CUSTOM_EX.add(cleaned);
  selectExercise(cleaned);
  toast(`"${cleaned}" ajouté à la bibliothèque`);
}

// Normaliser pour la recherche insensible aux accents / casse
function normalizeStr(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ─────────────────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────────────────

function confirmDeleteSession(id, fromDetail = false) {
  const s = DB.find(id);
  if (!s) return;
  document.getElementById('sheet-title').textContent = 'Supprimer ?';
  document.getElementById('sheet-body').innerHTML = `
    <div class="confirm-body">
      Supprimer <span class="confirm-name">${esc(s.name)}</span> (${formatDateShort(s.date)}) ?
      <br><span class="confirm-warn">Cette action est irréversible.</span>
    </div>`;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-danger" onclick="deleteSession('${id}',${fromDetail})">Supprimer définitivement</button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  openSheet();
}

function deleteSession(id, fromDetail) {
  DB.remove(id);
  toast('Séance supprimée', 'error');
  closeSheet();
  if (fromDetail) showPage('sessions');
  else {
    const p = document.querySelector('.page.active')?.id;
    if (p === 'page-sessions') renderSessions();
    else renderDashboard();
  }
}

// ─────────────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────────────

let _presetEditId = null;
let _presetExercises = []; // { name, defaultSets }
let _pickerPresetTarget = false;

function renderPresets() {
  const presets = PRESETS.list;
  const el = document.getElementById('presets-list');

  if (presets.length === 0) {
    el.innerHTML = emptyState('📐','Aucun preset',
      'Créez des modèles de séance réutilisables\nen 1 seul tap');
    return;
  }

  el.innerHTML = `<div class="preset-cards">${presets.map(p => presetCardHTML(p)).join('')}</div>`;
}

function presetCardHTML(p) {
  const exTags = p.exercises.slice(0, 5).map(e =>
    `<span class="ex-tag">${esc(e.name)}</span>`).join('');
  const more = p.exercises.length > 5
    ? `<span class="ex-tag">+${p.exercises.length - 5}</span>` : '';
  const totalSets = p.exercises.reduce((a, e) => a + e.defaultSets, 0);

  return `
    <div class="preset-card">
      <div class="preset-card-top">
        <div class="preset-card-left">
          <div class="preset-name">${esc(p.name)}</div>
          <div class="preset-meta">${p.exercises.length} exercices · ~${totalSets} séries</div>
        </div>
      </div>
      <div class="preset-ex-list">${exTags}${more}</div>
      <div class="preset-card-actions">
        <button class="preset-action primary" onclick="openNewSessionModal('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Lancer
        </button>
        <button class="preset-action" onclick="openEditPreset('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Modifier
        </button>
        <button class="preset-action danger" onclick="confirmDeletePreset('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Suppr.
        </button>
      </div>
    </div>`;
}

function openNewPresetSheet() {
  _presetEditId = null;
  _presetExercises = [];
  _pickerPresetTarget = false;
  document.getElementById('sheet-title').textContent = 'Nouveau preset';
  renderPresetForm(null);
  openSheet();
}

function openEditPreset(id) {
  const p = PRESETS.find(id);
  if (!p) return;
  _presetEditId = id;
  _presetExercises = JSON.parse(JSON.stringify(p.exercises));
  _pickerPresetTarget = false;
  document.getElementById('sheet-title').textContent = 'Modifier preset';
  renderPresetForm(p);
  openSheet();
}

function renderPresetForm(p) {
  document.getElementById('sheet-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Nom du preset</label>
      <input class="form-input" id="pf-name" placeholder="Push, Pull, Legs…"
        value="${p ? esc(p.name) : ''}" autocomplete="off">
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="form-label" style="margin:0">Exercices</div>
      <button class="btn-ghost btn" style="width:auto;padding:6px 12px" onclick="addPresetExercise()">+ Exercice</button>
    </div>
    <div id="preset-form-exercises"></div>
    <div style="height:8px"></div>
  `;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-primary" onclick="savePreset()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Enregistrer le preset
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>
  `;
  renderPresetFormExercises();
}

function renderPresetFormExercises() {
  const container = document.getElementById('preset-form-exercises');
  if (!container) return;
  if (_presetExercises.length === 0) {
    container.innerHTML = `<div style="text-align:center;padding:20px 0;color:var(--text-3);font-family:var(--font-mono);font-size:11px">Aucun exercice. Appuyez sur + pour en ajouter.</div>`;
    return;
  }
  container.innerHTML = _presetExercises.map((pe, i) => {
    const nameDisplay = pe.name
      ? `<span class="ex-name-text">${esc(pe.name)}</span>`
      : `<span class="ex-name-placeholder">Choisir un exercice…</span>`;
    return `
      <div class="preset-ex-form-item">
        <div class="ex-name-field" style="flex:1;min-height:44px" onclick="openPresetPicker(${i})">
          ${nameDisplay}
          <svg class="ex-name-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0">
          <div class="form-label" style="margin:0">Séries</div>
          <input class="form-input" type="number" min="1" max="20" inputmode="numeric"
            value="${pe.defaultSets || 3}"
            oninput="_presetExercises[${i}].defaultSets=parseInt(this.value)||3"
            style="width:64px;padding:8px 10px;font-size:15px;text-align:center">
        </div>
        <button class="rm-btn" onclick="removePresetExercise(${i})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
  }).join('');
}

let _presetPickerIndex = -1;

function openPresetPicker(index) {
  _presetPickerIndex = index;
  _pickerPresetTarget = true;
  _pickerTargetIndex = -1;
  document.getElementById('picker-search').value = '';
  renderPickerItems('');
  document.getElementById('picker-overlay').classList.add('open');
  document.getElementById('picker-sheet').classList.add('open');
  setTimeout(() => document.getElementById('picker-search').focus(), 300);
}

// Override selectExercise pour gérer les deux contextes
const _origSelectExercise = selectExercise;
function selectExercise(name) {
  if (_pickerPresetTarget && _presetPickerIndex >= 0) {
    _presetExercises[_presetPickerIndex].name = name;
    renderPresetFormExercises();
  } else if (_pickerTargetIndex >= 0 && _pickerTargetIndex < _exercises.length) {
    _exercises[_pickerTargetIndex].name = name;
    renderFormExercises();
  }
  closePicker();
}

function addPresetExercise() {
  _presetExercises.push({ name: '', defaultSets: 3 });
  renderPresetFormExercises();
  const body = document.getElementById('sheet-body');
  setTimeout(() => body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }), 50);
}

function removePresetExercise(i) {
  _presetExercises.splice(i, 1);
  renderPresetFormExercises();
}

function savePreset() {
  const name = (document.getElementById('pf-name')?.value || '').trim();
  if (!name) { toast('Entrez un nom de preset', 'error'); return; }
  const validEx = _presetExercises.filter(e => e.name.trim());
  if (validEx.length === 0) { toast('Ajoutez au moins 1 exercice', 'error'); return; }

  const preset = {
    id: _presetEditId || uid(),
    name,
    exercises: validEx,
  };

  if (_presetEditId) { PRESETS.update(preset); toast('Preset modifié ✓'); }
  else               { PRESETS.add(preset);    toast('Preset créé ✓'); }

  _pickerPresetTarget = false;
  closeSheet();
  renderPresets();
}

function confirmDeletePreset(id) {
  const p = PRESETS.find(id);
  if (!p) return;
  document.getElementById('sheet-title').textContent = 'Supprimer le preset ?';
  document.getElementById('sheet-body').innerHTML = `
    <div class="confirm-body">
      Supprimer le preset <span class="confirm-name">${esc(p.name)}</span> ?
      <br><span class="confirm-warn">Les séances déjà enregistrées ne sont pas affectées.</span>
    </div>`;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-danger" onclick="deletePreset('${id}')">Supprimer</button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  openSheet();
}

function deletePreset(id) {
  PRESETS.remove(id);
  toast('Preset supprimé', 'error');
  closeSheet();
  renderPresets();
}

// ─────────────────────────────────────────────────────
// PROGRESS
// ─────────────────────────────────────────────────────

function renderProgress() {
  const sessions = DB.sessions;
  const el = document.getElementById('progress-content');
  if (sessions.length < 2) {
    el.innerHTML = emptyState('📈','Pas assez de données','Enregistrez au moins 2 séances\npour voir votre progression');
    return;
  }
  const exNames = [...new Set(sessions.flatMap(s => s.exercises.map(e => e.name)))];
  const selected = window._pEx || exNames[0] || '';
  const weeklyData = buildWeeklyData(sessions);
  const exData = buildExData(sessions, selected);

  const selectorBtns = exNames.slice(0, 15).map(n =>
    `<button class="ex-sel-btn ${n===selected?'active':''}" onclick="selectPEx('${esc(n)}')">${esc(n)}</button>`
  ).join('');

  el.innerHTML = `
    <div class="section-header"><span class="section-title">Séances / semaine</span></div>
    <div class="progress-section">
      <div class="chart-card">${buildBarChart(weeklyData)}</div>
    </div>
    <div class="section-header"><span class="section-title">Progression par exercice</span></div>
    <div class="ex-selector-scroll">${selectorBtns}</div>
    ${exData.length < 2
      ? `<div class="progress-section"><div style="color:var(--text-3);font-family:var(--font-mono);font-size:11px;padding:10px 0">Données insuffisantes pour cet exercice.</div></div>`
      : `<div class="progress-section">
          <div class="chart-card" style="margin-bottom:10px">
            <div class="chart-card-title">Charge max (kg)</div>
            ${buildLineChart(exData.map(d => ({x:d.date,y:d.maxW})))}
          </div>
          <div class="chart-card">
            <div class="chart-card-title">Volume total (kg)</div>
            ${buildLineChart(exData.map(d => ({x:d.date,y:d.vol})))}
          </div>
        </div>`}
    <div class="section-header"><span class="section-title">Records personnels</span></div>
    <div class="progress-section">${buildPRList(sessions)}</div>
    <div style="height:20px"></div>
  `;
}

function selectPEx(name) { window._pEx = name; renderProgress(); }

function buildExData(sessions, exName) {
  const data = [];
  [...sessions].reverse().forEach(s => {
    const ex = s.exercises.find(e => e.name === exName);
    if (ex) data.push({
      date: s.date,
      maxW: Math.max(...ex.sets.map(x => x.w)),
      vol: Math.round(ex.sets.reduce((a, x) => a + x.w*x.r, 0))
    });
  });
  return data;
}

function buildWeeklyData(sessions) {
  const now = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const wk = new Date(now - (7-i)*7*86400000); wk.setHours(0,0,0,0);
    const wkEnd = new Date(wk.getTime() + 7*86400000);
    const count = sessions.filter(s => { const d = new Date(s.date); return d >= wk && d < wkEnd; }).length;
    return { label: i===7 ? 'Sem.' : `S-${7-i}`, count };
  });
}

function buildBarChart(data) {
  const W=340,H=110,maxVal=Math.max(...data.map(d=>d.count),1),n=data.length,bW=Math.floor((W-30)/n)-5;
  const bars = data.map((d,i) => {
    const x=15+i*(bW+5),bh=d.count>0?Math.max((d.count/maxVal)*(H-30),8):3,y=H-22-bh,isLatest=i===data.length-1;
    return `<rect class="bar-bg" x="${x}" y="${H-22-(H-30)}" width="${bW}" height="${H-30}" rx="4"/>
      <rect class="bar-fill ${isLatest?'latest':''}" x="${x}" y="${y}" width="${bW}" height="${bh}" rx="4"/>
      ${d.count>0?`<text class="data-label" x="${x+bW/2}" y="${y-4}" text-anchor="middle">${d.count}</text>`:''}
      <text class="axis-label" x="${x+bW/2}" y="${H-6}" text-anchor="middle">${d.label}</text>`;
  }).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <line class="axis-line" x1="10" y1="${H-22}" x2="${W-10}" y2="${H-22}"/>${bars}</svg>`;
}

function buildLineChart(points) {
  if (points.length < 2) return '<div style="color:var(--text-3);font-size:12px">—</div>';
  const W=320,H=100,pad={t:20,r:14,b:22,l:36},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  const vals=points.map(p=>p.y),minY=Math.min(...vals)*0.94,maxY=Math.max(...vals)*1.06,rangeY=maxY-minY||1;
  const coords=points.map((p,i)=>({x:pad.l+(i/(points.length-1))*cW,y:pad.t+cH-((p.y-minY)/rangeY)*cH,val:p.y,date:p.x}));
  const pathD=coords.map((c,i)=>`${i===0?'M':'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaD=`${pathD} L${coords[coords.length-1].x.toFixed(1)},${pad.t+cH} L${pad.l},${pad.t+cH} Z`;
  const yLabels=[minY,maxY].map((v,i)=>{const y=pad.t+cH-(i*cH);return `<text class="axis-label" x="${pad.l-5}" y="${y+3}" text-anchor="end">${Math.round(v)}</text>`;}).join('');
  const xLabels=`<text class="axis-label" x="${pad.l}" y="${H-4}" text-anchor="middle">${formatDateShort(points[0].x)}</text><text class="axis-label" x="${W-pad.r}" y="${H-4}" text-anchor="end">${formatDateShort(points[points.length-1].x)}</text>`;
  const dots=coords.map(c=>`<circle class="chart-dot" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="3.5"/><circle class="chart-dot-inner" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="1.8"/>`).join('');
  const last=coords[coords.length-1];
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="areaGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#c9aa6f" stop-opacity="0.2"/><stop offset="100%" stop-color="#c9aa6f" stop-opacity="0"/></linearGradient></defs>
    <line class="axis-line" x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${pad.t+cH}"/>
    <line class="axis-line" x1="${pad.l}" y1="${pad.t+cH}" x2="${W-pad.r}" y2="${pad.t+cH}"/>
    ${yLabels}${xLabels}
    <path class="chart-area" d="${areaD}"/><path class="chart-line" d="${pathD}"/>
    ${dots}
    <text class="data-label" x="${last.x.toFixed(1)}" y="${(last.y-8).toFixed(1)}" text-anchor="middle">${Math.round(last.val)}</text>
  </svg>`;
}

function buildPRList(sessions) {
  const prs = {};
  sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach(set => {
    if (!prs[e.name] || set.w > prs[e.name].w) prs[e.name] = { w: set.w, date: s.date };
  })));
  const items = Object.entries(prs).sort((a,b)=>b[1].w-a[1].w).map(([name,pr]) => `
    <div class="pr-item">
      <div class="pr-name">${esc(name)}</div>
      <div class="pr-right"><div class="pr-weight">${pr.w} kg</div><div class="pr-date">${formatDateShort(pr.date)}</div></div>
    </div>`).join('');
  return `<div class="pr-list">${items}</div>`;
}

// ─────────────────────────────────────────────────────
// HEATMAP
// ─────────────────────────────────────────────────────

function renderHeatmap(containerId, sessions) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const sessionDates = new Set(sessions.map(s => s.date));
  const days = ['L','M','M','J','V','S','D'];
  const cells = Array.from({length:7},(_,i) => {
    const d = new Date(today.getTime()-(6-i)*86400000);
    const iso = isoDate(d.getTime());
    const isToday = d.getTime()===today.getTime();
    return `<div class="hm-day ${sessionDates.has(iso)?'active':''} ${isToday?'today':''}"></div>`;
  }).join('');
  const labels = Array.from({length:7},(_,i) => {
    const d = new Date(today.getTime()-(6-i)*86400000);
    return `<div class="hm-day-label">${days[d.getDay()===0?6:d.getDay()-1]}</div>`;
  }).join('');
  el.innerHTML = `<div class="week-heatmap"><div class="heatmap-wrap"><div class="heatmap-days-labels">${labels}</div><div class="heatmap-days">${cells}</div></div></div>`;
}

// ─────────────────────────────────────────────────────
// SHEET HELPERS
// ─────────────────────────────────────────────────────

function openSheet() {
  document.getElementById('sheet-overlay').classList.add('open');
  document.getElementById('bottom-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('bottom-sheet').classList.remove('open');
  document.body.style.overflow = '';
  _pickerPresetTarget = false;
}

// ─────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────

function toast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ─────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).substr(2,9) + Date.now().toString(36); }

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function isoDate(ts) { return new Date(ts).toISOString().split('T')[0]; }

function formatDate(d) {
  if (!d) return '';
  return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
}

function formatDateShort(d) {
  if (!d) return '';
  return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}

function fmtNum(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }

function emptyState(icon, title, sub) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${title}</div><div class="empty-state-sub">${sub}</div></div>`;
}

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────

seedData();
renderDashboard();
