/* ============================================================
   app.js — Firebase auth flow, tab switching, bootstrap
   ============================================================ */
(function () {
  const modal       = document.getElementById('welcome-modal');
  const nameInput   = document.getElementById('auth-name');
  const emailInput  = document.getElementById('auth-email');
  const passInput   = document.getElementById('auth-password');
  const goBtn       = document.getElementById('welcome-go');
  const errorBox    = document.getElementById('auth-error');
  const authTabs    = document.querySelectorAll('.auth-tab');
  const modalCard   = modal.querySelector('.modal-card');

  let authMode = 'signin';

  function setMode(mode) {
    authMode = mode;
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    modalCard.dataset.mode = mode;
    goBtn.textContent = (mode === 'signup') ? 'יצירת חשבון' : 'כניסה';
    errorBox.classList.add('hidden');
  }
  authTabs.forEach(t => t.addEventListener('click', () => setMode(t.dataset.mode)));
  setMode('signin');

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
  }
  function showWelcome() { modal.classList.remove('hidden'); emailInput.focus(); }
  function hideWelcome() { modal.classList.add('hidden'); }

  function applyUser({ name, role, uid }) {
    document.getElementById('user-name').textContent =
      `${name} · ${role === 'teacher' ? 'מורה' : 'תלמיד/ה'}`;
    document.body.dataset.role = role;
    setCurrentUser(name, role);
    App.state.user.uid = uid || null;
    try { if (window.PracticeModule && PracticeModule.refresh) PracticeModule.refresh(); } catch {}
    try { if (window.TeacherModule && TeacherModule.refresh) TeacherModule.refresh(); } catch {}
  }

  async function handleSubmit() {
    const email = (emailInput.value || '').trim();
    const password = passInput.value || '';
    const name = (nameInput.value || '').trim();
    if (!email || !password) { showError('יש למלא אימייל וסיסמה.'); return; }
    if (authMode === 'signup' && !name) { showError('יש להכניס שם מלא.'); return; }
    if (password.length < 6) { showError('הסיסמה חייבת להיות לפחות 6 תווים.'); return; }
    goBtn.disabled = true;
    goBtn.textContent = '...';
    try {
      if (authMode === 'signup') await Cloud.signUp(email, password, name);
      else                       await Cloud.signIn(email, password);
    } catch (e) {
      const map = {
        'auth/invalid-email':         'אימייל לא תקין.',
        'auth/email-already-in-use':  'האימייל הזה כבר רשום — נסי כניסה.',
        'auth/user-not-found':        'לא נמצא משתמש — אולי התכוונת להירשם?',
        'auth/wrong-password':        'סיסמה שגויה.',
        'auth/invalid-credential':    'אימייל או סיסמה שגויים.',
        'auth/weak-password':         'הסיסמה חלשה מדי (לפחות 6 תווים).',
        'auth/network-request-failed':'בעיית רשת — בדקי חיבור לאינטרנט.',
      };
      showError(map[e.code] || (e.message || 'שגיאה לא ידועה.'));
      goBtn.disabled = false;
      goBtn.textContent = authMode === 'signup' ? 'יצירת חשבון' : 'כניסה';
    }
  }

  goBtn.addEventListener('click', handleSubmit);
  [nameInput, emailInput, passInput].forEach(inp => {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') goBtn.click(); });
  });

  document.getElementById('user-logout').addEventListener('click', async () => {
    const store = loadStore(); store.currentUser = null; saveStore(store);
    App.state.user = null;
    App.state.progress = null;
    if (typeof Cloud !== 'undefined' && Cloud.isEnabled()) await Cloud.signOutUser();
  });

  // ---------- Firebase REQUIRED ----------
  const cloudOk = (typeof Cloud !== 'undefined') && Cloud.init();
  if (!cloudOk) {
    // Firebase not configured — block the app entirely with a setup notice.
    document.body.dataset.cloud = 'off';
    modal.classList.remove('hidden');
    modalCard.innerHTML = `
      <h2>נדרשת הגדרת <span class="grad">Firebase</span></h2>
      <p class="lead">האתר דורש חיבור ל-Firebase (Auth + Firestore) כדי לפעול. ראי את ההוראות ב-<code>README.md</code> וב-<code>js/firebase-init.js</code>.</p>
      <div class="auth-error" style="display:block;">
        קונפיג חסר ב-<code>js/firebase-init.js</code>. עדכני את <code>FIREBASE_CONFIG</code> ו-<code>TEACHER_EMAILS</code>, ופרסי מחדש.
      </div>`;
    return;
  }

  document.body.dataset.cloud = 'on';
  Cloud.onAuthChange(async (fbUser) => {
    if (!fbUser) {
      App.state.user = null;
      App.state.progress = null;
      showWelcome();
      goBtn.disabled = false;
      return;
    }
    try {
      const doc = await Cloud.ensureUserDoc(fbUser);
      const role = doc.role || (Cloud.isTeacherEmail(fbUser.email) ? 'teacher' : 'student');
      const name = doc.name || fbUser.displayName || (fbUser.email || '').split('@')[0];
      App.state.progress = doc.progress || DEFAULT_PROGRESS();
      const store = loadStore();
      store.users[name] = {
        role,
        progress: App.state.progress,
        createdAt: store.users[name]?.createdAt || Date.now(),
      };
      store.currentUser = name;
      saveStore(store);
      applyUser({ name, role, uid: fbUser.uid });
      hideWelcome();
      goBtn.disabled = false;
      goBtn.textContent = authMode === 'signup' ? 'יצירת חשבון' : 'כניסה';
    } catch (e) {
      showError('שגיאה בטעינת המשתמש: ' + (e.message || e.code || ''));
    }
  });

  // ---------- tabs ----------
  const tabs = document.querySelectorAll('.tab');
  const modules = document.querySelectorAll('.module');
  const moduleResize = {
    plane: () => PlaneModule.resize && PlaneModule.resize(),
    mult:  () => MultModule.resize && MultModule.resize(),
    roots: () => RootsModule.resize && RootsModule.resize(),
    cis:   () => CisModule.resize && CisModule.resize(),
    helix: () => HelixModule.resize && HelixModule.resize(),
    practice: () => {},
    teacher:  () => TeacherModule.refresh && TeacherModule.refresh(),
  };
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      modules.forEach(m => m.classList.remove('active'));
      const mod = document.getElementById('module-' + target);
      if (mod) mod.classList.add('active');
      requestAnimationFrame(() => { (moduleResize[target] || (() => {}))(); });
    });
  });

  function initAll() {
    try { PlaneModule.init(); } catch (e) { console.error('PlaneModule', e); }
    try { MultModule.init(); } catch (e) { console.error('MultModule', e); }
    try { RootsModule.init(); } catch (e) { console.error('RootsModule', e); }
    try { CisModule.init(); } catch (e) { console.error('CisModule', e); }
    try { HelixModule.init(); } catch (e) { console.error('HelixModule', e); }
    try { PracticeModule.init(); } catch (e) { console.error('PracticeModule', e); }
    try { TeacherModule.init(); } catch (e) { console.error('TeacherModule', e); }
    setTimeout(() => { try { renderPendingTex(); } catch {} }, 0);
  }
  window.addEventListener('DOMContentLoaded', initAll);
  if (document.readyState !== 'loading') setTimeout(initAll, 0);

  window.addEventListener('load', () => {
    try { renderPendingTex(); } catch {}
    document.querySelectorAll('.lead, .hint, .mini-quiz').forEach(el => {
      try { autoRenderIn(el); } catch {}
    });
  });
})();
