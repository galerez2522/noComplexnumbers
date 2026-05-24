/* ============================================================
   core.js — utilities, formatters, storage
   ============================================================ */

const App = {
  state: {
    user: null,      // {name, role}
    progress: null,  // see DEFAULT_PROGRESS
  },
};

const DEFAULT_PROGRESS = () => ({
  answered: 0,
  correct: 0,
  streak: 0,
  maxStreak: 0,
  mistakes: {}, // category -> count
  history: [],  // [{qid, topic, level, correct, given, expected, mistake, t}]
});

// ---------- formatting ----------
function fmt(n, d = 2) {
  if (Math.abs(n) < 1e-9) return '0';
  return Number(n.toFixed(d)).toString();
}
function fmtZ(a, b, d = 2) {
  const ap = fmt(a, d);
  if (Math.abs(b) < 1e-9) return ap;
  const bAbs = fmt(Math.abs(b), d);
  const sign = b >= 0 ? '+' : '−';
  const bi = bAbs === '1' ? 'i' : bAbs + 'i';
  if (ap === '0') return (b >= 0 ? '' : '−') + bi;
  return `${ap} ${sign} ${bi}`;
}
const toDeg = r => r * 180 / Math.PI;
const toRad = d => d * Math.PI / 180;
const argOf = (a, b) => Math.atan2(b, a);
const magOf = (a, b) => Math.sqrt(a * a + b * b);

function piLabel(rad) {
  const k = rad / Math.PI;
  if (Math.abs(k) < 1e-6) return '0';
  if (Math.abs(k - 1) < 1e-6) return 'π';
  if (Math.abs(k + 1) < 1e-6) return '−π';
  const denoms = [2, 3, 4, 6, 12];
  for (const d of denoms) {
    const num = k * d;
    if (Math.abs(num - Math.round(num)) < 1e-6) {
      const n = Math.round(num);
      if (n === 0) return '0';
      const sign = n < 0 ? '−' : '';
      const an = Math.abs(n);
      const top = an === 1 ? '' : an;
      return `${sign}${top}π/${d}`;
    }
  }
  return `${fmt(k, 2)}π`;
}

function sub(n) {
  const subs = '₀₁₂₃₄₅₆₇₈₉';
  return String(n).split('').map(d => subs[+d]).join('');
}

// ---------- LaTeX helpers (KaTeX) ----------
function fmtZTex(a, b, d = 2) {
  const ap = fmt(a, d);
  const aZero = ap === '0';
  if (Math.abs(b) < 1e-9) return ap;
  const bAbs = fmt(Math.abs(b), d);
  const bi = bAbs === '1' ? 'i' : `${bAbs}\\,i`;
  if (aZero) return (b >= 0 ? '' : '-') + bi;
  const sign = b >= 0 ? '+' : '-';
  return `${ap} ${sign} ${bi}`;
}

function piLabelTex(rad) {
  const k = rad / Math.PI;
  if (Math.abs(k) < 1e-6) return '0';
  if (Math.abs(k - 1) < 1e-6) return '\\pi';
  if (Math.abs(k + 1) < 1e-6) return '-\\pi';
  const denoms = [2, 3, 4, 6, 12];
  for (const d of denoms) {
    const num = k * d;
    if (Math.abs(num - Math.round(num)) < 1e-6) {
      const n = Math.round(num);
      if (n === 0) return '0';
      const sign = n < 0 ? '-' : '';
      const an = Math.abs(n);
      const top = an === 1 ? '\\pi' : `${an}\\pi`;
      return `\\dfrac{${sign}${top}}{${d}}`;
    }
  }
  return `${fmt(k, 2)}\\pi`;
}

function tex(elOrId, latex, opts = {}) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  if (typeof katex === 'undefined') {
    // KaTeX not loaded yet — fallback to plain
    el.textContent = latex;
    el.dataset.pendingTex = latex;
    return;
  }
  try {
    katex.render(latex, el, { throwOnError: false, displayMode: !!opts.display, output: 'html' });
  } catch (e) {
    el.textContent = latex;
  }
}

function renderPendingTex() {
  if (typeof katex === 'undefined') return;
  document.querySelectorAll('[data-pending-tex]').forEach(el => {
    const t = el.dataset.pendingTex;
    delete el.dataset.pendingTex;
    try { katex.render(t, el, { throwOnError: false, output: 'html' }); } catch {}
  });
}

function texInline(html) {
  // wrap to allow auto-render later for q-text type content
  return html;
}

function autoRenderIn(el) {
  if (typeof renderMathInElement === 'undefined' || !el) return;
  try {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
    });
  } catch {}
}

// ---------- storage ----------
const STORAGE_KEY = 'complexMotion.v1';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: {}, currentUser: null };
    return JSON.parse(raw);
  } catch {
    return { users: {}, currentUser: null };
  }
}
function saveStore(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
  catch (e) { console.warn('storage save failed', e); }
}

function getUserProgress(name) {
  const store = loadStore();
  if (!store.users[name]) {
    store.users[name] = { progress: DEFAULT_PROGRESS(), role: 'student', createdAt: Date.now() };
    saveStore(store);
  }
  return store.users[name].progress;
}
function saveUserProgress(name, progress) {
  const store = loadStore();
  if (!store.users[name]) store.users[name] = { role: 'student', createdAt: Date.now() };
  store.users[name].progress = progress;
  saveStore(store);
  // Cloud sync if signed-in
  if (typeof Cloud !== 'undefined' && Cloud.isEnabled() && App.state.user && App.state.user.uid) {
    Cloud.queueProgressSave(App.state.user.uid, progress);
  }
}
function setCurrentUser(name, role) {
  const store = loadStore();
  if (!store.users[name]) {
    store.users[name] = { progress: DEFAULT_PROGRESS(), role, createdAt: Date.now() };
  } else {
    store.users[name].role = role;
  }
  store.currentUser = name;
  saveStore(store);
  App.state.user = { name, role };
  App.state.progress = store.users[name].progress;
}

// ---------- attach drag (used in 2D modules) ----------
function attachDrag(canvas, plot, onMove) {
  let dragging = false;
  const handler = (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    const [mx, my] = plot.toMath(cx, cy);
    onMove(mx, my);
  };
  canvas.addEventListener('mousedown', (e) => { dragging = true; handler(e); });
  canvas.addEventListener('mousemove', (e) => { if (dragging) handler(e); });
  window.addEventListener('mouseup', () => dragging = false);
  canvas.addEventListener('touchstart', (e) => { dragging = true; handler(e); e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { if (dragging) { handler(e); e.preventDefault(); } }, { passive: false });
  canvas.addEventListener('touchend', () => dragging = false);
}

// ---------- emit re-render hook for active module ----------
const ResizeHooks = [];
function onResize(fn) { ResizeHooks.push(fn); }
window.addEventListener('resize', () => ResizeHooks.forEach(fn => { try { fn(); } catch(e){} }));
