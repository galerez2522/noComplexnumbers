/* ============================================================
   module-plane.js — Module 1: complex plane
   ============================================================ */
const PlaneModule = (() => {
  let plot, planeA, planeB;

  function render() {
    const a = parseFloat(planeA.value);
    const b = parseFloat(planeB.value);
    document.getElementById('plane-a-val').textContent = fmt(a);
    document.getElementById('plane-b-val').textContent = fmt(b);
    const r = magOf(a, b);
    const th = argOf(a, b);
    const thDeg = toDeg(th);

    tex('repr-alg',  `z = ${fmtZTex(a, b)}`);
    tex('repr-polar', `r = ${fmt(r)},\\;\\; \\theta = ${fmt(thDeg,1)}^{\\circ}`);
    tex('repr-trig',  `${fmt(r)}\\bigl(\\cos ${fmt(thDeg,1)}^{\\circ} + i\\sin ${fmt(thDeg,1)}^{\\circ}\\bigr)`);
    tex('repr-cis',   `${fmt(r)}\\,\\operatorname{cis}(${fmt(thDeg,1)}^{\\circ})`);

    plot.clear();
    plot.drawGrid();
    if (r > 0.01) plot.drawCircle(r, 'rgba(0,212,255,0.35)');
    if (r > 0.05) {
      const ctx = plot.ctx;
      ctx.strokeStyle = '#ff5db1'; ctx.lineWidth = 2;
      ctx.beginPath();
      const arcR = Math.min(40, r * plot.scale * 0.4);
      ctx.arc(plot.cx, plot.cy, arcR, 0, -th, th > 0);
      ctx.stroke();
      ctx.fillStyle = '#ff5db1'; ctx.font = 'bold 13px Heebo';
      ctx.fillText('θ', plot.cx + arcR + 6, plot.cy - 4);
    }
    const ctx = plot.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.setLineDash([3, 4]);
    const [px, py] = plot.toCanvas(a, b);
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px, plot.cy);
    ctx.moveTo(px, py); ctx.lineTo(plot.cx, py);
    ctx.stroke();
    ctx.setLineDash([]);
    plot.drawVector(a, b, '#7c5cff', `z = ${fmtZ(a,b)}`);
  }

  function init() {
    const canvas = document.getElementById('canvas-plane');
    plot = new ComplexPlane(canvas);
    planeA = document.getElementById('plane-a');
    planeB = document.getElementById('plane-b');
    planeA.addEventListener('input', render);
    planeB.addEventListener('input', render);
    attachDrag(canvas, plot, (x, y) => {
      planeA.value = Math.max(-5, Math.min(5, x));
      planeB.value = Math.max(-5, Math.min(5, y));
      render();
    });
    onResize(() => { plot.resize(); render(); });
    render();
  }

  return { init, render: () => render(), resize: () => { plot.resize(); render(); } };
})();
