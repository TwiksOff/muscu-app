/* ═══════════════════════════════════════════════════
   STRONG BOY — app.js  v3.0
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

const EX_TO_MUSCLE = {};
Object.entries(EXERCISE_LIBRARY).forEach(([m,exs]) => exs.forEach(e => { EX_TO_MUSCLE[e] = m; }));

function getMuscleForExercise(name) {
  if (EX_TO_MUSCLE[name]) return EX_TO_MUSCLE[name];
  const lower = name.toLowerCase();
  for (const [m, exs] of Object.entries(EXERCISE_LIBRARY)) {
    if (exs.some(e => e.toLowerCase().includes(lower) || lower.includes(e.toLowerCase().split(' ')[0]))) return m;
  }
  return 'Autre';
}

// ─────────────────────────────────────────────────────
// DATA STORES
// ─────────────────────────────────────────────────────

const DB = {
  _key: 'strongboy_v2',
  get sessions() { try { return JSON.parse(localStorage.getItem(this._key)||'[]'); } catch(e){ return []; } },
  save(l){ localStorage.setItem(this._key, JSON.stringify(l)); },
  add(s){ const l=this.sessions; l.unshift(s); this.save(l); },
  update(s){ const l=this.sessions; const i=l.findIndex(x=>x.id===s.id); if(i!==-1){l[i]=s; this.save(l);} },
  remove(id){ this.save(this.sessions.filter(s=>s.id!==id)); },
  find(id){ return this.sessions.find(s=>s.id===id); },
};

const PRESETS = {
  _key: 'strongboy_presets',
  get list() { try { return JSON.parse(localStorage.getItem(this._key)||'[]'); } catch(e){ return []; } },
  save(l){ localStorage.setItem(this._key, JSON.stringify(l)); },
  add(p){ const l=this.list; l.unshift(p); this.save(l); },
  update(p){ const l=this.list; const i=l.findIndex(x=>x.id===p.id); if(i!==-1){l[i]=p; this.save(l);} },
  remove(id){ this.save(this.list.filter(p=>p.id!==id)); },
  find(id){ return this.list.find(p=>p.id===id); },
};

const CUSTOM_EX = {
  _key: 'strongboy_custom_ex',
  get list() { try { return JSON.parse(localStorage.getItem(this._key)||'[]'); } catch(e){ return []; } },
  add(name){ const l=this.list; if(!l.includes(name)){l.push(name); localStorage.setItem(this._key,JSON.stringify(l));} },
};

const PROFILE = {
  _key: 'strongboy_profile',
  get data() { try { return JSON.parse(localStorage.getItem(this._key)||'{}'); } catch(e){ return {}; } },
  save(d){ localStorage.setItem(this._key, JSON.stringify(d)); },
  get(k,fb=''){ return this.data[k] ?? fb; },
  set(k,v){ const d=this.data; d[k]=v; this.save(d); },
};

const BODY_LOG = {
  _key: 'strongboy_body',
  get entries() { try { return JSON.parse(localStorage.getItem(this._key)||'[]'); } catch(e){ return []; } },
  save(l){ localStorage.setItem(this._key, JSON.stringify(l)); },
  add(e){ const l=this.entries; l.unshift(e); this.save(l); },
  latest(){ return this.entries[0] || {}; },
};

const SETTINGS = {
  _key: 'strongboy_settings',
  get data() { try { return JSON.parse(localStorage.getItem(this._key)||'{}'); } catch(e){ return {}; } },
  get(k,fb){ const v=this.data[k]; return v===undefined ? fb : v; },
  set(k,v){ const d=this.data; d[k]=v; localStorage.setItem(this._key,JSON.stringify(d)); },
};

// All localStorage keys for reset/export
const ALL_KEYS = ['strongboy_v2','strongboy_presets','strongboy_custom_ex','strongboy_profile','strongboy_body','strongboy_settings'];

function getAllKnownExercises() {
  const known = new Set([...Object.values(EXERCISE_LIBRARY).flat(), ...CUSTOM_EX.list]);
  DB.sessions.forEach(s => s.exercises.forEach(e => known.add(e.name)));
  PRESETS.list.forEach(p => p.exercises.forEach(e => known.add(e.name)));
  return [...known].sort((a,b) => a.localeCompare(b,'fr'));
}

function getLastSetsForExercise(name, excludeSessionId=null) {
  for (const s of DB.sessions) {
    if (s.id === excludeSessionId) continue;
    const ex = s.exercises.find(e => e.name === name);
    if (ex && ex.sets.length > 0) return { sets: ex.sets, date: s.date };
  }
  return null;
}

// ─────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────

function seedData() {
  if (DB.sessions.length > 0) return;
  const D=86400000, now=Date.now();
  DB.save([
    { id:'s1', name:'Push A', note:'Énergie haute, bonne séance', date:isoDate(now-D*1), duration:62,
      exercises:[
        {id:'e1',name:'Développé couché barre',      sets:[{w:100,r:8,n:''},{w:102.5,r:8,n:''},{w:105,r:6,n:'Difficile'}]},
        {id:'e2',name:'Développé incliné haltères',   sets:[{w:36,r:10,n:''},{w:36,r:10,n:''},{w:38,r:8,n:''}]},
        {id:'e3',name:'Élévations latérales haltères',sets:[{w:14,r:15,n:''},{w:14,r:15,n:''},{w:16,r:12,n:''}]},
        {id:'e4',name:'Extension triceps poulie haute',sets:[{w:32,r:12,n:''},{w:34,r:12,n:''},{w:36,r:10,n:''}]},
      ]},
    { id:'s2', name:'Pull A', note:'', date:isoDate(now-D*3), duration:55,
      exercises:[
        {id:'e5',name:'Tractions lestées',  sets:[{w:15,r:7,n:''},{w:15,r:6,n:''},{w:15,r:5,n:''}]},
        {id:'e6',name:'Rowing barre',       sets:[{w:80,r:8,n:''},{w:82.5,r:8,n:''},{w:85,r:6,n:''}]},
        {id:'e7',name:'Curl haltères assis',sets:[{w:18,r:12,n:''},{w:20,r:10,n:''},{w:20,r:9,n:''}]},
      ]},
    { id:'s3', name:'Legs A', note:'DOMS intenses !', date:isoDate(now-D*5), duration:70,
      exercises:[
        {id:'e8', name:'Squat barre',      sets:[{w:130,r:5,n:''},{w:135,r:5,n:''},{w:140,r:4,n:'PR !'}]},
        {id:'e9', name:'Presse à cuisses', sets:[{w:200,r:10,n:''},{w:220,r:10,n:''},{w:240,r:8,n:''}]},
        {id:'e10',name:'Leg curl couché',  sets:[{w:45,r:12,n:''},{w:47.5,r:12,n:''},{w:50,r:10,n:''}]},
        {id:'e11',name:'Hip thrust barre', sets:[{w:100,r:12,n:''},{w:110,r:10,n:''},{w:120,r:8,n:''}]},
      ]},
    { id:'s4', name:'Push B', note:'', date:isoDate(now-D*8), duration:58,
      exercises:[
        {id:'e12',name:'Développé couché barre',    sets:[{w:97.5,r:8,n:''},{w:100,r:8,n:''},{w:100,r:7,n:''}]},
        {id:'e13',name:'Développé militaire barre',  sets:[{w:62.5,r:6,n:''},{w:65,r:6,n:''},{w:67.5,r:5,n:''}]},
      ]},
    { id:'s5', name:'Pull B', note:'', date:isoDate(now-D*10), duration:50,
      exercises:[
        {id:'e14',name:'Tractions lestées',sets:[{w:12.5,r:6,n:''},{w:15,r:6,n:''},{w:15,r:5,n:''}]},
        {id:'e15',name:'Rowing barre',     sets:[{w:77.5,r:8,n:''},{w:80,r:8,n:''},{w:80,r:7,n:''}]},
      ]},
  ]);
  if (PRESETS.list.length === 0) {
    PRESETS.save([
      {id:'p1',name:'Push PPL',exercises:[{name:'Développé couché barre',defaultSets:3},{name:'Développé incliné haltères',defaultSets:3},{name:'Élévations latérales haltères',defaultSets:3},{name:'Extension triceps poulie haute',defaultSets:3}]},
      {id:'p2',name:'Pull PPL',exercises:[{name:'Tractions lestées',defaultSets:3},{name:'Rowing barre',defaultSets:3},{name:'Curl haltères assis',defaultSets:3},{name:'Face pull poulie',defaultSets:3}]},
      {id:'p3',name:'Legs PPL',exercises:[{name:'Squat barre',defaultSets:4},{name:'Presse à cuisses',defaultSets:3},{name:'Leg curl couché',defaultSets:3},{name:'Hip thrust barre',defaultSets:3}]},
    ]);
  }
}

// ─────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────

const PAGES = ['dashboard','sessions','detail','presets','progress'];
let _prevPage = 'sessions';

function showPage(name) {
  const current = PAGES.find(p => document.getElementById('page-'+p).classList.contains('active'));
  if (current && current !== 'detail') _prevPage = current;
  PAGES.forEach(p => document.getElementById('page-'+p).classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => btn.classList.toggle('active', btn.dataset.page===name));
  if (name==='dashboard') renderDashboard();
  if (name==='sessions')  renderSessions();
  if (name==='presets')   renderPresets();
  if (name==='progress')  renderProgress();
}

function goBackFromDetail() { showPage(_prevPage || 'sessions'); }

// ─────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────

function renderDashboard() {
  const sessions = DB.sessions;
  const now = new Date();
  const h = now.getHours();
  const profileName = PROFILE.get('name','');
  document.getElementById('greeting-label').textContent =
    (h < 12 ? 'Bonjour' : 'Bonsoir') + (profileName ? ` ${profileName.split(' ')[0]}` : '');
  document.getElementById('greeting-date').textContent =
    now.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();

  const weekStart = getWeekStart(now);
  const thisWeek = sessions.filter(s => parseLocalDate(s.date) >= weekStart);
  const uniqueEx = new Set(sessions.flatMap(s => s.exercises.map(e => e.name))).size;
  const totalVol = Math.round(sessions.reduce((a,s) => a+sessionVolume(s),0));
  const streak   = computeStreak(sessions);
  const avgDur   = computeAvgDuration(sessions);

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-pill"><div class="stat-pill-label">Total</div><div class="stat-pill-value">${sessions.length}</div><div class="stat-pill-unit">séances</div></div>
    <div class="stat-pill"><div class="stat-pill-label">Cette semaine</div><div class="stat-pill-value">${thisWeek.length}</div><div class="stat-pill-unit">séances</div></div>
    <div class="stat-pill"><div class="stat-pill-label">Volume total</div><div class="stat-pill-value">${fmtNum(totalVol)}</div><div class="stat-pill-unit">kg</div></div>
    <div class="stat-pill"><div class="stat-pill-label">Exercices</div><div class="stat-pill-value">${uniqueEx}</div><div class="stat-pill-unit">uniques</div></div>
    ${avgDur ? `<div class="stat-pill"><div class="stat-pill-label">Durée moy.</div><div class="stat-pill-value">${avgDur}</div><div class="stat-pill-unit">min / séance</div></div>` : ''}
  `;

  // Streak banner
  const streakEl = document.getElementById('streak-banner');
  if (streak > 0) {
    const nextMsg = streak >= 7 ? `🔥 Continue comme ça !` : `Encore ${7-streak} jour${7-streak>1?'s':''} pour 1 semaine`;
    streakEl.innerHTML = `
      <div class="streak-banner">
        <div class="streak-flame">🔥</div>
        <div class="streak-info">
          <div class="streak-count">${streak} jour${streak>1?'s':''}</div>
          <div class="streak-label">Série d'entraînement</div>
        </div>
        <div class="streak-next">${nextMsg}</div>
      </div>`;
  } else { streakEl.innerHTML = ''; }

  const recentEl = document.getElementById('recent-sessions');
  recentEl.innerHTML = sessions.length === 0
    ? emptyState('💪','Aucune séance','Appuyez sur + pour commencer')
    : `<div class="session-cards">${sessions.slice(0,3).map(sessionCardHTML).join('')}</div>`;

  renderHeatmap('week-heatmap-dash', sessions);
  updateDrawerProfile();
}

function computeStreak(sessions) {
  if (!sessions.length) return 0;
  const dates = new Set(sessions.map(s => s.date));
  const today = isoDate(Date.now());
  let streak = 0, cur = new Date();
  while (true) {
    const d = isoDate(cur.getTime());
    if (dates.has(d)) { streak++; cur.setDate(cur.getDate()-1); }
    else if (d === today) { cur.setDate(cur.getDate()-1); } // today not trained yet, don't break streak
    else break;
    if (streak > 365) break;
  }
  return streak;
}

function computeAvgDuration(sessions) {
  const withDur = sessions.filter(s => s.duration > 0);
  if (!withDur.length) return null;
  return Math.round(withDur.reduce((a,s) => a+s.duration, 0) / withDur.length);
}

function sessionVolume(s) {
  return s.exercises.reduce((a,e) => a+e.sets.reduce((b,x) => b+x.w*x.r, 0), 0);
}

// ─────────────────────────────────────────────────────
// SESSIONS LIST + SEARCH
// ─────────────────────────────────────────────────────

let _searchQuery = '';

function renderSessions() {
  filterSessions(_searchQuery);
}

function filterSessions(q) {
  _searchQuery = q || '';
  const sessions = DB.sessions;
  const el = document.getElementById('all-sessions');
  if (sessions.length === 0) {
    el.innerHTML = emptyState('📋','Aucune séance','Créez votre première séance\nen appuyant sur le bouton +');
    return;
  }
  const nq = normalizeStr(_searchQuery);
  const filtered = nq
    ? sessions.filter(s =>
        normalizeStr(s.name).includes(nq) ||
        normalizeStr(s.note||'').includes(nq) ||
        s.exercises.some(e => normalizeStr(e.name).includes(nq))
      )
    : sessions;

  if (filtered.length === 0) {
    el.innerHTML = emptyState('🔍','Aucun résultat',`Aucune séance ne correspond\nà "${esc(_searchQuery)}"`);
    return;
  }
  el.innerHTML = `<div class="session-cards">${filtered.map(sessionCardHTML).join('')}</div>`;
}

function sessionCardHTML(s) {
  const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
  const vol = Math.round(sessionVolume(s));
  const tags = s.exercises.slice(0,4).map(e=>`<span class="ex-tag">${esc(e.name)}</span>`).join('');
  const more = s.exercises.length>4 ? `<span class="ex-tag">+${s.exercises.length-4}</span>` : '';
  const durStr = s.duration ? `<span class="sc-meta-item"><strong>${s.duration}</strong> min</span>` : '';
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
        <span class="sc-meta-item"><strong>${fmtNum(vol)}</strong> kg vol.</span>
        ${durStr}
      </div>
      <div class="sc-tags">${tags}${more}</div>
    </div>`;
}

// ─────────────────────────────────────────────────────
// SESSION DETAIL
// ─────────────────────────────────────────────────────

let _detailSessionId = null;

function showSessionDetail(id) {
  const s = DB.find(id); if (!s) return;
  _detailSessionId = id;

  const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
  const vol = Math.round(sessionVolume(s));
  const maxW = s.exercises.length ? Math.max(...s.exercises.flatMap(e=>e.sets.map(x=>x.w))) : 0;

  // Build PR map to detect PRs per exercise
  const prMap = buildPRMap(DB.sessions);

  document.getElementById('detail-top-actions').innerHTML = `
    <div style="display:flex;gap:8px">
      <button class="icon-btn" onclick="openEditSession('${s.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn" style="color:var(--red);border-color:rgba(224,82,82,0.2)" onclick="confirmDeleteSession('${s.id}',true)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </button>
    </div>`;

  const exHTML = s.exercises.map(e => {
    const eMax = Math.max(...e.sets.map(x=>x.w));
    const eVol = Math.round(e.sets.reduce((a,x)=>a+x.w*x.r,0));
    const isPRExercise = prMap[e.name] && prMap[e.name].w === eMax && prMap[e.name].date === s.date;
    const rows = e.sets.map((set,i) => {
      const isSetPR = set.w === eMax && isPRExercise;
      return `
        <div class="set-row-display">
          <div class="set-num-disp">${i+1}</div>
          <div class="set-weight">${set.w} kg${isSetPR && set.w===eMax ? '<span class="set-pr-badge">PR</span>' : ''}</div>
          <div class="set-reps">${set.r} reps</div>
          <div class="set-vol">${Math.round(set.w*set.r)} kg</div>
        </div>
        ${set.n ? `<div class="set-note-row">"${esc(set.n)}"</div>` : ''}`;
    }).join('');
    return `
      <div class="ex-block">
        <div class="ex-block-head">
          <div class="ex-block-name">${esc(e.name)}</div>
          <div class="ex-block-summary">${eMax}kg max · ${eVol}kg vol</div>
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
        <div class="detail-stat"><div class="detail-stat-value">${fmtNum(vol)}</div><div class="detail-stat-label">kg vol.</div></div>
        <div class="detail-stat"><div class="detail-stat-value">${maxW}</div><div class="detail-stat-label">kg max</div></div>
        ${s.duration ? `<div class="detail-stat"><div class="detail-stat-value">${s.duration}</div><div class="detail-stat-label">minutes</div></div>` : ''}
      </div>
    </div>
    <div class="detail-share-strip">
      <button class="detail-share-btn" onclick="openShareCard('${s.id}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        Partager la séance
      </button>
    </div>
    <div class="section-header"><span class="section-title">Exercices</span></div>
    <div class="exercise-blocks">${exHTML}</div>
    <div style="height:20px"></div>`;

  showPage('detail');
}

// ─────────────────────────────────────────────────────
// SHARE CARD (Canvas — style Strava)
// ─────────────────────────────────────────────────────

function openShareCard(id) {
  const s = DB.find(id); if (!s) return;
  document.getElementById('sheet-title').textContent = 'Carte séance';
  document.getElementById('sheet-body').innerHTML = `
    <div class="share-preview-wrap">
      <div id="share-generating" style="padding:40px 0;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-3)">Génération en cours…</div>
      <img id="share-img" style="display:none;width:100%;border-radius:12px;border:1px solid var(--border-mid)">
      <div class="share-preview-hint">Appuyez longuement sur l'image pour l'enregistrer</div>
    </div>`;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-primary" id="share-dl-btn" style="display:none" onclick="downloadShareCard()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Télécharger l'image
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Fermer</button>`;
  openSheet();
  // Generate after sheet animation
  setTimeout(() => generateShareCanvas(s), 300);
}

function generateShareCanvas(s) {
  const canvas = document.getElementById('share-canvas');
  const W = 1080, H = 1350; // 4:5 ratio like Instagram
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0d0d0f');
  bg.addColorStop(0.5, '#131315');
  bg.addColorStop(1, '#0a0a0b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grain texture (noise overlay)
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let i=0; i<8000; i++) {
    ctx.fillRect(Math.random()*W, Math.random()*H, 1, 1);
  }

  // Gold accent top bar
  const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
  goldGrad.addColorStop(0, '#c9aa6f');
  goldGrad.addColorStop(0.6, '#c9aa6f');
  goldGrad.addColorStop(1, 'rgba(201,170,111,0)');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, W, 6);

  // App name
  ctx.fillStyle = '#ededef';
  ctx.font = 'bold 48px "DM Mono", monospace';
  ctx.letterSpacing = '8px';
  ctx.fillText('STRONG', 72, 100);
  ctx.fillStyle = '#c9aa6f';
  ctx.fillText('.BOY', 72 + ctx.measureText('STRONG').width + 4, 100);
  ctx.letterSpacing = '0px';

  // Session name
  ctx.fillStyle = '#ededef';
  ctx.font = 'bold 110px "DM Mono", monospace';
  const nameText = s.name.toUpperCase();
  const maxNameW = W - 144;
  let nameFontSize = 110;
  ctx.font = `bold ${nameFontSize}px "DM Mono", monospace`;
  while (ctx.measureText(nameText).width > maxNameW && nameFontSize > 48) {
    nameFontSize -= 4;
    ctx.font = `bold ${nameFontSize}px "DM Mono", monospace`;
  }
  ctx.fillText(nameText, 72, 210);

  // Date
  ctx.fillStyle = '#4e4e58';
  ctx.font = '38px "DM Mono", monospace';
  ctx.fillText(formatDate(s.date).toUpperCase(), 72, 278);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(72, 310); ctx.lineTo(W-72, 310); ctx.stroke();

  // Stats row (4 blocks)
  const vol = Math.round(sessionVolume(s));
  const totalSets = s.exercises.reduce((a,e)=>a+e.sets.length,0);
  const maxW2 = s.exercises.length ? Math.max(...s.exercises.flatMap(e=>e.sets.map(x=>x.w))) : 0;
  const stats = [
    { value: String(s.exercises.length), label: 'EXERCICES' },
    { value: String(totalSets), label: 'SÉRIES' },
    { value: fmtNum(vol), label: 'KG VOLUME' },
    { value: String(maxW2), label: 'KG MAX' },
    ...(s.duration ? [{ value: String(s.duration), label: 'MINUTES' }] : []),
  ];
  const colW = (W - 144) / Math.min(stats.length, 4);
  stats.slice(0,4).forEach((st, i) => {
    const x = 72 + i * colW;
    ctx.fillStyle = '#c9aa6f';
    ctx.font = `bold 72px "DM Mono", monospace`;
    ctx.fillText(st.value, x, 400);
    ctx.fillStyle = '#4e4e58';
    ctx.font = `28px "DM Mono", monospace`;
    ctx.fillText(st.label, x, 445);
  });

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(72, 480); ctx.lineTo(W-72, 480); ctx.stroke();

  // Exercise list
  const exList = s.exercises.slice(0, 6);
  const exStartY = 530;
  const exRowH = 110;
  exList.forEach((ex, i) => {
    const y = exStartY + i * exRowH;
    const exMax = Math.max(...ex.sets.map(x=>x.w));
    const exVol = Math.round(ex.sets.reduce((a,x)=>a+x.w*x.r,0));

    // Row background
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
    ctx.beginPath();
    roundRect(ctx, 72, y-16, W-144, exRowH-8, 16);
    ctx.fill();

    // Exercise name
    ctx.fillStyle = '#ededef';
    ctx.font = `500 46px "DM Mono", monospace`;
    let exName = ex.name;
    while (ctx.measureText(exName).width > 700 && exName.length > 6) exName = exName.slice(0,-1);
    if (exName !== ex.name) exName += '…';
    ctx.fillText(exName, 96, y + 28);

    // Sets summary — draw each set as a small pill
    const setsStr = ex.sets.map(s=>`${s.w}×${s.r}`).slice(0,5).join('  ');
    ctx.fillStyle = '#4e4e58';
    ctx.font = `30px "DM Mono", monospace`;
    ctx.fillText(setsStr, 96, y + 68);

    // Max weight badge
    ctx.fillStyle = 'rgba(201,170,111,0.15)';
    ctx.beginPath();
    roundRect(ctx, W-240, y+10, 168, 46, 10);
    ctx.fill();
    ctx.fillStyle = '#c9aa6f';
    ctx.font = `bold 34px "DM Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${exMax} kg`, W-156, y+40);
    ctx.textAlign = 'left';
  });

  if (s.exercises.length > 6) {
    ctx.fillStyle = '#4e4e58';
    ctx.font = `30px "DM Mono", monospace`;
    ctx.fillText(`+ ${s.exercises.length - 6} exercice(s) supplémentaire(s)`, 72, exStartY + 6*exRowH + 20);
  }

  // Note
  if (s.note) {
    const noteY = Math.max(exStartY + exList.length * exRowH + 60, H - 280);
    ctx.fillStyle = 'rgba(201,170,111,0.08)';
    ctx.beginPath();
    roundRect(ctx, 72, noteY, W-144, 100, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(201,170,111,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(72, noteY); ctx.lineTo(72, noteY+100); ctx.stroke();
    ctx.fillStyle = '#8c8c94';
    ctx.font = `italic 34px "DM Mono", monospace`;
    const noteLines = wrapText(ctx, `"${s.note}"`, W - 200, 640);
    noteLines.slice(0,2).forEach((line, li) => ctx.fillText(line, 96, noteY + 40 + li*46));
  }

  // Bottom bar
  const barY = H - 90;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(72, barY); ctx.lineTo(W-72, barY); ctx.stroke();

  ctx.fillStyle = '#4e4e58';
  ctx.font = `28px "DM Mono", monospace`;
  ctx.fillText('strongboy.app', 72, H-44);
  ctx.textAlign = 'right';
  ctx.fillText(new Date().getFullYear(), W-72, H-44);
  ctx.textAlign = 'left';

  // Display preview
  const dataUrl = canvas.toDataURL('image/png');
  const img = document.getElementById('share-img');
  const gen = document.getElementById('share-generating');
  if (img) {
    img.src = dataUrl;
    img.style.display = 'block';
    if (gen) gen.style.display = 'none';
    const dlBtn = document.getElementById('share-dl-btn');
    if (dlBtn) dlBtn.style.display = 'flex';
  }
  window._shareDataUrl = dataUrl;
  window._shareSessionName = s.name;
}

function downloadShareCard() {
  if (!window._shareDataUrl) return;
  const a = document.createElement('a');
  a.href = window._shareDataUrl;
  a.download = `strongboy-${normalizeStr(window._shareSessionName||'seance').replace(/\s+/g,'-')}-${isoDate(Date.now())}.png`;
  a.click();
  toast('Image téléchargée ✓');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.lineTo(x+w,y+h-r); ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.lineTo(x+r,y+h); ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.lineTo(x,y+r); ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth, fontSize) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line+' '+word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// ─────────────────────────────────────────────────────
// NEW / EDIT SESSION
// ─────────────────────────────────────────────────────

let _editId = null;
let _exercises = [];
let _sessionStartTime = null;

function openNewSessionModal(presetId) {
  _editId = null; _exercises = [];
  _sessionStartTime = Date.now();
  if (presetId) {
    const preset = PRESETS.find(presetId);
    if (preset) {
      _exercises = preset.exercises.map(pe => ({
        id: uid(), name: pe.name,
        sets: Array.from({length: pe.defaultSets}, () => ({w:0,r:0,n:''}))
      }));
    }
  }
  document.getElementById('sheet-title').textContent = presetId ? 'Depuis preset' : 'Nouvelle séance';
  renderSessionForm(null);
  openSheet();
}

function openEditSession(id) {
  const s = DB.find(id); if (!s) return;
  _editId = id; _exercises = JSON.parse(JSON.stringify(s.exercises));
  _sessionStartTime = null;
  document.getElementById('sheet-title').textContent = 'Modifier séance';
  renderSessionForm(s);
  openSheet();
}

function renderSessionForm(s) {
  const today = isoDate(Date.now());
  document.getElementById('sheet-body').innerHTML = `
    <div class="form-group">
      <label class="form-label">Nom de la séance</label>
      <input class="form-input" id="f-name" placeholder="Push A, Legs, Full Body…" value="${s?esc(s.name):''}" autocomplete="off">
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" type="date" id="f-date" value="${s?s.date:today}">
      </div>
      <div class="form-group">
        <label class="form-label">Durée (min)</label>
        <input class="form-input" type="number" id="f-duration" inputmode="numeric" placeholder="60" value="${s&&s.duration?s.duration:''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Note rapide</label>
      <input class="form-input" id="f-note" placeholder="Ressenti, conditions…" value="${s?esc(s.note||''):''}" autocomplete="off">
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="form-label" style="margin:0">Exercices</div>
      <button class="btn-ghost btn" style="width:auto;padding:6px 12px" onclick="addExercise()">+ Exercice</button>
    </div>
    <div id="form-exercises"></div>
    <div style="height:8px"></div>`;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-primary" onclick="saveSession()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      Enregistrer
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
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
    const lastData = ex.name ? getLastSetsForExercise(ex.name, _editId) : null;
    let prevHint = '';
    if (lastData && ex.name) {
      const maxW = Math.max(...lastData.sets.map(s=>s.w));
      prevHint = `<div style="font-family:var(--font-mono);font-size:9px;color:var(--gold);margin:0 0 8px;display:flex;align-items:center;gap:8px">
        <span>↑ Dernière fois (${formatDateShort(lastData.date)}) : ${maxW}kg × ${lastData.sets[0].r} reps</span>
        <button class="timer-start-btn" onclick="startTimer(${SETTINGS.get('defaultRest',90)})">⏱ Repos</button>
      </div>`;
    }

    const sets = ex.sets.map((set, si) => {
      const lastSet = lastData ? (lastData.sets[si] || lastData.sets[lastData.sets.length-1]) : null;
      const wPh = lastSet && !set.w ? lastSet.w : '';
      const rPh = lastSet && !set.r ? lastSet.r : '';
      return `
        <div class="form-set-row">
          <div class="set-num-label">${si+1}</div>
          <input class="form-input" type="number" step="0.5" min="0" inputmode="decimal" placeholder="${wPh}" value="${set.w||''}" oninput="_exercises[${ei}].sets[${si}].w=parseFloat(this.value)||0">
          <input class="form-input" type="number" min="0" inputmode="numeric" placeholder="${rPh}" value="${set.r||''}" oninput="_exercises[${ei}].sets[${si}].r=parseInt(this.value)||0">
          <input class="form-input" placeholder="note" value="${esc(set.n||'')}" oninput="_exercises[${ei}].sets[${si}].n=this.value" autocomplete="off">
          <button class="rm-btn" onclick="removeSet(${ei},${si})">−</button>
        </div>`;
    }).join('');

    return `
      <div class="form-ex-block">
        <div class="form-ex-header">
          <div class="ex-name-field" onclick="openPicker(${ei})">
            ${ex.name ? `<span class="ex-name-text">${esc(ex.name)}</span>` : '<span class="ex-name-placeholder">Choisir un exercice…</span>'}
            <svg class="ex-name-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <button class="rm-btn" onclick="removeExercise(${ei})">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        ${prevHint}
        <div class="form-set-header"><div></div><div class="form-label">Poids kg</div><div class="form-label">Reps</div><div class="form-label">Note</div><div></div></div>
        ${sets}
        <button class="btn btn-ghost" style="width:auto;padding:6px 0;margin-top:4px" onclick="addSet(${ei})">+ Série</button>
      </div>`;
  }).join('');
}

function addExercise() {
  _exercises.push({id:uid(),name:'',sets:[{w:0,r:0,n:''}]});
  renderFormExercises();
  setTimeout(()=>document.getElementById('sheet-body').scrollTo({top:99999,behavior:'smooth'}),50);
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
  const durVal=document.getElementById('f-duration')?.value;
  const duration=durVal?parseInt(durVal)||0:(_sessionStartTime?Math.round((Date.now()-_sessionStartTime)/60000):0);
  if(!name){toast('Entrez un nom de séance','error');return;}
  if(!date){toast('Choisissez une date','error');return;}
  const validEx=_exercises.filter(e=>e.name.trim());
  if(!validEx.length){toast('Ajoutez au moins 1 exercice','error');return;}
  const session={id:_editId||uid(),name,date,note,duration,exercises:validEx};
  if(_editId){DB.update(session);toast('Séance modifiée ✓');}
  else{DB.add(session);toast('Séance enregistrée ✓');}
  closeSheet();
  const activePage = PAGES.find(p=>document.getElementById('page-'+p).classList.contains('active'));
  if(activePage==='sessions') renderSessions();
  else if(activePage==='dashboard') renderDashboard();
  else if(activePage==='detail') showSessionDetail(session.id);
}

// ─────────────────────────────────────────────────────
// EXERCISE PICKER
// ─────────────────────────────────────────────────────

let _pickerTargetIndex = -1;
let _pickerPresetTarget = false;
let _presetPickerIndex = -1;

function openPicker(exerciseIndex) {
  _pickerTargetIndex = exerciseIndex; _pickerPresetTarget = false;
  document.getElementById('picker-search').value = '';
  renderPickerItems('');
  document.getElementById('picker-overlay').classList.add('open');
  document.getElementById('picker-sheet').classList.add('open');
  setTimeout(()=>document.getElementById('picker-search').focus(),300);
}
function openPresetPicker(index) {
  _presetPickerIndex = index; _pickerPresetTarget = true; _pickerTargetIndex = -1;
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
    if (customs.length > 0) {
      html += `<div class="picker-category">Exercices personnalisés</div>`;
      html += customs.map(n=>pickerItemHTML(n)).join('');
    }
    body.innerHTML = html; return;
  }

  const allNames = getAllKnownExercises();
  const matches = allNames.filter(n=>normalizeStr(n).includes(q));
  if (!matches.length) {
    body.innerHTML = `
      <div class="picker-no-results">Aucun résultat pour "${esc(query)}"</div>
      <div class="picker-item create" onclick="createCustomExercise('${esc(query)}')">
        <div class="picker-item-name"><div class="picker-create-icon">+</div>Créer "${esc(query)}"</div>
      </div>`;
    return;
  }
  let html = matches.map(n=>pickerItemHTML(n)).join('');
  if (!allNames.some(n=>normalizeStr(n)===q)) {
    html += `<div class="picker-item create" onclick="createCustomExercise('${esc(query)}')">
      <div class="picker-item-name"><div class="picker-create-icon">+</div>Créer "${esc(query)}"</div>
    </div>`;
  }
  body.innerHTML = html;
}

function pickerItemHTML(name) {
  const muscle = EX_TO_MUSCLE[name] || '';
  const last = getLastSetsForExercise(name);
  const prevText = last ? `${Math.max(...last.sets.map(s=>s.w))} kg × ${last.sets[0].r}` : '';
  return `
    <div class="picker-item" onclick="selectExercise('${esc(name)}')">
      <div class="picker-item-left">
        <div class="picker-item-name">${esc(name)}</div>
        ${prevText ? `<div class="picker-item-prev">↑ ${prevText}</div>` : ''}
      </div>
      ${muscle ? `<div class="picker-item-muscle">${esc(muscle)}</div>` : ''}
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
  const cleaned = name.trim(); if (!cleaned) return;
  CUSTOM_EX.add(cleaned);
  selectExercise(cleaned);
  toast(`"${cleaned}" ajouté ✓`);
}

// ─────────────────────────────────────────────────────
// REST TIMER
// ─────────────────────────────────────────────────────

let _timerInterval = null;
let _timerRemaining = 0;
let _timerTotal = 0;
const CIRCUMFERENCE = 364.4; // 2π×58

function startTimer(seconds) {
  stopTimer(true);
  _timerTotal = seconds;
  _timerRemaining = seconds;
  document.getElementById('timer-overlay').classList.add('active');
  updateTimerDisplay();
  _timerInterval = setInterval(() => {
    _timerRemaining--;
    updateTimerDisplay();
    if (_timerRemaining <= 0) {
      stopTimer(true);
      vibrateDevice([200, 100, 200]);
      toast('Repos terminé ! 💪');
    }
  }, 1000);
}

function setTimerPreset(seconds) {
  stopTimer(true);
  startTimer(seconds);
}

function stopTimer(silent=false) {
  if (_timerInterval) { clearInterval(_timerInterval); _timerInterval = null; }
  if (!silent) document.getElementById('timer-overlay').classList.remove('active');
  _timerRemaining = 0; _timerTotal = 0;
}

function adjustTimer(delta) {
  _timerRemaining = Math.max(5, _timerRemaining + delta);
  if (_timerTotal > 0) _timerTotal = Math.max(_timerTotal, _timerRemaining);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(_timerRemaining / 60);
  const secs = _timerRemaining % 60;
  document.getElementById('timer-display').textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  const prog = document.getElementById('timer-progress');
  if (prog && _timerTotal > 0) {
    const ratio = _timerRemaining / _timerTotal;
    const offset = CIRCUMFERENCE * (1 - ratio);
    prog.style.strokeDashoffset = offset;
    prog.classList.toggle('urgent', _timerRemaining <= 10);
  }
}

function vibrateDevice(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ─────────────────────────────────────────────────────
// DELETE SESSION
// ─────────────────────────────────────────────────────

function confirmDeleteSession(id, fromDetail=false) {
  const s=DB.find(id); if(!s) return;
  document.getElementById('sheet-title').textContent='Supprimer ?';
  document.getElementById('sheet-body').innerHTML=`<div class="confirm-body">Supprimer <span class="confirm-name">${esc(s.name)}</span> du ${formatDateShort(s.date)} ?<br><span class="confirm-warn">Cette action est irréversible.</span></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-danger" onclick="deleteSession('${id}',${fromDetail})">Supprimer définitivement</button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  openSheet();
}

function deleteSession(id, fromDetail) {
  DB.remove(id); toast('Séance supprimée','error'); closeSheet();
  if(fromDetail) showPage('sessions');
  else { const p=PAGES.find(p=>document.getElementById('page-'+p).classList.contains('active')); if(p==='sessions') renderSessions(); else renderDashboard(); }
}

// ─────────────────────────────────────────────────────
// PRESETS
// ─────────────────────────────────────────────────────

let _presetEditId = null;
let _presetExercises = [];

function renderPresets() {
  const presets = PRESETS.list;
  const el = document.getElementById('presets-list');
  if (!presets.length) {
    el.innerHTML = emptyState('📐','Aucun preset','Créez des modèles de séance réutilisables\nen 1 seul tap');
    return;
  }
  el.innerHTML = `<div class="preset-cards">${presets.map(presetCardHTML).join('')}</div>`;
}

function presetCardHTML(p) {
  const exTags = p.exercises.slice(0,5).map(e=>`<span class="ex-tag">${esc(e.name)}</span>`).join('');
  const more = p.exercises.length>5 ? `<span class="ex-tag">+${p.exercises.length-5}</span>` : '';
  const totalSets = p.exercises.reduce((a,e)=>a+e.defaultSets,0);
  return `
    <div class="preset-card">
      <div class="preset-card-top">
        <div class="preset-name">${esc(p.name)}</div>
        <div class="preset-meta">${p.exercises.length} exercices · ~${totalSets} séries</div>
      </div>
      <div class="preset-ex-list">${exTags}${more}</div>
      <div class="preset-card-actions">
        <button class="preset-action primary" onclick="openNewSessionModal('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Lancer
        </button>
        <button class="preset-action" onclick="openEditPreset('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Modifier
        </button>
        <button class="preset-action danger" onclick="confirmDeletePreset('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg> Suppr.
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
    <div id="preset-form-exercises"></div><div style="height:8px"></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-primary" onclick="savePreset()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      Enregistrer le preset
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;
  renderPresetFormExercises();
}
function renderPresetFormExercises() {
  const c=document.getElementById('preset-form-exercises'); if(!c) return;
  if(!_presetExercises.length){c.innerHTML=`<div style="text-align:center;padding:20px 0;color:var(--text-3);font-family:var(--font-mono);font-size:11px">Aucun exercice.</div>`;return;}
  c.innerHTML=_presetExercises.map((pe,i)=>`
    <div class="preset-ex-form-item">
      <div class="ex-name-field" style="flex:1;min-height:44px" onclick="openPresetPicker(${i})">
        ${pe.name?`<span class="ex-name-text">${esc(pe.name)}</span>`:`<span class="ex-name-placeholder">Choisir…</span>`}
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
    </div>`).join('');
}
function addPresetExercise(){ _presetExercises.push({name:'',defaultSets:3}); renderPresetFormExercises(); setTimeout(()=>document.getElementById('sheet-body').scrollTo({top:99999,behavior:'smooth'}),50); }
function removePresetExercise(i){ _presetExercises.splice(i,1); renderPresetFormExercises(); }
function savePreset() {
  const name=(document.getElementById('pf-name')?.value||'').trim();
  if(!name){toast('Entrez un nom de preset','error');return;}
  const validEx=_presetExercises.filter(e=>e.name.trim());
  if(!validEx.length){toast('Ajoutez au moins 1 exercice','error');return;}
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
// PROGRESS / STATS
// ─────────────────────────────────────────────────────

function renderProgress() {
  const sessions = DB.sessions;
  const el = document.getElementById('progress-content');
  if (!sessions.length) { el.innerHTML = emptyState('📈','Pas encore de données','Enregistrez votre première séance\npour voir vos statistiques'); return; }

  const weeklyData = buildWeeklyData(sessions);
  const muscleData = buildMuscleData(sessions);
  const exNames = [...new Set(sessions.flatMap(s=>s.exercises.map(e=>e.name)))];
  const selected = window._pEx || exNames[0] || '';
  const exData = buildExData(sessions, selected);

  el.innerHTML = `
    <div class="section-header"><span class="section-title">Séances / semaine</span></div>
    <div class="progress-section"><div class="chart-card">${buildBarChart(weeklyData)}</div></div>

    <div class="section-header"><span class="section-title">Muscles — 7 jours</span></div>
    <div class="progress-section"><div class="muscle-grid">${buildMuscleRows(muscleData,7)}</div></div>

    <div class="section-header" style="margin-top:4px"><span class="section-title">Muscles — 30 jours</span></div>
    <div class="progress-section"><div class="muscle-grid">${buildMuscleRows(muscleData,30)}</div></div>

    <div class="section-header"><span class="section-title">Progression par exercice</span></div>
    <div class="ex-selector-scroll">${exNames.slice(0,15).map(n=>`<button class="ex-sel-btn ${n===selected?'active':''}" onclick="selectPEx('${esc(n)}')">${esc(n)}</button>`).join('')}</div>
    ${exData.length < 2
      ? `<div class="progress-section"><div style="color:var(--text-3);font-family:var(--font-mono);font-size:11px;padding:10px 0">Données insuffisantes.</div></div>`
      : `<div class="progress-section">
          <div class="chart-card" style="margin-bottom:10px"><div class="chart-card-title">Charge max (kg)</div>${buildLineChart(exData.map(d=>({x:d.date,y:d.maxW})))}</div>
          <div class="chart-card"><div class="chart-card-title">Volume total (kg)</div>${buildLineChart(exData.map(d=>({x:d.date,y:d.vol})))}</div>
        </div>`}

    <div class="section-header"><span class="section-title">Records personnels</span></div>
    <div class="progress-section">${buildPRListHTML(sessions)}</div>
    <div style="height:20px"></div>`;
}

function selectPEx(name){ window._pEx=name; renderProgress(); }

function buildMuscleData(sessions) {
  const result = {};
  Object.keys(EXERCISE_LIBRARY).forEach(m => { result[m]={sessions7:0,sessions30:0,lastDate:null}; });
  result['Autre']={sessions7:0,sessions30:0,lastDate:null};
  const now=new Date(); now.setHours(0,0,0,0);
  const d7=new Date(now-7*86400000), d30=new Date(now-30*86400000);
  sessions.forEach(s=>{
    const sDate=parseLocalDate(s.date);
    const muscles=new Set(s.exercises.map(e=>getMuscleForExercise(e.name)));
    muscles.forEach(m=>{
      if(!result[m]) result[m]={sessions7:0,sessions30:0,lastDate:null};
      if(sDate>=d7) result[m].sessions7++;
      if(sDate>=d30) result[m].sessions30++;
      if(!result[m].lastDate||sDate>result[m].lastDate) result[m].lastDate=sDate;
    });
  });
  return result;
}

function buildMuscleRows(muscleData, days) {
  const entries = Object.entries(muscleData).filter(([m])=>m!=='Autre')
    .sort((a,b)=>{ const va=days===7?a[1].sessions7:a[1].sessions30,vb=days===7?b[1].sessions7:b[1].sessions30; return vb-va||(b[1].lastDate||new Date(0))-(a[1].lastDate||new Date(0)); });
  const maxFreq = Math.max(...entries.map(([,v])=>days===7?v.sessions7:v.sessions30),1);
  const now=new Date(); now.setHours(0,0,0,0);
  return entries.map(([muscle,data])=>{
    const freq=days===7?data.sessions7:data.sessions30;
    const days2=data.lastDate?Math.round((now-data.lastDate)/86400000):null;
    const lastText=days2===null?'jamais':days2===0?"aujourd'hui":days2===1?'hier':`il y a ${days2}j`;
    const ratio=freq/(days/7);
    const [bClass,bText]=freq===0?['rest','—']:ratio>=2?['hot',`${freq}×`]:ratio>=1?['warm',`${freq}×`]:['cold',`${freq}×`];
    return `<div class="muscle-row">
      <div class="muscle-row-left">
        <div class="muscle-row-name">${esc(muscle)}</div>
        <div class="muscle-row-last">Dernier : ${lastText}</div>
      </div>
      <div class="muscle-row-right">
        <span class="muscle-freq-badge ${bClass}">${bText}</span>
        <div class="muscle-bar-wrap"><div class="muscle-bar-fill" style="width:${Math.round(freq/maxFreq*100)}%"></div></div>
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

function buildWeeklyData(sessions) {
  const now=new Date(); now.setHours(0,0,0,0);
  return Array.from({length:8},(_,i)=>{
    const weeksAgo=7-i;
    const wkMon=getMondayOfWeek(new Date(now.getTime()-weeksAgo*7*86400000));
    const wkSun=new Date(wkMon.getTime()+7*86400000);
    const count=sessions.filter(s=>{const d=parseLocalDate(s.date);return d>=wkMon&&d<wkSun;}).length;
    return {label:i===7?'Sem.':`S-${weeksAgo}`,count};
  });
}

function buildBarChart(data) {
  const W=340,H=110,maxVal=Math.max(...data.map(d=>d.count),1),n=data.length,bW=Math.floor((W-30)/n)-5;
  const bars=data.map((d,i)=>{
    const x=15+i*(bW+5),bh=d.count>0?Math.max((d.count/maxVal)*(H-30),8):3,y=H-22-bh,isL=i===data.length-1;
    return `<rect class="bar-bg" x="${x}" y="${H-22-(H-30)}" width="${bW}" height="${H-30}" rx="4"/>
      <rect class="bar-fill ${isL?'latest':''}" x="${x}" y="${y}" width="${bW}" height="${bh}" rx="4"/>
      ${d.count>0?`<text class="data-label" x="${x+bW/2}" y="${y-4}" text-anchor="middle">${d.count}</text>`:''}
      <text class="axis-label" x="${x+bW/2}" y="${H-6}" text-anchor="middle">${d.label}</text>`;
  }).join('');
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><line class="axis-line" x1="10" y1="${H-22}" x2="${W-10}" y2="${H-22}"/>${bars}</svg>`;
}

function buildLineChart(points) {
  if(points.length<2) return '<div style="color:var(--text-3);font-size:12px">—</div>';
  const W=320,H=100,pad={t:20,r:14,b:22,l:36},cW=W-pad.l-pad.r,cH=H-pad.t-pad.b;
  const vals=points.map(p=>p.y),minY=Math.min(...vals)*0.94,maxY=Math.max(...vals)*1.06,rangeY=maxY-minY||1;
  const coords=points.map((p,i)=>({x:pad.l+(i/(points.length-1))*cW,y:pad.t+cH-((p.y-minY)/rangeY)*cH,val:p.y}));
  const pathD=coords.map((c,i)=>`${i===0?'M':'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaD=`${pathD} L${coords[coords.length-1].x.toFixed(1)},${pad.t+cH} L${pad.l},${pad.t+cH} Z`;
  const yLabels=[minY,maxY].map((v,i)=>`<text class="axis-label" x="${pad.l-5}" y="${pad.t+cH-i*cH+3}" text-anchor="end">${Math.round(v)}</text>`).join('');
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

function buildPRMap(sessions) {
  const prs = {};
  sessions.forEach(s => s.exercises.forEach(e => e.sets.forEach(set => {
    if (!prs[e.name] || set.w > prs[e.name].w) prs[e.name] = {w:set.w,date:s.date};
  })));
  return prs;
}

function buildPRListHTML(sessions) {
  const prs = buildPRMap(sessions);
  const items = Object.entries(prs).sort((a,b)=>b[1].w-a[1].w).map(([name,pr])=>`
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
  const el=document.getElementById(containerId); if(!el) return;
  const today=new Date(); today.setHours(0,0,0,0);
  const sessionDates=new Set(sessions.map(s=>s.date));
  const DAYS=['L','M','M','J','V','S','D'];
  const cells=Array.from({length:7},(_,i)=>{
    const d=new Date(today.getTime()-(6-i)*86400000);
    const iso=isoDate(d.getTime());
    return `<div class="hm-day ${sessionDates.has(iso)?'active':''} ${d.getTime()===today.getTime()?'today':''}"></div>`;
  }).join('');
  const labels=Array.from({length:7},(_,i)=>{
    const d=new Date(today.getTime()-(6-i)*86400000);
    const dow=d.getDay();
    return `<div class="hm-day-label">${DAYS[dow===0?6:dow-1]}</div>`;
  }).join('');
  el.innerHTML=`<div class="week-heatmap"><div class="heatmap-wrap"><div class="heatmap-days-labels">${labels}</div><div class="heatmap-days">${cells}</div></div></div>`;
}

// ─────────────────────────────────────────────────────
// DRAWER MENU
// ─────────────────────────────────────────────────────

function openMenu(){ document.getElementById('drawer-overlay').classList.add('open'); document.getElementById('drawer').classList.add('open'); }
function closeMenu(){ document.getElementById('drawer-overlay').classList.remove('open'); document.getElementById('drawer').classList.remove('open'); }

function updateDrawerProfile() {
  const name=PROFILE.get('name','');
  const initials=name?name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?';
  const latest=BODY_LOG.latest();
  const weight=latest.weight?`${latest.weight} kg`:'';
  document.getElementById('drawer-avatar').textContent=initials;
  document.getElementById('drawer-profile-name').textContent=name||'Mon Profil';
  document.getElementById('drawer-profile-sub').textContent=weight?`${weight} · Configurer →`:'Configurer le profil →';
}

// ─────────────────────────────────────────────────────
// PROFILE SHEET
// ─────────────────────────────────────────────────────

function openProfileSheet(){ document.getElementById('sheet-title').textContent='Profil'; renderProfileBody(); openSheet(); }

function renderProfileBody() {
  const p=PROFILE.data, latest=BODY_LOG.latest(), name=p.name||'';
  const initials=name?name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2):'?';
  const sessions=DB.sessions;
  const totalVol=Math.round(sessions.reduce((a,s)=>a+sessionVolume(s),0));
  const bodyEntries=BODY_LOG.entries.slice(0,8).reverse();
  const weightChart=bodyEntries.length>=2?buildLineChart(bodyEntries.map(e=>({x:e.date,y:e.weight||0})).filter(p=>p.y>0)):'';

  document.getElementById('sheet-body').innerHTML=`
    <div class="profile-avatar-section">
      <div class="profile-big-avatar">${initials}</div>
      <div class="profile-avatar-name">${esc(name||'Athlète')}</div>
    </div>
    <div class="profile-stats-strip">
      <div class="profile-stat-block"><div class="profile-stat-val">${sessions.length}</div><div class="profile-stat-lbl">Séances</div></div>
      <div class="profile-stat-block"><div class="profile-stat-val">${fmtNum(totalVol)}</div><div class="profile-stat-lbl">kg vol.</div></div>
      <div class="profile-stat-block"><div class="profile-stat-val">${latest.weight||'—'}</div><div class="profile-stat-lbl">kg poids</div></div>
    </div>
    <div class="form-group"><label class="form-label">Prénom / Pseudo</label><input class="form-input" id="prof-name" value="${esc(name)}" placeholder="Votre nom" autocomplete="off"></div>
    <div class="form-row-2">
      <div class="form-group"><label class="form-label">Taille (cm)</label><input class="form-input" type="number" id="prof-height" value="${p.height||''}" placeholder="180" inputmode="numeric"></div>
      <div class="form-group"><label class="form-label">Objectif</label><input class="form-input" id="prof-goal" value="${esc(p.goal||'')}" placeholder="Prise de masse…" autocomplete="off"></div>
    </div>
    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-3);margin:8px 0 12px">Ajouter une mesure</div>
    <div class="form-row-2">
      <div class="form-group"><label class="form-label">Poids (kg)</label><input class="form-input" type="number" step="0.1" id="meas-weight" placeholder="${latest.weight||'75'}" inputmode="decimal"></div>
      <div class="form-group"><label class="form-label">Date</label><input class="form-input" type="date" id="meas-date" value="${isoDate(Date.now())}"></div>
    </div>
    <div class="measurements-grid">
      <div class="form-group" style="margin:0"><label class="form-label">Poitrine (cm)</label><input class="form-input" type="number" step="0.5" id="meas-chest" placeholder="${latest.chest||'—'}" inputmode="decimal"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Taille (cm)</label><input class="form-input" type="number" step="0.5" id="meas-waist" placeholder="${latest.waist||'—'}" inputmode="decimal"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Hanches (cm)</label><input class="form-input" type="number" step="0.5" id="meas-hips" placeholder="${latest.hips||'—'}" inputmode="decimal"></div>
      <div class="form-group" style="margin:0"><label class="form-label">Bras (cm)</label><input class="form-input" type="number" step="0.5" id="meas-arm" placeholder="${latest.arm||'—'}" inputmode="decimal"></div>
    </div>
    ${weightChart?`<div style="margin-top:16px"><div style="font-family:var(--font-mono);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--text-3);margin-bottom:10px">Évolution du poids</div>${weightChart}</div>`:''}
    ${buildMeasurementHistory()}
    <div style="height:8px"></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-primary" onclick="saveProfile()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>Enregistrer
    </button>
    <button class="btn btn-secondary" onclick="closeSheet()">Fermer</button>`;
}

function buildMeasurementHistory() {
  const entries=BODY_LOG.entries.slice(0,5);
  if(!entries.length) return '';
  const rows=entries.map(e=>`
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
  const name=(document.getElementById('prof-name')?.value||'').trim();
  const height=document.getElementById('prof-height')?.value;
  const goal=(document.getElementById('prof-goal')?.value||'').trim();
  const weight=parseFloat(document.getElementById('meas-weight')?.value);
  const date=document.getElementById('meas-date')?.value||isoDate(Date.now());
  const chest=parseFloat(document.getElementById('meas-chest')?.value);
  const waist=parseFloat(document.getElementById('meas-waist')?.value);
  const hips=parseFloat(document.getElementById('meas-hips')?.value);
  const arm=parseFloat(document.getElementById('meas-arm')?.value);
  PROFILE.set('name',name); PROFILE.set('height',height); PROFILE.set('goal',goal);
  if(!isNaN(weight)||!isNaN(chest)||!isNaN(waist)||!isNaN(hips)||!isNaN(arm)){
    const entry={date};
    if(!isNaN(weight)) entry.weight=weight; if(!isNaN(chest)) entry.chest=chest;
    if(!isNaN(waist)) entry.waist=waist; if(!isNaN(hips)) entry.hips=hips; if(!isNaN(arm)) entry.arm=arm;
    BODY_LOG.add(entry);
  }
  toast('Profil enregistré ✓'); updateDrawerProfile(); renderProfileBody();
}

// ─────────────────────────────────────────────────────
// SETTINGS SHEET
// ─────────────────────────────────────────────────────

function openSettingsSheet() {
  document.getElementById('sheet-title').textContent='Paramètres';
  document.getElementById('sheet-body').innerHTML=`
    <div class="settings-section-title">Général</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Temps de repos par défaut</div><div class="settings-row-sub">${SETTINGS.get('defaultRest',90)}s entre les séries</div></div>
      <select class="form-input" style="width:90px;padding:8px 10px;font-size:13px" onchange="SETTINGS.set('defaultRest',parseInt(this.value))">
        ${[60,90,120,150,180,240].map(v=>`<option value="${v}" ${SETTINGS.get('defaultRest',90)==v?'selected':''}>${v}s</option>`).join('')}
      </select>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Vibrations timer</div><div class="settings-row-sub">Vibrer à la fin du repos</div></div>
      <div class="toggle ${SETTINGS.get('vibrate',true)?'on':''}" onclick="toggleSetting('vibrate',this)"></div>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Afficher le volume</div><div class="settings-row-sub">Dans les cartes de séance</div></div>
      <div class="toggle ${SETTINGS.get('showVolume',true)?'on':''}" onclick="toggleSetting('showVolume',this)"></div>
    </div>

    <div class="settings-section-title">Données</div>
    <div class="settings-row">
      <div><div class="settings-row-label">Exporter les données</div><div class="settings-row-sub">Fichier JSON complet</div></div>
      <button class="btn btn-secondary" style="width:auto;padding:8px 14px;font-size:10px" onclick="exportData()">Exporter</button>
    </div>
    <div class="settings-row">
      <div><div class="settings-row-label">Importer des données</div><div class="settings-row-sub">Depuis un export JSON</div></div>
      <button class="btn btn-secondary" style="width:auto;padding:8px 14px;font-size:10px" onclick="triggerImport()">Importer</button>
    </div>

    <div class="danger-zone" style="margin-top:16px">
      <div class="danger-zone-title">Zone dangereuse</div>
      <button class="btn btn-danger" onclick="confirmResetData()">Réinitialiser toutes les données</button>
    </div>
    <div style="height:8px"></div>`;
  document.getElementById('sheet-footer').innerHTML=`<button class="btn btn-secondary" onclick="closeSheet()">Fermer</button>`;
  openSheet();
}

function toggleSetting(key,el) {
  const cur=SETTINGS.get(key,true);
  SETTINGS.set(key,!cur); el.classList.toggle('on',!cur);
}

// ─────────────────────────────────────────────────────
// EXPORT DATA
// ─────────────────────────────────────────────────────

function exportData() {
  const data = {
    version: 3,
    exportDate: new Date().toISOString(),
    sessions: DB.sessions,
    presets:  PRESETS.list,
    customExercises: CUSTOM_EX.list,
    profile:  PROFILE.data,
    bodyLog:  BODY_LOG.entries,
    settings: SETTINGS.data,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`strongboy-export-${isoDate(Date.now())}.json`; a.click();
  URL.revokeObjectURL(url);
  toast('Données exportées ✓');
}

// ─────────────────────────────────────────────────────
// IMPORT DATA
// ─────────────────────────────────────────────────────

function triggerImport() {
  document.getElementById('import-input').click();
}

function handleImportFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      previewImport(data);
    } catch(err) {
      toast('Fichier JSON invalide','error');
    }
    input.value = ''; // reset so same file can be re-imported
  };
  reader.readAsText(file);
}

function previewImport(data) {
  // Validate structure
  const hasV2 = data.sessions && Array.isArray(data.sessions);
  const hasPresets = data.presets && Array.isArray(data.presets);
  if (!hasV2) { toast('Format non reconnu','error'); return; }

  const sessionCount = data.sessions.length;
  const presetCount  = (data.presets||[]).length;
  const bodyCount    = (data.bodyLog||[]).length;

  document.getElementById('sheet-title').textContent = 'Importer des données';
  document.getElementById('sheet-body').innerHTML = `
    <div style="padding:8px 0 16px">
      <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-3);margin-bottom:16px;letter-spacing:1px">CONTENU DU FICHIER</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-raised);border-radius:var(--r);border:1px solid var(--border-dim)">
          <span>Séances</span><span style="font-family:var(--font-mono);color:var(--gold)">${sessionCount}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-raised);border-radius:var(--r);border:1px solid var(--border-dim)">
          <span>Presets</span><span style="font-family:var(--font-mono);color:var(--gold)">${presetCount}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:12px 14px;background:var(--bg-raised);border-radius:var(--r);border:1px solid var(--border-dim)">
          <span>Mesures corporelles</span><span style="font-family:var(--font-mono);color:var(--gold)">${bodyCount}</span>
        </div>
      </div>
      <div style="margin-top:16px;padding:12px 14px;background:rgba(201,170,111,.07);border:1px solid rgba(201,170,111,.2);border-radius:var(--r)">
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--gold);margin-bottom:4px">MODE D'IMPORT</div>
        <label style="display:flex;align-items:center;gap:10px;margin-bottom:8px;cursor:pointer">
          <input type="radio" name="import-mode" value="merge" checked style="accent-color:var(--gold)">
          <span style="font-size:13px">Fusionner avec les données existantes</span>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <input type="radio" name="import-mode" value="replace" style="accent-color:var(--gold)">
          <span style="font-size:13px">Remplacer toutes les données <span style="font-family:var(--font-mono);font-size:10px;color:var(--red)">(irréversible)</span></span>
        </label>
      </div>
    </div>`;
  document.getElementById('sheet-footer').innerHTML = `
    <button class="btn btn-primary" onclick="executeImport(${JSON.stringify(JSON.stringify(data)).slice(1,-1)})">Importer maintenant</button>
    <button class="btn btn-secondary" onclick="closeSheet()">Annuler</button>`;

  // Store data on window to avoid JSON injection issues
  window._importData = data;
  document.getElementById('sheet-footer').querySelector('.btn-primary').onclick = executeImport;
  openSheet();
}

function executeImport() {
  const data = window._importData;
  if (!data) return;
  const mode = document.querySelector('input[name="import-mode"]:checked')?.value || 'merge';

  if (mode === 'replace') {
    ALL_KEYS.forEach(k => localStorage.removeItem(k));
  }

  if (data.sessions) {
    if (mode === 'merge') {
      const existing = new Set(DB.sessions.map(s=>s.id));
      const toAdd = data.sessions.filter(s=>!existing.has(s.id));
      const merged = [...DB.sessions, ...toAdd].sort((a,b)=>b.date.localeCompare(a.date));
      DB.save(merged);
    } else { DB.save(data.sessions); }
  }

  if (data.presets) {
    if (mode === 'merge') {
      const existing = new Set(PRESETS.list.map(p=>p.id));
      const toAdd = data.presets.filter(p=>!existing.has(p.id));
      PRESETS.save([...PRESETS.list, ...toAdd]);
    } else { PRESETS.save(data.presets); }
  }

  if (data.customExercises) {
    data.customExercises.forEach(e => CUSTOM_EX.add(e));
  }

  if (data.profile && mode==='replace') { PROFILE.save(data.profile); }

  if (data.bodyLog) {
    if (mode === 'merge') {
      const existing = new Set(BODY_LOG.entries.map(e=>e.date));
      const toAdd = data.bodyLog.filter(e=>!existing.has(e.date));
      BODY_LOG.save([...BODY_LOG.entries, ...toAdd].sort((a,b)=>b.date.localeCompare(a.date)));
    } else { BODY_LOG.save(data.bodyLog); }
  }

  toast(`Import réussi — ${data.sessions?.length||0} séances ✓`);
  window._importData = null;
  closeSheet();
  renderDashboard();
}

// ─────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────

function confirmResetData() {
  document.getElementById('sheet-title').textContent='Réinitialiser ?';
  document.getElementById('sheet-body').innerHTML=`<div class="confirm-body">Supprimer <span class="confirm-name">toutes les données</span> (séances, presets, profil, mesures) ?<br><span class="confirm-warn">Cette action est totalement irréversible.</span></div>`;
  document.getElementById('sheet-footer').innerHTML=`
    <button class="btn btn-danger" onclick="resetAllData()">Tout supprimer</button>
    <button class="btn btn-secondary" onclick="openSettingsSheet()">Annuler</button>`;
}

function resetAllData() {
  ALL_KEYS.forEach(k=>localStorage.removeItem(k));
  closeSheet(); toast('Données réinitialisées','error');
  setTimeout(()=>location.reload(), 800);
}

// ─────────────────────────────────────────────────────
// SHEET HELPERS
// ─────────────────────────────────────────────────────

function openSheet() {
  document.getElementById('sheet-overlay').classList.add('open');
  document.getElementById('bottom-sheet').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('bottom-sheet').classList.remove('open');
  document.body.style.overflow='';
  _pickerPresetTarget=false;
}

// ─────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────

function toast(msg, type='success') {
  const el=document.createElement('div');
  el.className=`toast ${type}`; el.textContent=msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(()=>el.remove(),3000);
}

// ─────────────────────────────────────────────────────
// DATE & UTILS
// ─────────────────────────────────────────────────────

function uid(){ return Math.random().toString(36).substr(2,9)+Date.now().toString(36); }

function esc(str){
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function parseLocalDate(str) {
  if(!str) return new Date(0);
  const [y,m,d]=str.split('-').map(Number);
  return new Date(y,m-1,d,0,0,0,0);
}

function isoDate(ts) {
  const d=new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMondayOfWeek(d) {
  const copy=new Date(d); copy.setHours(0,0,0,0);
  const dow=copy.getDay();
  copy.setDate(copy.getDate()+(dow===0?-6:1-dow));
  return copy;
}
function getWeekStart(now){ return getMondayOfWeek(now); }

function formatDate(d) {
  if(!d) return '';
  return parseLocalDate(d).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
}
function formatDateShort(d) {
  if(!d) return '';
  return parseLocalDate(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
}

function fmtNum(n){ return n>=1000?(n/1000).toFixed(1)+'k':String(Math.round(n)); }

function normalizeStr(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

function emptyState(icon,title,sub){
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${title}</div><div class="empty-state-sub">${sub}</div></div>`;
}

// ─────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────

seedData();
renderDashboard();
updateDrawerProfile();
