/* ============================================================
   module-roots.js — Module 3: roots of complex number
   ============================================================ */
const RootsModule = (() => {
  let plot, rN, rMag, rArg;
  let animK = null;

  function render() {
    const n = parseInt(rN.value);
    const mag = parseFloat(rMag.value);
    const arg = toRad(parseFloat(rArg.value));
    document.getElementById('r-n-val').textContent = n;
    document.getElementById('r-mag-val').textContent = fmt(mag);
    document.getElementById('r-arg-val').textContent = Math.round(parseFloat(rArg.value));

    const rho = Math.pow(mag, 1 / n);
    const roots = [];
    for (let k = 0; k < n; k++) {
      const ang = (arg + 2 * Math.PI * k) / n;
      roots.push({ k, ang, a: rho * Math.cos(ang), b: rho * Math.sin(ang) });
    }

    plot.clear();
    plot.drawGrid();
    plot.drawCircle(mag, 'rgba(255,93,177,0.4)');
    plot.drawCircle(rho, 'rgba(0,212,255,0.55)', false);

    const cA = mag * Math.cos(arg), cB = mag * Math.sin(arg);
    plot.drawPoint(cA, cB, '#ff5db1', 5, 'c');

    const limit = animK == null ? n : Math.min(n, animK);
    const ctx = plot.ctx;
    for (let i = 0; i < limit; i++) {
      const root = roots[i];
      ctx.strokeStyle = 'rgba(124,92,255,0.5)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      const [x1, y1] = plot.toCanvas(0, 0);
      const [x2, y2] = plot.toCanvas(root.a, root.b);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      plot.drawPoint(root.a, root.b, '#00d4ff', 6, `z${sub(i)}`);
    }
    if (animK == null && n >= 3) {
      ctx.strokeStyle = 'rgba(0,212,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      roots.forEach((r, i) => {
        const [x, y] = plot.toCanvas(r.a, r.b);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath(); ctx.stroke();
    }

    const list = document.getElementById('roots-list');
    list.innerHTML = roots.map((r, i) =>
      `<div class="root-line"><span class="root-tex" data-tex="z_{${i}} = ${fmt(rho)}\\,\\operatorname{cis}(${fmt(toDeg(r.ang),1)}^{\\circ}) = ${fmtZTex(r.a, r.b)}"></span></div>`
    ).join('');
    list.querySelectorAll('.root-tex').forEach(el => tex(el, el.dataset.tex));
  }

  function init() {
    const canvas = document.getElementById('canvas-roots');
    plot = new ComplexPlane(canvas);
    rN = document.getElementById('r-n');
    rMag = document.getElementById('r-mag');
    rArg = document.getElementById('r-arg');
    [rN, rMag, rArg].forEach(el => el.addEventListener('input', () => { animK = null; render(); }));
    document.getElementById('r-animate').addEventListener('click', () => {
      const n = parseInt(rN.value);
      animK = 0;
      let i = 0;
      const tick = () => {
        animK = ++i;
        render();
        if (i < n) setTimeout(tick, 380);
        else setTimeout(() => { animK = null; render(); }, 500);
      };
      setTimeout(tick, 200);
      render();
    });
    onResize(() => { plot.resize(); render(); });
    render();
  }

  return { init, resize: () => { if (plot) { plot.resize(); render(); } } };
})();
