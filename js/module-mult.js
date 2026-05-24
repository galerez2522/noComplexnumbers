/* ============================================================
   module-mult.js — Module 2: multiplication / rotation
   ============================================================ */
const MultModule = (() => {
  let plot, mA, mB, mR, mT;
  let animT = 1;  // 0..1 progress
  let powerMode = false;
  let powerN = 1, powerMax = 6;

  function state() {
    const a = parseFloat(mA.value);
    const b = parseFloat(mB.value);
    const r = parseFloat(mR.value);
    const t = parseFloat(mT.value);
    const wA = r * Math.cos(toRad(t));
    const wB = r * Math.sin(toRad(t));
    const zwA = a * wA - b * wB;
    const zwB = a * wB + b * wA;
    return { a, b, r, tDeg: t, wA, wB, zwA, zwB };
  }

  function render() {
    const s = state();
    document.getElementById('m-a-val').textContent = fmt(s.a);
    document.getElementById('m-b-val').textContent = fmt(s.b);
    document.getElementById('m-r-val').textContent = fmt(s.r);
    document.getElementById('m-t-val').textContent = Math.round(s.tDeg);
    tex('m-repr-z',  `z = ${fmtZTex(s.a, s.b)}`);
    tex('m-repr-w',  `w = ${fmt(s.r)}\\,\\operatorname{cis}(${Math.round(s.tDeg)}^{\\circ}) = ${fmtZTex(s.wA, s.wB)}`);
    tex('m-repr-zw', `z\\cdot w = ${fmtZTex(s.zwA, s.zwB)}`);

    let msg = `סיבוב ${Math.round(s.tDeg)}°, גודל × ${fmt(s.r)}`;
    const tNorm = ((s.tDeg % 360) + 360) % 360;
    if (Math.abs(s.r - 1) < 1e-3 && Math.abs(tNorm - 90) < 1) msg = 'כפל ב־i: סיבוב מדויק של 90°';
    if (Math.abs(s.r - 1) < 1e-3 && Math.abs(tNorm - 180) < 1) msg = 'כפל ב־(−1): סיבוב 180°';
    if (Math.abs(s.r - 1) < 1e-3 && Math.abs(tNorm - 270) < 1) msg = 'כפל ב־(−i): סיבוב −90°';
    if (Math.abs(s.tDeg) < 0.5) msg = `מתיחה בלבד ב־×${fmt(s.r)}, ללא סיבוב`;
    document.getElementById('m-repr-change').textContent = msg;

    plot.clear();
    plot.drawGrid();

    const k = animT;
    const zR = magOf(s.a, s.b);
    const zTh = argOf(s.a, s.b);

    if (powerMode) {
      // show powers z^1 .. z^powerN
      let curA = 1, curB = 0;
      for (let i = 1; i <= powerMax; i++) {
        // multiply by z
        const newA = curA * s.a - curB * s.b;
        const newB = curA * s.b + curB * s.a;
        curA = newA; curB = newB;
        const visible = i <= powerN;
        if (visible) {
          const fade = i === powerN ? 1 : 0.4;
          plot.drawPoint(curA, curB, i === powerN ? '#ff5db1' : `rgba(124,92,255,${fade})`, i === powerN ? 6 : 4, `z${sub(i)}`);
        }
      }
      // spiral curve
      const ctx = plot.ctx;
      ctx.strokeStyle = 'rgba(0,212,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let t = 0; t <= powerN; t += 0.02) {
        const rr = Math.pow(zR, t);
        const tt = zTh * t;
        const [x, y] = plot.toCanvas(rr * Math.cos(tt), rr * Math.sin(tt));
        if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      return;
    }

    const interpR = 1 + (s.r - 1) * k;
    const interpT = toRad(s.tDeg) * k;
    const newR = zR * interpR;
    const newTh = zTh + interpT;
    const curA = newR * Math.cos(newTh);
    const curB = newR * Math.sin(newTh);

    if (Math.abs(s.tDeg) > 0.5 && zR > 0.01) {
      const ctx = plot.ctx;
      ctx.strokeStyle = 'rgba(255,93,177,0.6)';
      ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(plot.cx, plot.cy, newR * plot.scale, -zTh, -newTh, toRad(s.tDeg) < 0);
      ctx.stroke(); ctx.setLineDash([]);
    }

    plot.drawVector(s.a, s.b, 'rgba(124,92,255,0.4)', null, { width: 1.5 });
    plot.drawPoint(s.a, s.b, 'rgba(124,92,255,0.6)', 4, 'z');
    plot.drawPoint(s.zwA, s.zwB, 'rgba(0,212,255,0.4)', 4, 'z·w');
    plot.drawVector(curA, curB, '#ff5db1', null, { width: 3 });
    plot.drawPoint(curA, curB, '#ff5db1', 6);
  }

  function animate() {
    let start = null;
    const dur = 1200;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      animT = p < 0.5 ? 2*p*p : 1 - Math.pow(-2*p+2, 2)/2;
      render();
      if (p < 1) requestAnimationFrame(step);
      else { animT = 1; render(); }
    }
    requestAnimationFrame(step);
  }

  function animatePowers() {
    powerMode = true;
    powerN = 1;
    render();
    const tick = () => {
      powerN++;
      render();
      if (powerN < powerMax) setTimeout(tick, 600);
      else setTimeout(() => { powerMode = false; render(); }, 1500);
    };
    setTimeout(tick, 500);
  }

  function init() {
    const canvas = document.getElementById('canvas-mult');
    plot = new ComplexPlane(canvas, { showUnit: true });
    mA = document.getElementById('m-a');
    mB = document.getElementById('m-b');
    mR = document.getElementById('m-r');
    mT = document.getElementById('m-t');
    [mA, mB, mR, mT].forEach(el => el.addEventListener('input', () => { animT = 1; powerMode = false; render(); }));
    document.querySelectorAll('#module-mult .quick-buttons button').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = btn.dataset.w;
        if (w === 'i')   { mR.value = 1; mT.value = 90; }
        if (w === '-1')  { mR.value = 1; mT.value = 180; }
        if (w === '-i')  { mR.value = 1; mT.value = -90; }
        if (w === '2')   { mR.value = 2; mT.value = 0; }
        if (w === 'cis60'){ mR.value = 1; mT.value = 60; }
        if (w === 'cis45r2'){ mR.value = Math.sqrt(2); mT.value = 45; }
        animT = 0; powerMode = false;
        animate();
      });
    });
    document.getElementById('m-animate').addEventListener('click', () => { animT = 0; powerMode = false; animate(); });
    document.getElementById('m-power').addEventListener('click', animatePowers);
    attachDrag(canvas, plot, (x, y) => {
      mA.value = Math.max(-4, Math.min(4, x));
      mB.value = Math.max(-4, Math.min(4, y));
      animT = 1; powerMode = false; render();
    });
    onResize(() => { plot.resize(); render(); });
    render();
  }

  return { init, resize: () => { if (plot) { plot.resize(); render(); } } };
})();
