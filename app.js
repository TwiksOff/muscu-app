/* ═══════════════════════════════════════════════════
   STRONG BOY — app.js  v2.1
   ═══════════════════════════════════════════════════ */
'use strict';

// ─────────────────────────────────────────────────────
// EXERCISE LIBRARY
// ─────────────────────────────────────────────────────

const EXERCISE_LIBRARY = {
  'Pectoraux':        ['Développé couché barre','Développé couché haltères','Développé incliné barre','Développé incliné haltères','Développé décliné barre','Écarté couché haltères','Écarté à la poulie','Pompes lestées','Dips pectoraux'],
  'Épaules':          ['Développé militaire barre','Développé militaire haltères','Élévations latérales haltères','Élévations latérales poulie','Élévations frontales','Oiseau haltères','Face pull poulie','Shrug barre','Shrug haltères'],
  'Dos':              ['Tractions','Tractions lestées','Tractions prise neutre','Rowing barre','Rowing haltères','Rowing poulie basse','Tirage vertical poulie','Pull-over haltères','Soulevé de terre','Soulevé de terre roumain','Good morning'],
  'Biceps':           ['Curl barre droite','Curl barre EZ','Curl haltères assis','Curl haltères debout','Curl concentré','Curl marteau','Curl poulie basse','Curl 21'],
  'Triceps':          ['Dips triceps','Développé couché prise serrée','Barre au front','Extension triceps poulie haute','Extension triceps haltère','Kickback haltères','JM press'],
  'Quadriceps':       ['Squat barre','Squat avant barre','Presse à cuisses','Leg extension','Fentes barre','Fentes haltères','Hack squat','Bulgarian split squat','Step-up haltères'],
  'Ischio / Fessiers':['Soulevé de terre jambes tendues','Soulevé de terre roumain','Leg curl couché','Leg curl assis','Hip thrust barre','Glute bridge','Good morning','Fentes arrière'],
  'Mollets':          ['Mollets debout barre','Mollets debout haltères','Mollets assis','Mollets à la presse','Mollets à une jambe'],
  'Abdominaux':       ['Crunchs','Crunchs poulie','Relevé de jambes','Planche','Roulette abdominale','Russian twist','Gainage latéral'],
};

// Map exercice → groupe musculaire (computed once)
const EX_TO_MUSCLE = {};
Object.entries(EXERCISE_LIBRARY).forEach(([muscle, exs]) => exs.forEach(e => { EX_TO_MUSCLE[e] = muscle; }));

function getMuscleForExercise(name) {
  if (EX_TO_MUSCLE[name]) return EX_TO_MUSCLE[name];
  // partial match from custom / history
  const lower = name.toLowerCase();
  for (const [muscle, exs] of Object.entries(EXERCISE_LIBRARY)) {
    if (exs.some(e => e.toLowerCase().includes(lower) || lower.includes(e.toLowerCase().split(' ')[0]))) return muscle;
  }
  return 'Autre';
}

// ─────────────────────────────────────────────────────
// DATA STORES
// ─────────────────────────────────────────────────────

const DB = {
  get sessions() { try { return JSON.parse(localStorage.getItem('strongboy_v2')||'[]'); } catch(e){ return []; } },
  save(l){ localStorage.setItem('strongboy_v2', JSON.stringify(l)); },
  add(s){ const l=this.sessions; l.unshift(s); this.save(l); },
  update(s){ const l=this.sessions; const i=l.findIndex(x=>x.id===s.id); if(i!==-1){l[i]=s; this.save(l);} },
  remove(id){ this.save(this.sessions.filter(s=>s.id!==id)); },
  find(id){ return this.sessions.find(s=>s.id===id); },
};

const PRESETS = {
  get list() { try { return JSON.parse(localStorage.getItem('strongboy_presets')||'[]'); } catch(e){ return []; } },
  save(l){ localStorage.setItem('strongboy_presets', JSON.stringify(l)); },
  add(p){ const l=this.list; l.unshift(p); this.save(l); },
  update(p){ const l=this.list; const i=l.findIndex(x=>x.id===p.id); if(i!==-1){l[i]=p; this.save(l);} },
  remove(id){ this.save(this.list.filter(p=>p.id!==id)); },
  find(id){ return this.list.find(p=>p.id===id); },
};

const CUSTOM_EX = {
  get list() { try { return JSON.parse(localStorage.getItem('strongboy_custom_ex')||'[]'); } catch(e){ return []; } },
  add(name){ const l=this.list; if(!l.includes(name)){l.push(name); localStorage.setItem('strongboy_custom_ex',JSON.stringify(l));} },
};

const PROFILE = {
  get data() { try { return JSON.parse(localStorage.getItem('strongboy_profile')||'{}'); } catch(e){ return {}; } },
  save(d){ localStorage.setItem('strongboy_profile', JSON.stringify(d)); },
  get(key, fallback=''){ return this.data[key] ?? fallback; },
  set(key, val){ const d=this.data; d[key]=val; this.save(d); },
};

// Weight / measurement history: { date, weight, chest, waist, hips, thigh, arm }
const BODY_LOG = {
  get entries() { try { return JSON.parse(localStorage.getItem('strongboy_body')||'[]'); } catch(e){ return []; } },
  save(l){ localStorage.setItem('strongboy_body', JSON.stringify(l)); },
  add(entry){ const l=this.entries; l.unshift(entry); this.save(l); },
  latest(){ return this.entries[0] || {}; },
};

const SETTINGS = {
  get data() { try { return JSON.parse(localStorage.getItem('strongboy_settings')||'{}'); } catch(e){ return {}; } },
  get(key, fallback){ const v=this.data[key]; return v===undefined ? fallback : v; },
  set(key,val){ const d=this.data; d[key]=val; localStorage.setItem('strongboy_settings',JSON.stringify(d)); },
};

function getAllKnownExercises() {
  const known = new Set([...Object.values(EXERCISE_LIBRARY).flat(), ...CUSTOM_EX.list]);
  DB.sessions.forEach(s => s.exercises.forEach(e => known.add(e.name)));
  PRESETS.list.forEach(p => p.exercises.forEach(e => known.add(e.name)));
  return [...known].sort((a,b) => a.localeCompare(b,'fr'));
}

// Last known weight & reps per exercise name (from sessions history)
function getLastSetsForExercise(name) {
  const sessions = DB.sessions;
  for (const s of sessions) {
    const ex = s.exercises.find(e => e.name === name);
    if (ex && ex.sets.length > 0) return ex.sets;
  }
  return null;
}

// ─────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────

const PAGES = ['dashboard','sessions','detail','presets','progress'];

function showPage(name) {
  PAGES.forEach(p => document.getElementById('page-'+p).classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page===name));
  if (name==='dashboard') renderDashboard();
  if (name==='sessions')  renderSessions();
  if (name==='presets')   renderPresets();
  if (name==='progress')  renderProgress();
}

// ─────────────────────────────────────────────────────
// DASHBOARD  — fix : semaine lundi→dimanche locale
// ─────────────────────────────────────────────────────

function renderDashboard() {
  const sessions = DB.sessions;
  const now = new Date();
  const h = now.getHours();
  document.getElementById('greeting-label').textContent = h < 12 ? 'Bonjour' : 'Bonsoir';
  document.getElementById('greeting-date').textContent =
    now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();

  // "Cette semaine" = lundi 00:00 de la semaine en cours
  const weekStart = getWeekStart(now);
  const thisWeekSessions = sessions.filter(s => parseLocalDate(s.date) >= weekStart);

  const uniqueEx = new Set(sessions.flatMap(s => s.exercises.map(e => e.name))).size;
  const totalVol = Math.round(sessions.reduce((a,s) => a+s.exercises.reduce((b,e) => b+e.sets.reduce((c,x) => c+x.w*x.r,0),0),0));

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-pill">
      <div class="stat-pill-label">Total</div>
      <div class="stat-pill-value">${sessions.length}</div>
      <div class="stat-pill-unit">séances</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Cette semaine</div>
      <div class="stat-pill-value">${thisWeekSessions.length}</div>
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
  updateDrawerProfile();
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
  const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
  const totalVol  = Math.round(s.exercises.reduce((a,e)=>a+e.sets.reduce((b,x)=>b+x.w*x.r,0),0));
  const tags = s.exercises.slice(0,4).map(e=>`<span class="ex-tag">${esc(e.name)}</span>`).join('');
  const more = s.exercises.length>4 ? `<span class="ex-tag">+${s.exercises.length-4}</span>` : '';
  return `
    <div class="session-card" onclick="showSessionDetail('${s.id}')">
      <div class="sc-row1">
        <div class="sc-name">${esc(s.name)}</div>
        <div class="sc-actions" onclick="event.stopPropagation()">
          <button class="sc-action" onclick="openEditSession('${s.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="sc-action danger" onclick="confirmDeleteSession('${s.id}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
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
  const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
  const totalVol  = Math.round(s.exercises.reduce((a,e)=>a+e.sets.reduce((b,x)=>b+x.w*x.r,0),0));
  const maxW = Math.max(...s.exercises.flatMap(e=>e.sets.map(x=>x.w)));

  document.getElementById('detail-top-actions').innerHTML = `
    <div style="display:flex;gap:8px">
      <button class="icon-btn" onclick="openEditSession('${s.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn" style="color:var(--red);border-color:rgba(224,82,82,0.2)" onclick="confirmDeleteSession('${s.id}',true)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>`;

  const exercisesHTML = s.exercises.map(e => {
    const eMaxW = Math.max(...e.sets.map(x=>x.w));
    const eVol  = Math.round(e.sets.reduce((a,x)=>a+x.w*x.r,0));
    const rows  = e.sets.map((set,i)=>`
      <div class="set-row-display">
        <div class="set-num-disp">${i+1}</div>
        <div class="set-weight">${set.w} kg</div>
        <div class="set-reps">${set.r} reps</div>
        <div class="set-vol">${Math.round(set.w*set.r)} kg</div>
      </div>
      ${set.n?`<div class="set-note-row">"${esc(set.n)}"</div>`:''}`).join('');
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
      ${s.note?`<div class="detail-note">${esc(s.note)}</div>`:''}
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
let _exercises = [];

function openNewSessionModal(presetId) {
  _editId = null;
  _exercises = [];
  if (presetId) {
    const preset = PRESETS.find(presetId);
    if (preset) {
      _exercises = preset.exercises.map(pe => ({
        id: uid(), name: pe.name,
        sets: Array.from({length: pe.defaultSets}, () => ({ w:0, r:0, n:'' }))
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
  if (presetId) { const p = PRESETS.find(presetId); if(p) defaultName = p.name; }

  document.getElementById('sheet-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Nom de la séance</label>
      <input class="form-input" id="f-name" placeholder="Push A, Legs, Full Body…" value="${s?esc(s.name):esc(defaultName)}" autocomplete="off">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="f-date" value="${s?s.date:today}">
      </div>
      <div class="form-group">
        <label class="form-label">Note rapide</label>
        <input class="form-input" id="f-note" placeholder="Ressenti…" value="${s?esc(s.note||''):''}" autocomplete="off">
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
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
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
    // Previous performance for placeholder
    let prevHint = '';
    if (ex.name) {
      const lastSets = getLastSetsForExercise(ex.name);
      // Skip if this is an edit and the sets are from this session already
      if (lastSets && !_editId) {
        const maxW = Math.max(...lastSets.map(s=>s.w));
        prevHint = `<div style="font-family:var(--font-mono);font-size:9px;color:var(--gold);margin:4px 0 8px;letter-spacing:.5px">↑ Dernière fois : ${maxW}kg × ${lastSets[0].r} reps (${lastSets.length} séries)</div>`;
      }
    }

    const sets = ex.sets.map((set, si) => {
      // Placeholder = last session's same-index set weight
      const lastSets = ex.name ? getLastSetsForExercise(ex.name) : null;
      const lastSet  = lastSets ? (lastSets[si] || lastSets[lastSets.length-1]) : null;
      const wPh = lastSet && !set.w ? lastSet.w : '';
      const rPh = lastSet && !set.r ? lastSet.r : '';
      return `
        <div class="form-set-row">
          <div class="set-num-label">${si+1}</div>
          <input class="form-input" type="number" step="0.5" min="0" inputmode="decimal"
            placeholder="${wPh}" value="${set.w||''}"
            oninput="_exercises[${ei}].sets[${si}].w=parseFloat(this.value)||0">
          <input class="form-input" type="number" min="0" inputmode="numeric"
            placeholder="${rPh}" value="${set.r||''}"
            oninput="_exercises[${ei}].sets[${si}].r=parseInt(this.value)||0">
          <input class="form-input" placeholder="note" value="${esc(set.n||'')}"
            oninput="_exercises[${ei}].sets[${si}].n=this.value" autocomplete="off">
          <button class="rm-btn" onclick="removeSet(${ei},${si})">−</button>
        </div>`;
    }).join('');

    const nameDisplay = ex.name
      ? `<span class="ex-name-text">${esc(ex.name)}</span>`
      : `<span class="ex-name-placeholder">Choisir un exercice…</span>`;

    return `
      <div class="form-ex-block">
        <div class="form-ex-header">
          <div class="ex-name-field" onclick="openPicker(${ei})">
            ${nameDisplay}
            <svg class="ex-name-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button class="rm-btn" onclick="removeExercise(${ei})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        ${prevHint}
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
  _exercises.push({id:uid(),name:'',sets:[{w:0,r:0,n:''}]});
  renderFormExercises();
  const body = document.getElementById('sheet-body');
  setTimeout(()=>body.scrollTo({top:body.scrollHeight,behavior:'smooth'}),50);
}
function removeExercise(i){ _exercises.splice(i,1); renderFormExercises(); }
function addSet(ei){ _exercises[ei].sets.push({w:0,r:0,n:''}); renderFormExercises(); }
function removeSet(ei,si){
  if(_exercises[ei].sets.length<=1){toast('Au moins 1 série requise','error');return;}
  _exercises[ei].sets.splice(si,1); renderFormExercises();
}

function saveSession() {
  const name=(document.getElementById('f-name')?.value||'').trim();
  const date=document.getElementById('f-date')?.value;
  const note=(document.getElementById('f-note')?.value||'').trim();
  if(!name){toast('Entrez un nom de séance','error');return;}
  if(!date){toast('Choisissez une date','error');return;}
  const validEx=_exercises.filter(e=>e.name.trim());
  if(validEx.length===0){toast('Ajoutez au moins 1 exercice','error');return;}
  const session={id:_editId||uid(),name,date,note,exercises:validEx};
  if(_editId){DB.update(session);toast('Séance modifiée ✓');}
  else{DB.add(session);toast('Séance enregistrée ✓');}
  closeSheet();
  const p=document.querySelector('.page.active')?.id;
  if(p==='page-sessions') renderSessions();
  else if(p==='page-dashboard') renderDashboard();
  else if(p==='page-detail') showSessionDetail(session.id);
}

// ─────────────────────────────────────────────────────
// EXERCISE PICKER
// ─────────────────────────────────────────────────────

let _pickerTargetIndex = -1;
let _pickerPresetTarget = false;
let _presetPickerIndex  = -1;

function openPicker(exerciseIndex) {
  _pickerTargetIndex = exerciseIndex;
  _pickerPresetTarget = false;
  document.getElementById('picker-search').value = '';
  renderPickerItems('');
  document.getElementById('picker-overlay').classList.add('open');
  document.getElementById('picker-sheet').classList.add('open');
  setTimeout(()=>document.getElementById('picker-search').focus(),300);
}

function openPresetPicker(index) {
  _presetPickerIndex = index;
  _pickerPresetTarget = true;
  _pickerTargetIndex = -1;
  document.getElementById('picker-search').value = '';
  renderPickerItems('');
  document.getElementById('picker-overlay').classList.add('open');
  document.getElementById('picker-sheet').classList.add('open');
  setTimeout(()=>document.getElementById('picker-search').focus(),300);
}

function closePicker() {
  document.getElementById('picker-overlay').classList.remove('open');
  document.getElementById('picker-sheet').classList.remove('open');
}

function filterPicker(query){ renderPickerItems(query.trim()); }

function renderPickerItems(query) {
  const body = document.getElementById('picker-body');
  const q = normalizeStr(query);

  // Recently used names
  const seen = new Set();
  const recent = [];
  DB.sessions.forEach(s=>s.exercises.forEach(e=>{if(!seen.has(e.name)){seen.add(e.name);recent.push(e.name);}}));

  if (!q) {
    let html = '';
    if (recent.length > 0) {
      html += `<div class="picker-category">Récemment utilisés</div>`;
      html += recent.slice(0,8).map(n=>pickerItemHTML(n)).join('');
    }
    Object.entries(EXERCISE_LIBRARY).forEach(([cat,names])=>{
      html += `<div class="picker-category">${esc(cat)}</div>`;
      html += names.map(n=>pickerItemHTML(n)).join('');
    });
    const customs = CUSTOM_EX.list;
    if(customs.length>0){
      html += `<div class="picker-category">Exercices personnalisés</div>`;
      html += customs.map(n=>pickerItemHTML(n)).join('');
    }
    body.innerHTML = html;
    return;
  }

  const allNames = getAllKnownExercises();
  const matches  = allNames.filter(n=>normalizeStr(n).includes(q));

  if(matches.length===0){
    body.innerHTML = `
      <div class="picker-no-results">Aucun résultat pour "${esc(query)}"</div>
      <div class="picker-item create" onclick="createCustomExercise('${esc(query)}')">
        <div class="picker-item-name"><div class="picker-create-icon">+</div>Créer "${esc(query)}"</div>
      </div>`;
    return;
  }

  let html = matches.map(n=>pickerItemHTML(n)).join('');
  const exactMatch = allNames.some(n=>normalizeStr(n)===q);
  if(!exactMatch){
    html += `<div class="picker-item create" onclick="createCustomExercise('${esc(query)}')">
      <div class="picker-item-name"><div class="picker-create-icon">+</div>Créer "${esc(query)}"</div>
    </div>`;
  }
  body.innerHTML = html;
}

function pickerItemHTML(name) {
  const muscle = EX_TO_MUSCLE[name] || '';
  // Last known weight
  const lastSets = getLastSetsForExercise(name);
  const prevText = lastSets ? `${Math.max(...lastSets.map(s=>s.w))} kg × ${lastSets[0].r}` : '';
  return `
    <div class="picker-item" onclick="selectExercise('${esc(name)}')">
      <div class="picker-item-left">
        <div class="picker-item-name">${esc(name)}</div>
        ${prevText ? `<div class="picker-item-prev">↑ ${prevText}</div>` : ''}
      </div>
      ${muscle?`<div class="picker-item-muscle">${esc(muscle)}</div>`:''}
    </div>`;
}

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

function createCustomExercise(name) {
  const cleaned = name.trim();
  if (!cleaned) return;
  CUSTOM_EX.add(cleaned);
  selectExercise(cleaned);
  toast(`"${cleaned}" ajouté à la bibliothèque`);
}

function normalizeStr(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

// ─────────────────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────────────────

function confirmDeleteSession(id, fromDetail=false) {
  const s=DB.find(id); if(!s) return;
  document.getElementById('sheet-title').textContent='Supprimer ?';
  document.getElementById('sheet-body').innerHTML=`
    <div class="confirm-body">Supprimer <span class="confirm-name">${esc(s.name)}</span> (${formatDateShort(s.date)}) ?<br><span class="confirm-warn">Cette action est irréversible.</span></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-danger" onclick="deleteSession('${id}',${fromDetail})">Supprimer définitivement</button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  openSheet();
}

function deleteSession(id, fromDetail) {
  DB.remove(id); toast('Séance supprimée','error'); closeSheet();
  if(fromDetail) showPage('sessions');
  else { const p=document.querySelector('.page.active')?.id; if(p==='page-sessions') renderSessions(); else renderDashboard(); }
}

// ─────────────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────────────

let _presetEditId   = null;
let _presetExercises = [];

function renderPresets() {
  const presets = PRESETS.list;
  const el = document.getElementById('presets-list');
  if(presets.length===0){
    el.innerHTML=emptyState('📐','Aucun preset','Créez des modèles de séance réutilisables\nen 1 seul tap');
    return;
  }
  el.innerHTML=`<div class="preset-cards">${presets.map(p=>presetCardHTML(p)).join('')}</div>`;
}

function presetCardHTML(p) {
  const exTags=p.exercises.slice(0,5).map(e=>`<span class="ex-tag">${esc(e.name)}</span>`).join('');
  const more=p.exercises.length>5?`<span class="ex-tag">+${p.exercises.length-5}</span>`:'';
  const totalSets=p.exercises.reduce((a,e)=>a+e.defaultSets,0);
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Lancer
        </button>
        <button class="preset-action" onclick="openEditPreset('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Modifier
        </button>
        <button class="preset-action danger" onclick="confirmDeletePreset('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          Suppr.
        </button>
      </div>
    </div>`;
}

function openNewPresetSheet() {
  _presetEditId=null; _presetExercises=[]; _pickerPresetTarget=false;
  document.getElementById('sheet-title').textContent='Nouveau preset';
  renderPresetForm(null); openSheet();
}

function openEditPreset(id) {
  const p=PRESETS.find(id); if(!p) return;
  _presetEditId=id; _presetExercises=JSON.parse(JSON.stringify(p.exercises)); _pickerPresetTarget=false;
  document.getElementById('sheet-title').textContent='Modifier preset';
  renderPresetForm(p); openSheet();
}

function renderPresetForm(p) {
  document.getElementById('sheet-body').innerHTML=`
    <div class="form-group">
      <label class="form-label">Nom du preset</label>
      <input class="form-input" id="pf-name" placeholder="Push, Pull, Legs…" value="${p?esc(p.name):''}" autocomplete="off">
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="form-label" style="margin:0">Exercices</div>
      <button class="btn-ghost btn" style="width:auto;padding:6px 12px" onclick="addPresetExercise()">+ Exercice</button>
    </div>
    <div id="preset-form-exercises"></div>
    <div style="height:8px"></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-primary" onclick="savePreset()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      Enregistrer le preset
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  renderPresetFormExercises();
}

function renderPresetFormExercises() {
  const container=document.getElementById('preset-form-exercises'); if(!container) return;
  if(_presetExercises.length===0){
    container.innerHTML=`<div style="text-align:center;padding:20px 0;color:var(--text-3);font-family:var(--font-mono);font-size:11px">Aucun exercice.</div>`;
    return;
  }
  container.innerHTML=_presetExercises.map((pe,i)=>{
    const nd=pe.name?`<span class="ex-name-text">${esc(pe.name)}</span>`:`<span class="ex-name-placeholder">Choisir…</span>`;
    return `
      <div class="preset-ex-form-item">
        <div class="ex-name-field" style="flex:1;min-height:44px" onclick="openPresetPicker(${i})">${nd}
          <svg class="ex-name-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0">
          <div class="form-label" style="margin:0">Séries</div>
          <input class="form-input" type="number" min="1" max="20" inputmode="numeric" value="${pe.defaultSets||3}"
            oninput="_presetExercises[${i}].defaultSets=parseInt(this.value)||3"
            style="width:64px;padding:8px 10px;font-size:15px;text-align:center">
        </div>
        <button class="rm-btn" onclick="removePresetExercise(${i})">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
  }).join('');
}

function addPresetExercise() {
  _presetExercises.push({name:'',defaultSets:3}); renderPresetFormExercises();
  const body=document.getElementById('sheet-body');
  setTimeout(()=>body.scrollTo({top:body.scrollHeight,behavior:'smooth'}),50);
}
function removePresetExercise(i){ _presetExercises.splice(i,1); renderPresetFormExercises(); }

function savePreset() {
  const name=(document.getElementById('pf-name')?.value||'').trim();
  if(!name){toast('Entrez un nom de preset','error');return;}
  const validEx=_presetExercises.filter(e=>e.name.trim());
  if(validEx.length===0){toast('Ajoutez au moins 1 exercice','error');return;}
  const preset={id:_presetEditId||uid(),name,exercises:validEx};
  if(_presetEditId){PRESETS.update(preset);toast('Preset modifié ✓');}
  else{PRESETS.add(preset);toast('Preset créé ✓');}
  _pickerPresetTarget=false; closeSheet(); renderPresets();
}

function confirmDeletePreset(id) {
  const p=PRESETS.find(id); if(!p) return;
  document.getElementById('sheet-title').textContent='Supprimer le preset ?';
  document.getElementById('sheet-body').innerHTML=`<div class="confirm-body">Supprimer <span class="confirm-name">${esc(p.name)}</span> ?<br><span class="confirm-warn">Les séances déjà enregistrées ne sont pas affectées.</span></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-danger" onclick="deletePreset('${id}')">Supprimer</button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  openSheet();
}

function deletePreset(id){ PRESETS.remove(id); toast('Preset supprimé','error'); closeSheet(); renderPresets(); }

// ─────────────────────────────────────────────────────
// PROGRESS / STATS  (full rewrite)
// ─────────────────────────────────────────────────────

function renderProgress() {
  const sessions = DB.sessions;
  const el = document.getElementById('progress-content');
  if (sessions.length === 0) {
    el.innerHTML = emptyState('📈','Pas encore de données','Enregistrez votre première séance\npour voir vos statistiques');
    return;
  }

  const weeklyData = buildWeeklyData(sessions);
  const muscleData = buildMuscleData(sessions);
  const exNames    = [...new Set(sessions.flatMap(s=>s.exercises.map(e=>e.name)))];
  const selected   = window._pEx || exNames[0] || '';
  const exData     = buildExData(sessions, selected);

  const selectorBtns = exNames.slice(0,15).map(n=>
    `<button class="ex-sel-btn ${n===selected?'active':''}" onclick="selectPEx('${esc(n)}')">${esc(n)}</button>`
  ).join('');

  el.innerHTML = `
    <!-- Fréquence séances -->
    <div class="section-header"><span class="section-title">Séances / semaine</span></div>
    <div class="progress-section">
      <div class="chart-card">${buildBarChart(weeklyData)}</div>
    </div>

    <!-- Muscles travaillés -->
    <div class="section-header"><span class="section-title">Muscles — 7 derniers jours</span></div>
    <div class="progress-section">
      <div class="muscle-grid">${buildMuscleRows(muscleData, 7)}</div>
    </div>

    <div class="section-header" style="margin-top:4px"><span class="section-title">Muscles — 30 derniers jours</span></div>
    <div class="progress-section">
      <div class="muscle-grid">${buildMuscleRows(muscleData, 30)}</div>
    </div>

    <!-- Progression exercice -->
    <div class="section-header"><span class="section-title">Progression par exercice</span></div>
    <div class="ex-selector-scroll">${selectorBtns}</div>
    ${exData.length < 2
      ? `<div class="progress-section"><div style="color:var(--text-3);font-family:var(--font-mono);font-size:11px;padding:10px 0">Données insuffisantes pour cet exercice.</div></div>`
      : `<div class="progress-section">
          <div class="chart-card" style="margin-bottom:10px">
            <div class="chart-card-title">Charge max (kg)</div>
            ${buildLineChart(exData.map(d=>({x:d.date,y:d.maxW})))}
          </div>
          <div class="chart-card">
            <div class="chart-card-title">Volume total (kg)</div>
            ${buildLineChart(exData.map(d=>({x:d.date,y:d.vol})))}
          </div>
        </div>`}

    <!-- Records -->
    <div class="section-header"><span class="section-title">Records personnels</span></div>
    <div class="progress-section">${buildPRList(sessions)}</div>
    <div style="height:20px"></div>
  `;
}

function selectPEx(name){ window._pEx=name; renderProgress(); }

// Muscle data: per group, count sessions that trained it in last N days
function buildMuscleData(sessions) {
  const result = {};
  Object.keys(EXERCISE_LIBRARY).forEach(m => { result[m] = { sessions7:0, sessions30:0, lastDate:null }; });
  result['Autre'] = { sessions7:0, sessions30:0, lastDate:null };

  const now = new Date(); now.setHours(0,0,0,0);
  const d7  = new Date(now - 7*86400000);
  const d30 = new Date(now - 30*86400000);

  sessions.forEach(s => {
    const sDate = parseLocalDate(s.date);
    const musclesInSession = new Set(s.exercises.map(e=>getMuscleForExercise(e.name)));
    musclesInSession.forEach(m => {
      if (!result[m]) result[m] = {sessions7:0,sessions30:0,lastDate:null};
      if (sDate >= d7)  result[m].sessions7++;
      if (sDate >= d30) result[m].sessions30++;
      if (!result[m].lastDate || sDate > result[m].lastDate) result[m].lastDate = sDate;
    });
  });
  return result;
}

function buildMuscleRows(muscleData, days) {
  const entries = Object.entries(muscleData)
    .filter(([m]) => m !== 'Autre')
    .sort((a,b) => {
      const va = days===7 ? a[1].sessions7 : a[1].sessions30;
      const vb = days===7 ? b[1].sessions7 : b[1].sessions30;
      if (vb !== va) return vb - va;
      const da = a[1].lastDate || new Date(0);
      const db = b[1].lastDate || new Date(0);
      return db - da;
    });

  const maxFreq = Math.max(...entries.map(([,v])=> days===7?v.sessions7:v.sessions30), 1);

  return entries.map(([muscle, data]) => {
    const freq = days===7 ? data.sessions7 : data.sessions30;
    const lastDate = data.lastDate;
    const now = new Date(); now.setHours(0,0,0,0);
    const daysSinceLast = lastDate ? Math.round((now - lastDate) / 86400000) : null;

    let badgeClass = 'rest';
    let badgeText = '—';
    if (freq > 0) {
      const ratio = freq / (days/7); // sessions per week
      if (ratio >= 2)      { badgeClass='hot';  badgeText=`${freq}×`; }
      else if (ratio >= 1) { badgeClass='warm'; badgeText=`${freq}×`; }
      else                 { badgeClass='cold'; badgeText=`${freq}×`; }
    }

    const lastText = daysSinceLast === null ? 'jamais' :
      daysSinceLast === 0 ? "aujourd'hui" :
      daysSinceLast === 1 ? 'hier' :
      `il y a ${daysSinceLast}j`;

    const barPct = maxFreq > 0 ? Math.round((freq / maxFreq) * 100) : 0;

    return `
      <div class="muscle-row">
        <div class="muscle-row-left">
          <div class="muscle-row-name">${esc(muscle)}</div>
          <div class="muscle-row-last">Dernier : ${lastText}</div>
        </div>
        <div class="muscle-row-right">
          <span class="muscle-freq-badge ${badgeClass}">${badgeText}</span>
          <div class="muscle-bar-wrap">
            <div class="muscle-bar-fill" style="width:${barPct}%"></div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function buildExData(sessions, exName) {
  const data=[];
  [...sessions].reverse().forEach(s=>{
    const ex=s.exercises.find(e=>e.name===exName);
    if(ex) data.push({date:s.date,maxW:Math.max(...ex.sets.map(x=>x.w)),vol:Math.round(ex.sets.reduce((a,x)=>a+x.w*x.r,0))});
  });
  return data;
}

// Fix: use local Monday-based weeks
function buildWeeklyData(sessions) {
  const now = new Date(); now.setHours(0,0,0,0);
  return Array.from({length:8},(_,i)=>{
    // Monday of week (i=7 → current week, i=0 → 7 weeks ago)
    const weeksAgo = 7 - i;
    const wkMon = getMondayOfWeek(new Date(now.getTime() - weeksAgo*7*86400000));
    const wkSun = new Date(wkMon.getTime() + 7*86400000);
    const count = sessions.filter(s=>{ const d=parseLocalDate(s.date); return d>=wkMon && d<wkSun; }).length;
    return {label: i===7 ? 'Sem.' : `S-${weeksAgo}`, count};
  });
}

function buildBarChart(data) {
  const W=340,H=110,maxVal=Math.max(...data.map(d=>d.count),1),n=data.length,bW=Math.floor((W-30)/n)-5;
  const bars=data.map((d,i)=>{
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
  if(points.length<2) return '<div style="color:var(--text-3);font-size:12px">—</div>';
  const W=320,H=100,pad={t:20,r:14,b:22,l:36},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  const vals=points.map(p=>p.y),minY=Math.min(...vals)*0.94,maxY=Math.max(...vals)*1.06,rangeY=maxY-minY||1;
  const coords=points.map((p,i)=>({x:pad.l+(i/(points.length-1))*cW,y:pad.t+cH-((p.y-minY)/rangeY)*cH,val:p.y}));
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
    <path class="chart-area" d="${areaD}"/><path class="chart-line" d="${pathD}"/>${dots}
    <text class="data-label" x="${last.x.toFixed(1)}" y="${(last.y-8).toFixed(1)}" text-anchor="middle">${Math.round(last.val)}</text>
  </svg>`;
}

function buildPRList(sessions) {
  const prs={};
  sessions.forEach(s=>s.exercises.forEach(e=>e.sets.forEach(set=>{
    if(!prs[e.name]||set.w>prs[e.name].w) prs[e.name]={w:set.w,date:s.date};
  })));
  const items=Object.entries(prs).sort((a,b)=>b[1].w-a[1].w).map(([name,pr])=>`
    <div class="pr-item">
      <div class="pr-name">${esc(name)}</div>
      <div class="pr-right"><div class="pr-weight">${pr.w} kg</div><div class="pr-date">${formatDateShort(pr.date)}</div></div>
    </div>`).join('');
  return `<div class="pr-list">${items}</div>`;
}

// ─────────────────────────────────────────────────────
// HEATMAP — fix: uses parseLocalDate
// ─────────────────────────────────────────────────────

function renderHeatmap(containerId, sessions) {
  const el = document.getElementById(containerId); if(!el) return;
  const today = new Date(); today.setHours(0,0,0,0);
  const sessionDates = new Set(sessions.map(s=>s.date));
  const DAY_LABELS = ['L','M','M','J','V','S','D'];
  const cells = Array.from({length:7},(_,i)=>{
    const d = new Date(today.getTime()-(6-i)*86400000);
    const iso = isoDate(d.getTime());
    const isToday = d.getTime()===today.getTime();
    return `<div class="hm-day ${sessionDates.has(iso)?'active':''} ${isToday?'today':''}"></div>`;
  }).join('');
  const labels = Array.from({length:7},(_,i)=>{
    const d = new Date(today.getTime()-(6-i)*86400000);
    const dow = d.getDay(); // 0=Sun
    return `<div class="hm-day-label">${DAY_LABELS[dow===0?6:dow-1]}</div>`;
  }).join('');
  el.innerHTML=`<div class="week-heatmap"><div class="heatmap-wrap"><div class="heatmap-days-labels">${labels}</div><div class="heatmap-days">${cells}</div></div></div>`;
}

// ─────────────────────────────────────────────────────
// MENU DRAWER
// ─────────────────────────────────────────────────────

function openMenu() {
  document.getElementById('drawer-overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}
function closeMenu() {
  document.getElementById('drawer-overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
}

function updateDrawerProfile() {
  const name  = PROFILE.get('name','');
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const latest = BODY_LOG.latest();
  const weight = latest.weight ? `${latest.weight} kg` : '';
  document.getElementById('drawer-avatar').textContent = initials;
  document.getElementById('drawer-profile-name').textContent = name || 'Mon Profil';
  document.getElementById('drawer-profile-sub').textContent = weight ? `${weight} · Configurer →` : 'Configurer le profil →';
}

// ─────────────────────────────────────────────────────
// PROFILE SHEET
// ─────────────────────────────────────────────────────

function openProfileSheet() {
  document.getElementById('sheet-title').textContent = 'Profil';
  renderProfileBody();
  openSheet();
}

function renderProfileBody() {
  const p = PROFILE.data;
  const latest = BODY_LOG.latest();
  const name = p.name || '';
  const initials = name ? name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) : '?';
  const sessions = DB.sessions;
  const totalVol = Math.round(sessions.reduce((a,s)=>a+s.exercises.reduce((b,e)=>b+e.sets.reduce((c,x)=>c+x.w*x.r,0),0),0));

  // Weight history line (last 8 entries)
  const bodyEntries = BODY_LOG.entries.slice(0,8).reverse();
  const weightChart = bodyEntries.length >= 2
    ? buildLineChart(bodyEntries.map(e=>({x:e.date,y:e.weight||0})).filter(p=>p.y>0))
    : '';

  document.getElementById('sheet-body').innerHTML = `
    <div class="profile-avatar-section">
      <div class="profile-big-avatar">${initials}</div>
      <div class="profile-avatar-name">${esc(name || 'Athlète')}</div>
    </div>
    <div class="profile-stats-strip">
      <div class="profile-stat-block">
        <div class="profile-stat-val">${sessions.length}</div>
        <div class="profile-stat-lbl">Séances</div>
      </div>
      <div class="profile-stat-block">
        <div class="profile-stat-val">${fmtNum(totalVol)}</div>
        <div class="profile-stat-lbl">kg vol.</div>
      </div>
      <div class="profile-stat-block">
        <div class="profile-stat-val">${latest.weight||'—'}</div>
        <div class="profile-stat-lbl">kg poids</div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Prénom / Pseudo</label>
      <input class="form-input" id="prof-name" value="${esc(name)}" placeholder="Votre nom" autocomplete="off">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">Taille (cm)</label>
        <input class="form-input" type="number" id="prof-height" value="${p.height||''}" placeholder="180" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">Objectif</label>
        <input class="form-input" id="prof-goal" value="${esc(p.goal||'')}" placeholder="Prise de masse…" autocomplete="off">
      </div>
    </div>

    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-3);margin:8px 0 12px">Ajouter une mesure</div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">Poids (kg)</label>
        <input class="form-input" type="number" step="0.1" id="meas-weight" placeholder="${latest.weight||'75'}" inputmode="decimal">
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="meas-date" value="${isoDate(Date.now())}">
      </div>
    </div>
    <div class="measurements-grid">
      <div class="form-group" style="margin:0">
        <label class="form-label">Tour de poitrine (cm)</label>
        <input class="form-input" type="number" step="0.5" id="meas-chest" placeholder="${latest.chest||'—'}" inputmode="decimal">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Tour de taille (cm)</label>
        <input class="form-input" type="number" step="0.5" id="meas-waist" placeholder="${latest.waist||'—'}" inputmode="decimal">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Tour de hanches (cm)</label>
        <input class="form-input" type="number" step="0.5" id="meas-hips" placeholder="${latest.hips||'—'}" inputmode="decimal">
      </div>
      <div class="form-group" style="margin:0">
        <label class="form-label">Tour de bras (cm)</label>
        <input class="form-input" type="number" step="0.5" id="meas-arm" placeholder="${latest.arm||'—'}" inputmode="decimal">
      </div>
    </div>

    ${weightChart ? `<div style="margin-top:16px"><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">Évolution du poids</div>${weightChart}</div>` : ''}

    ${buildMeasurementHistory()}
    <div style="height:8px"></div>
  `;

  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-primary" onclick="saveProfile()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      Enregistrer
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Fermer</button>
  `;
}

function buildMeasurementHistory() {
  const entries = BODY_LOG.entries.slice(0,5);
  if (entries.length === 0) return '';
  const rows = entries.map(e=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--border-dim)">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-3)">${formatDateShort(e.date)}</span>
      <span style="font-family:var(--font-mono);font-size:13px;color:var(--gold)">${e.weight?e.weight+' kg':'—'}</span>
      ${e.chest?`<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-2)">P:${e.chest}</span>`:''}
      ${e.waist?`<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-2)">T:${e.waist}</span>`:''}
      ${e.arm?`<span style="font-family:var(--font-mono);font-size:10px;color:var(--text-2)">B:${e.arm}</span>`:''}
    </div>`).join('');
  return `<div style="margin-top:16px"><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-3);margin-bottom:8px">Historique mesures</div>${rows}</div>`;
}

function saveProfile() {
  const name   = (document.getElementById('prof-name')?.value||'').trim();
  const height = document.getElementById('prof-height')?.value;
  const goal   = (document.getElementById('prof-goal')?.value||'').trim();

  const weight = parseFloat(document.getElementById('meas-weight')?.value);
  const date   = document.getElementById('meas-date')?.value || isoDate(Date.now());
  const chest  = parseFloat(document.getElementById('meas-chest')?.value);
  const waist  = parseFloat(document.getElementById('meas-waist')?.value);
  const hips   = parseFloat(document.getElementById('meas-hips')?.value);
  const arm    = parseFloat(document.getElementById('meas-arm')?.value);

  PROFILE.set('name', name);
  PROFILE.set('height', height);
  PROFILE.set('goal', goal);

  // Only save body log if something was entered
  if (!isNaN(weight) || !isNaN(chest) || !isNaN(waist) || !isNaN(hips) || !isNaN(arm)) {
    const entry = { date };
    if (!isNaN(weight)) entry.weight = weight;
    if (!isNaN(chest))  entry.chest  = chest;
    if (!isNaN(waist))  entry.waist  = waist;
    if (!isNaN(hips))   entry.hips   = hips;
    if (!isNaN(arm))    entry.arm    = arm;
    BODY_LOG.add(entry);
  }

  toast('Profil enregistré ✓');
  updateDrawerProfile();
  renderProfileBody(); // refresh history
}

// ─────────────────────────────────────────────────────
// SETTINGS SHEET
// ─────────────────────────────────────────────────────

function openSettingsSheet() {
  document.getElementById('sheet-title').textContent = 'Paramètres';
  document.getElementById('sheet-body').innerHTML = `
    <div class="settings-section-title">Général</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Unités de poids</div><div class="settings-row-sub">Kilogrammes (kg)</div></div>
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-3)">kg</div>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Rappels d'entraînement</div><div class="settings-row-sub">Notifications quotidiennes</div></div>
      <div class="toggle ${SETTINGS.get('reminders',false)?'on':''}" onclick="toggleSetting('reminders',this)"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Afficher le volume total</div><div class="settings-row-sub">Dans les cartes de séance</div></div>
      <div class="toggle ${SETTINGS.get('showVolume',true)?'on':''}" onclick="toggleSetting('showVolume',this)"></div>
    </div>

    <div class="settings-section-title">Données</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Exporter les données</div><div class="settings-row-sub">Télécharger en JSON</div></div>
      <button class="btn btn-secondary" style="width:auto;padding:8px 14px;font-size:10px" onclick="exportData()">Exporter</button>
    </div>

    <div class="danger-zone" style="margin-top:16px">
      <div class="danger-zone-title">Zone dangereuse</div>
      <button class="btn btn-danger" onclick="confirmResetData()">Réinitialiser toutes les données</button>
    </div>
    <div style="height:8px"></div>
  `;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-secondary" onclick="closeSheet()">Fermer</button>
  `;
  openSheet();
}

function toggleSetting(key, el) {
  const current = SETTINGS.get(key, true);
  SETTINGS.set(key, !current);
  el.classList.toggle('on', !current);
}

function exportData() {
  const data = {
    sessions: DB.sessions,
    presets:  PRESETS.list,
    profile:  PROFILE.data,
    bodyLog:  BODY_LOG.entries,
    exportDate: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `strongboy-export-${isoDate(Date.now())}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('Données exportées ✓');
}

function confirmResetData() {
  document.getElementById('sheet-title').textContent = 'Réinitialiser ?';
  document.getElementById('sheet-body').innerHTML = `
    <div class="confirm-body">
      Supprimer <span class="confirm-name">toutes les données</span> (séances, presets, profil, mesures) ?
      <br><span class="confirm-warn">Cette action est totalement irréversible.</span>
    </div>`;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-danger" onclick="resetAllData()">Tout supprimer</button>
    <button class="btn btn-secondary" onclick="openSettingsSheet()">Annuler</button>`;
}

function resetAllData() {
  ['strongboy_v2','strongboy_presets','strongboy_custom_ex','strongboy_profile','strongboy_body','strongboy_settings'].forEach(k=>localStorage.removeItem(k));
  closeSheet();
  toast('Données réinitialisées','error');
  setTimeout(()=>location.reload(), 800);
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

function toast(msg, type='success') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(()=>el.remove(), 3000);
}

// ─────────────────────────────────────────────────────
// DATE UTILS  — all fixed to avoid timezone drift
// ─────────────────────────────────────────────────────

function uid(){ return Math.random().toString(36).substr(2,9)+Date.now().toString(36); }

function esc(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// Returns a Date at midnight LOCAL time for a YYYY-MM-DD string
function parseLocalDate(str) {
  if (!str) return new Date(0);
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m-1, d, 0, 0, 0, 0);
  return dt;
}

// Returns YYYY-MM-DD for a timestamp (uses local time)
function isoDate(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

// Monday 00:00 of the week containing date d (local)
function getMondayOfWeek(d) {
  const copy = new Date(d); copy.setHours(0,0,0,0);
  const dow = copy.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow; // shift to Monday
  copy.setDate(copy.getDate() + diff);
  return copy;
}

// Monday 00:00 of current week
function getWeekStart(now) {
  return getMondayOfWeek(now);
}

function formatDate(d) {
  if(!d) return '';
  return parseLocalDate(d).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
}
function formatDateShort(d) {
  if(!d) return '';
  return parseLocalDate(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}

function fmtNum(n){ return n>=1000?(n/1000).toFixed(1)+'k':String(n); }

function emptyState(icon,title,sub){
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${title}</div><div class="empty-state-sub">${sub}</div></div>`;
}

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────
renderDashboard();
updateDrawerProfile();
