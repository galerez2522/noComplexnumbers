/* ============================================================
   plane-canvas.js — reusable 2D complex-plane class
   ============================================================ */

class ComplexPlane {
  constructor(canvas, { showUnit = false } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.showUnit = showUnit;
    this.resize();
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = rect.width; this.h = rect.height;
    this.cx = this.w / 2; this.cy = this.h / 2;
    this.scale = Math.min(this.w, this.h) / 12;
  }
  toCanvas(x, y) { return [this.cx + x * this.scale, this.cy - y * this.scale]; }
  toMath(px, py) { return [(px - this.cx) / this.scale, -(py - this.cy) / this.scale]; }
  clear() {
    this.ctx.fillStyle = '#131838';
    this.ctx.fillRect(0, 0, this.w, this.h);
  }
  drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = '#232a5c'; ctx.lineWidth = 1;
    const range = Math.ceil(this.w / this.scale / 2) + 1;
    for (let i = -range; i <= range; i++) {
      const [x1, y1] = this.toCanvas(i, -range);
      const [x2, y2] = this.toCanvas(i,  range);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const [x3, y3] = this.toCanvas(-range, i);
      const [x4, y4] = this.toCanvas( range, i);
      ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x4, y4); ctx.stroke();
    }
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, this.cy); ctx.lineTo(this.w, this.cy);
    ctx.moveTo(this.cx, 0); ctx.lineTo(this.cx, this.h);
    ctx.stroke();
    ctx.fillStyle = '#c3c8ee'; ctx.font = '12px Heebo'; ctx.textAlign = 'left';
    ctx.fillText('Re', this.w - 22, this.cy - 6);
    ctx.fillText('Im', this.cx + 6, 14);
    ctx.textAlign = 'center';
    for (let i = -range; i <= range; i++) {
      if (i === 0) continue;
      const [px] = this.toCanvas(i, 0);
      if (px > 16 && px < this.w - 16) ctx.fillText(i, px, this.cy + 14);
      const [, py] = this.toCanvas(0, i);
      ctx.textAlign = 'right';
      if (py > 14 && py < this.h - 6) ctx.fillText(i, this.cx - 6, py + 4);
      ctx.textAlign = 'center';
    }
    if (this.showUnit) {
      ctx.strokeStyle = 'rgba(34,211,238,0.5)';
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(this.cx, this.cy, this.scale, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  drawCircle(r, color = 'rgba(34,211,238,0.5)', dashed = true) {
    const ctx = this.ctx;
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    if (dashed) ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(this.cx, this.cy, r * this.scale, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  drawVector(a, b, color = '#c084fc', label = null, opts = {}) {
    const ctx = this.ctx;
    const [x, y] = this.toCanvas(a, b);
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = opts.width || 2.5;
    ctx.beginPath(); ctx.moveTo(this.cx, this.cy); ctx.lineTo(x, y); ctx.stroke();
    const ang = Math.atan2(y - this.cy, x - this.cx);
    const headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - headLen * Math.cos(ang - 0.4), y - headLen * Math.sin(ang - 0.4));
    ctx.lineTo(x - headLen * Math.cos(ang + 0.4), y - headLen * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, opts.dotR || 5, 0, Math.PI * 2); ctx.fill();
    if (label) {
      ctx.fillStyle = '#f0f1ff'; ctx.font = 'bold 14px Heebo'; ctx.textAlign = 'left';
      ctx.fillText(label, x + 8, y - 8);
    }
  }
  drawPoint(a, b, color = '#fb7185', r = 5, label = null) {
    const ctx = this.ctx;
    const [x, y] = this.toCanvas(a, b);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (label) {
      ctx.fillStyle = '#f0f1ff'; ctx.font = 'bold 13px Heebo'; ctx.textAlign = 'left';
      ctx.fillText(label, x + 8, y - 8);
    }
  }
}
