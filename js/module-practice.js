/* ============================================================
   module-practice.js — Module 6: smart practice with mistake diagnosis
   ============================================================ */
const PracticeModule = (() => {
  let pool = [];
  let current = null;
  let topicFilter = 'all', levelFilter = 'all';
  let lastIds = [];

  const TOPIC_LABEL = {
    polar: 'המרה קוטבית',
    mult:  'כפל וסיבוב',
    roots: 'שורשים',
    cis:   'cis ומחזוריות',
  };

  function refreshPool() {
    pool = getQuestions(topicFilter, levelFilter);
  }

  function pickQuestion() {
    refreshPool();
    if (!pool.length) return null;
    // avoid repeating last 3
    const fresh = pool.filter(q => !lastIds.includes(q.id));
    const arr = fresh.length ? fresh : pool;
    const q = arr[Math.floor(Math.random() * arr.length)];
    lastIds.push(q.id);
    if (lastIds.length > 3) lastIds.shift();
    return q;
  }

  function renderProgress() {
    if (!App.state.progress) return;
    const p = App.state.progress;
    document.getElementById('streak-val').textContent = p.streak;
    document.getElementById('score-correct').textContent = p.correct;
    document.getElementById('score-total').textContent = p.answered;
    renderMistakeAnalysis();
  }

  function renderMistakeAnalysis() {
    const p = App.state.progress;
    const wrap = document.getElementById('mistake-categories');
    if (!p || !p.mistakes || Object.keys(p.mistakes).length === 0) {
      wrap.innerHTML = '<p style="color:var(--muted);font-size:13px;">עוד לא נאספו נתונים. ענו על כמה שאלות והניתוח יופיע כאן.</p>';
      return;
    }
    const entries = Object.entries(p.mistakes).sort((a, b) => b[1] - a[1]);
    const max = entries[0][1];
    wrap.innerHTML = entries.slice(0, 6).map(([lbl, n]) =>
      `<div class="mistake-row">
        <span class="mistake-lbl">${lbl}</span>
        <div class="mistake-bar"><div style="width:${(n/max*100).toFixed(0)}%"></div></div>
        <span class="mistake-count">${n}×</span>
      </div>`
    ).join('');
  }

  function showQuestion(q) {
    current = q;
    document.getElementById('q-topic').textContent = TOPIC_LABEL[q.topic] || q.topic;
    const qt = document.getElementById('q-text');
    qt.innerHTML = q.text;
    autoRenderIn(qt);
    const fb = document.getElementById('q-feedback');
    fb.className = 'q-feedback'; fb.textContent = '';
    document.getElementById('q-next').disabled = true;

    const inputWrap = document.getElementById('q-input-wrap');
    const choicesWrap = document.getElementById('q-choices');
    const input = document.getElementById('q-input');

    if (q.type === 'choice') {
      inputWrap.classList.add('hidden');
      choicesWrap.classList.remove('hidden');
      choicesWrap.innerHTML = '';
      q.choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch;
        btn.addEventListener('click', () => submitAnswer(ch, btn));
        choicesWrap.appendChild(btn);
      });
    } else {
      inputWrap.classList.remove('hidden');
      choicesWrap.classList.add('hidden');
      input.value = ''; input.focus();
    }
  }

  function submitAnswer(givenRaw, btn) {
    if (!current) return;
    const given = (givenRaw || '').toString().trim();
    if (!given) return;
    const correct = !!current.accept(given);
    const p = App.state.progress;
    p.answered++;
    if (correct) {
      p.correct++;
      p.streak++;
      if (p.streak > p.maxStreak) p.maxStreak = p.streak;
    } else {
      p.streak = 0;
      const mistake = current.diagnose ? current.diagnose(given) : 'טעות כללית';
      p.mistakes[mistake] = (p.mistakes[mistake] || 0) + 1;
    }
    p.history.push({
      qid: current.id, topic: current.topic, level: current.level,
      correct, given, expected: current.answer, t: Date.now(),
      mistake: correct ? null : (current.diagnose ? current.diagnose(given) : null),
    });
    if (p.history.length > 500) p.history.shift();
    if (App.state.user) saveUserProgress(App.state.user.name, p);

    // feedback
    const fb = document.getElementById('q-feedback');
    fb.classList.remove('hint');
    if (correct) {
      fb.className = 'q-feedback correct show';
      fb.innerHTML = `✅ <b>נכון!</b> ${current.explain || ''}`;
    } else {
      fb.className = 'q-feedback wrong show';
      const mistake = current.diagnose ? current.diagnose(given) : '';
      fb.innerHTML = `❌ <b>לא מדויק.</b> ${mistake ? `<br>אבחון: <i>${mistake}</i><br>` : ''}${current.explain || ''}<br><span style="color:var(--muted)">תשובה נכונה: ${current.answer}</span>`;
    }
    autoRenderIn(fb);

    // mark choice buttons
    if (current.type === 'choice' && btn) {
      btn.parentElement.querySelectorAll('button').forEach(b => {
        b.disabled = true;
        if (b.textContent === current.answer.toString()) b.classList.add('correct');
        else if (b === btn && !correct) b.classList.add('wrong');
      });
    }

    document.getElementById('q-next').disabled = false;
    renderProgress();
  }

  function init() {
    // make sure progress exists
    if (!App.state.progress && App.state.user) {
      App.state.progress = getUserProgress(App.state.user.name);
    }
    if (!App.state.progress) App.state.progress = DEFAULT_PROGRESS();

    // filters
    document.querySelectorAll('.practice-filters .filter').forEach(btn => {
      btn.addEventListener('click', () => {
        const isTopic = 'topic' in btn.dataset;
        const group = isTopic ? '[data-topic]' : '[data-level]';
        document.querySelectorAll('.practice-filters ' + group).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (isTopic) topicFilter = btn.dataset.topic;
        else levelFilter = btn.dataset.level;
        nextQuestion();
      });
    });

    document.getElementById('q-submit').addEventListener('click', () => {
      submitAnswer(document.getElementById('q-input').value);
    });
    document.getElementById('q-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAnswer(document.getElementById('q-input').value);
    });
    document.getElementById('q-next').addEventListener('click', nextQuestion);
    document.getElementById('q-skip').addEventListener('click', nextQuestion);
    document.getElementById('q-hint').addEventListener('click', () => {
      if (!current) return;
      const fb = document.getElementById('q-feedback');
      fb.className = 'q-feedback hint show';
      fb.innerHTML = `💡 <b>רמז:</b> ${current.hint}`;
      autoRenderIn(fb);
    });
    document.getElementById('practice-reset').addEventListener('click', () => {
      if (!confirm('לאפס את ההתקדמות שלך?')) return;
      App.state.progress = DEFAULT_PROGRESS();
      if (App.state.user) saveUserProgress(App.state.user.name, App.state.progress);
      renderProgress();
      nextQuestion();
    });

    renderProgress();
    nextQuestion();
  }

  function nextQuestion() {
    const q = pickQuestion();
    if (!q) {
      document.getElementById('q-text').textContent = 'אין שאלות בנושא/רמה הזו. נסי לבחור פילטרים אחרים.';
      return;
    }
    showQuestion(q);
  }

  return { init, nextQuestion };
})();
