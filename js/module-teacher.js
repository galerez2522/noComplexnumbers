/* ============================================================
   module-teacher.js — Module 7: teacher dashboard
   ============================================================ */
const TeacherModule = (() => {

  let cloudRows = null; // populated from Firestore when teacher signed-in

  function collectFromLocal() {
    const store = loadStore();
    const users = Object.entries(store.users || {});
    const rows = [];
    users.forEach(([name, info]) => {
      if ((info.role || 'student') !== 'student') return;
      const p = info.progress || DEFAULT_PROGRESS();
      rows.push(rowFrom(name, p));
    });
    return rows;
  }

  function rowFrom(name, p) {
    const topWeak = Object.entries(p.mistakes || {}).sort((a,b)=>b[1]-a[1])[0];
    return {
      name,
      answered: p.answered || 0,
      correct: p.correct || 0,
      accuracy: p.answered ? (p.correct / p.answered) : 0,
      maxStreak: p.maxStreak || 0,
      topWeak: topWeak ? topWeak[0] : '—',
      mistakes: p.mistakes || {},
    };
  }

  function aggregate(rows) {
    let totalAnswered = 0, totalCorrect = 0;
    const classMistakes = {};
    rows.forEach(r => {
      totalAnswered += r.answered;
      totalCorrect  += r.correct;
      Object.entries(r.mistakes || {}).forEach(([k,v]) => {
        classMistakes[k] = (classMistakes[k] || 0) + v;
      });
    });
    return { totalAnswered, totalCorrect, classMistakes };
  }

  async function fetchCloudIfTeacher() {
    if (typeof Cloud === 'undefined' || !Cloud.isEnabled()) return null;
    const u = App.state.user;
    if (!u || u.role !== 'teacher') return null;
    try {
      const docs = await Cloud.fetchAllStudents();
      return docs.map(d => rowFrom(d.name || d.email || '—', d.progress || DEFAULT_PROGRESS()));
    } catch (e) {
      console.warn('[Teacher] cloud fetch failed', e);
      return null;
    }
  }

  function render(rows) {
    const { totalAnswered, totalCorrect, classMistakes } = aggregate(rows);
    document.getElementById('t-students').textContent = rows.length;
    document.getElementById('t-answered').textContent = totalAnswered;
    const acc = totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0;
    document.getElementById('t-accuracy').textContent = acc + '%';
    const topClass = Object.entries(classMistakes).sort((a,b)=>b[1]-a[1])[0];
    document.getElementById('t-topweak').textContent = topClass ? topClass[0] : '—';

    const mWrap = document.getElementById('t-mistakes');
    const entries = Object.entries(classMistakes).sort((a,b)=>b[1]-a[1]);
    if (entries.length === 0) {
      mWrap.innerHTML = '<p style="color:var(--muted);font-size:13px;margin:0;">עוד לא נצברו טעויות. כשתלמידים יענו על שאלות הניתוח יופיע כאן.</p>';
    } else {
      const max = entries[0][1];
      mWrap.innerHTML = entries.slice(0, 8).map(([lbl, n]) =>
        `<div class="mistake-row">
          <span class="mistake-lbl">${lbl}</span>
          <div class="mistake-bar"><div style="width:${(n/max*100).toFixed(0)}%"></div></div>
          <span class="mistake-count">${n}×</span>
        </div>`
      ).join('');
    }

    const tbody = document.querySelector('#t-table tbody');
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">אין תלמידים עדיין. כשהם ייכנסו לאתר וירשמו, הם יופיעו כאן.</td></tr>';
    } else {
      const allowDelete = !(typeof Cloud !== 'undefined' && Cloud.isEnabled() && cloudRows);
      tbody.innerHTML = rows.sort((a,b)=>b.answered-a.answered).map(r => {
        const pct = Math.round(r.accuracy * 100);
        const cls = pct >= 75 ? 'good' : pct >= 50 ? 'mid' : 'bad';
        return `<tr>
          <td><b>${r.name}</b></td>
          <td>${r.answered}</td>
          <td><span class="accuracy-pill ${cls}">${pct}%</span></td>
          <td>${r.maxStreak}</td>
          <td>${r.topWeak}</td>
          <td>${allowDelete ? `<button class="ghost danger-row" data-name="${r.name}">⌫</button>` : '—'}</td>
        </tr>`;
      }).join('');
      tbody.querySelectorAll('.danger-row').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          if (!confirm(`למחוק את התלמיד "${name}" מהמכשיר הזה?`)) return;
          const store = loadStore();
          delete store.users[name];
          saveStore(store);
          refresh();
        });
      });
    }

    // Source indicator
    const srcEl = document.getElementById('t-source');
    if (srcEl) {
      srcEl.textContent = cloudRows
        ? `מקור הנתונים: ☁️ Firestore (${rows.length} תלמידים)`
        : `מקור הנתונים: מקומי במכשיר (${rows.length} תלמידים)`;
    }
  }

  function refresh() {
    return (async () => {
      cloudRows = await fetchCloudIfTeacher();
      const rows = cloudRows || [];
      render(rows);
    })();
  }

  function exportJSON() {
    const data = { source: 'cloud', users: cloudRows || [], exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `complex-motion-export-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function init() {
    const exportBtn = document.getElementById('t-export');
    if (exportBtn) exportBtn.addEventListener('click', exportJSON);
    refresh();
  }

  return { init, refresh };
})();

