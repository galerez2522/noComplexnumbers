/* ============================================================
   module-cis.js — Module 4: periodicity / cis
   ============================================================ */
const CisModule = (() => {
  let cisPlot, trigCanvas, trigCtx, cT;
  let playing = false;

  function render() {
    const tInPi = parseFloat(cT.value);
    const theta = tInPi * Math.PI;
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    document.getElementById('c-t-val').textContent = fmt(tInPi);
    tex('c-repr-t',   `\\theta = ${piLabelTex(theta)} \\approx ${fmt(toDeg(theta),1)}^{\\circ}`);
    tex('c-repr-cis', `\\operatorname{cis}(\\theta) = ${fmtZTex(x, y)}`);
    tex('c-repr-cos', `\\cos\\theta = ${fmt(x)}`);
    tex('c-repr-sin', `\\sin\\theta = ${fmt(y)}`);

    cisPlot.clear();
    cisPlot.drawGrid();
    const ctx = cisPlot.ctx;
    ctx.strokeStyle = '#00d4ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cisPlot.cx, cisPlot.cy, cisPlot.scale, 0, Math.PI * 2); ctx.stroke();

    // sweep arc
    ctx.strokeStyle = 'rgba(255,93,177,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cisPlot.cx, cisPlot.cy, 26, 0, -theta, theta > 0);
    ctx.stroke();

    const [px, py] = cisPlot.toCanvas(x, y);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(px, py); ctx.lineTo(px, cisPlot.cy);
    ctx.moveTo(px, py); ctx.lineTo(cisPlot.cx, py);
    ctx.stroke(); ctx.setLineDash([]);

    ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cisPlot.cx, cisPlot.cy); ctx.lineTo(px, cisPlot.cy); ctx.stroke();
    ctx.fillStyle = '#4ade80'; ctx.font = '11px Heebo';
    ctx.fillText('cos θ', (cisPlot.cx + px)/2, cisPlot.cy + 14);

    ctx.strokeStyle = '#ffb43d';
    ctx.beginPath(); ctx.moveTo(cisPlot.cx, cisPlot.cy); ctx.lineTo(cisPlot.cx, py); ctx.stroke();
    ctx.fillStyle = '#ffb43d';
    ctx.fillText('sin θ', cisPlot.cx + 6, (cisPlot.cy + py)/2);

    cisPlot.drawVector(x, y, '#ff5db1');
    cisPlot.drawPoint(x, y, '#ff5db1', 7, 'cis(θ)');

    drawTrig(theta);
  }

  function drawTrig(theta) {
    const rect = trigCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (trigCanvas.width !== rect.width * dpr || trigCanvas.height !== rect.height * dpr) {
      trigCanvas.width = rect.width * dpr;
      trigCanvas.height = rect.height * dpr;
    }
    trigCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width, h = rect.height;
    trigCtx.fillStyle = '#131838';
    trigCtx.fillRect(0, 0, w, h);

    const xMin = -4 * Math.PI, xMax = 4 * Math.PI;
    const xRange = xMax - xMin;
    const yScale = (h - 40) / 2.4;
    const cy = h / 2;
    const toX = (t) => (t - xMin) / xRange * w;
    const toY = (v) => cy - v * yScale;

    trigCtx.strokeStyle = '#a78bfa'; trigCtx.lineWidth = 1.2;
    trigCtx.beginPath(); trigCtx.moveTo(0, cy); trigCtx.lineTo(w, cy); trigCtx.stroke();

    trigCtx.strokeStyle = '#232a5c'; trigCtx.fillStyle = '#c3c8ee';
    trigCtx.font = '11px Heebo'; trigCtx.textAlign = 'center';
    for (let k = -4; k <= 4; k++) {
      const x = toX(k * Math.PI);
      trigCtx.beginPath(); trigCtx.moveTo(x, 0); trigCtx.lineTo(x, h); trigCtx.stroke();
      if (k !== 0) trigCtx.fillText(`${k}π`, x, cy + 14);
    }

    trigCtx.strokeStyle = '#4ade80'; trigCtx.lineWidth = 2;
    trigCtx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const t = xMin + (i / 400) * xRange;
      const px = toX(t), py = toY(Math.cos(t));
      if (i === 0) trigCtx.moveTo(px, py); else trigCtx.lineTo(px, py);
    }
    trigCtx.stroke();
    trigCtx.strokeStyle = '#ffb43d';
    trigCtx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const t = xMin + (i / 400) * xRange;
      const px = toX(t), py = toY(Math.sin(t));
      if (i === 0) trigCtx.moveTo(px, py); else trigCtx.lineTo(px, py);
    }
    trigCtx.stroke();

    const tx = toX(theta);
    trigCtx.strokeStyle = '#ff5db1'; trigCtx.setLineDash([4, 4]);
    trigCtx.beginPath(); trigCtx.moveTo(tx, 0); trigCtx.lineTo(tx, h); trigCtx.stroke();
    trigCtx.setLineDash([]);

    trigCtx.fillStyle = '#4ade80';
    trigCtx.beginPath(); trigCtx.arc(tx, toY(Math.cos(theta)), 5, 0, Math.PI * 2); trigCtx.fill();
    trigCtx.fillStyle = '#ffb43d';
    trigCtx.beginPath(); trigCtx.arc(tx, toY(Math.sin(theta)), 5, 0, Math.PI * 2); trigCtx.fill();

    trigCtx.font = 'bold 12px Heebo'; trigCtx.textAlign = 'left';
    trigCtx.fillStyle = '#4ade80'; trigCtx.fillText('cos θ', 12, 18);
    trigCtx.fillStyle = '#ffb43d'; trigCtx.fillText('sin θ', 12, 36);
    trigCtx.fillStyle = '#ff5db1'; trigCtx.fillText('θ הנוכחי', 12, 54);
  }

  function play() {
    if (!playing) return;
    let v = parseFloat(cT.value);
    v += 0.01;
    if (v > 4) v = -4;
    cT.value = v;
    render();
    requestAnimationFrame(play);
  }

  function init() {
    cisPlot = new ComplexPlane(document.getElementById('canvas-cis'), { showUnit: true });
    trigCanvas = document.getElementById('canvas-trig');
    trigCtx = trigCanvas.getContext('2d');
    cT = document.getElementById('c-t');
    cT.addEventListener('input', render);
    document.getElementById('c-play').addEventListener('click', (e) => {
      playing = !playing;
      e.target.textContent = playing ? '⏸ עצרי' : '▶ הרצי אוטומטית';
      if (playing) play();
    });
    onResize(() => { cisPlot.resize(); render(); });
    render();
  }

  return { init, resize: () => { if (cisPlot) { cisPlot.resize(); render(); } } };
})();
