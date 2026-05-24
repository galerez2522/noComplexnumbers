/* ============================================================
   module-helix.js — Module 5: 3D helix with Three.js
   ============================================================ */
const HelixModule = (() => {
  let scene, camera, renderer, controls, wrap;
  let curve, curveLine, projLine, sinLine, cosLine;
  let pointMarker, projMarker;
  let omega = 1, range = 4, mode = 'circle';
  let showShadow = true;
  let t0 = 0, animating = true;
  let inited = false;

  function clearGroup(g) {
    while (g.children.length) { const c = g.children.pop(); g.remove(c); if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); }
  }

  function buildCurves() {
    // remove old
    [curveLine, projLine, sinLine, cosLine].forEach(l => { if (l) { scene.remove(l); l.geometry.dispose(); l.material.dispose(); } });

    const N = 400;
    const ptsCurve = [], ptsProj = [], ptsSin = [], ptsCos = [];
    const thetaMax = range * Math.PI;
    for (let i = 0; i <= N; i++) {
      const theta = -thetaMax + (i / N) * 2 * thetaMax;
      let r = 1;
      if (mode === 'spiral') r = Math.pow(1.08, theta);
      else if (mode === 'damped') r = Math.exp(-0.12 * Math.abs(theta));
      const x = r * Math.cos(omega * theta);
      const y = r * Math.sin(omega * theta);
      const z = theta;
      ptsCurve.push(new THREE.Vector3(x, y, z));
      ptsProj.push(new THREE.Vector3(x, y, -thetaMax - 0.5));
      ptsCos.push(new THREE.Vector3(x, -thetaMax - 0.5, z));
      ptsSin.push(new THREE.Vector3(thetaMax + 0.5, y, z));
    }
    curveLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsCurve),
      new THREE.LineBasicMaterial({ color: 0xff5db1, linewidth: 3 }));
    scene.add(curveLine);

    projLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsProj),
      new THREE.LineBasicMaterial({ color: 0xffb43d, transparent: true, opacity: 0.9 }));
    scene.add(projLine);

    if (showShadow) {
      cosLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsCos),
        new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.6 }));
      scene.add(cosLine);
      sinLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ptsSin),
        new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.6 }));
      scene.add(sinLine);
    }
  }

  function init() {
    if (inited) return;
    wrap = document.getElementById('helix-canvas-wrap');
    if (!wrap || !window.THREE) return;
    inited = true;

    const w = wrap.clientWidth || 600;
    const h = wrap.clientHeight || 600;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x131838);

    camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    camera.position.set(12, 10, 16);
    camera.up.set(0, 0, 1);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    wrap.appendChild(renderer.domElement);

    if (THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
    }

    // axes
    const axisLen = 6;
    const axesMat = (c) => new THREE.LineBasicMaterial({ color: c });
    function axis(a, b, c) {
      const g = new THREE.BufferGeometry().setFromPoints([a, b]);
      return new THREE.Line(g, axesMat(c));
    }
    scene.add(axis(new THREE.Vector3(-axisLen,0,0), new THREE.Vector3(axisLen,0,0), 0xef4565));
    scene.add(axis(new THREE.Vector3(0,-axisLen,0), new THREE.Vector3(0,axisLen,0), 0x4ade80));
    scene.add(axis(new THREE.Vector3(0,0,-axisLen*3), new THREE.Vector3(0,0,axisLen*3), 0x7c5cff));

    // labels via sprites
    function makeLabel(text, color) {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 64;
      const c = cv.getContext('2d');
      c.fillStyle = color; c.font = 'bold 40px Heebo, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(text, 64, 32);
      const tex = new THREE.CanvasTexture(cv);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(1.5, 0.75, 1);
      return sp;
    }
    const lRe = makeLabel('Re', '#ef4565'); lRe.position.set(axisLen + 0.5, 0, 0); scene.add(lRe);
    const lIm = makeLabel('Im', '#4ade80'); lIm.position.set(0, axisLen + 0.5, 0); scene.add(lIm);
    const lTh = makeLabel('θ',  '#7c5cff'); lTh.position.set(0, 0, axisLen*3 + 0.5); scene.add(lTh);

    // grid on Re-Im plane at z=0
    const grid = new THREE.GridHelper(8, 8, 0x2a3070, 0x2a3070);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    buildCurves();

    // moving point
    pointMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xff5db1 })
    );
    scene.add(pointMarker);
    projMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffb43d })
    );
    scene.add(projMarker);

    // controls bindings
    const hw = document.getElementById('h-w');
    const hr = document.getElementById('h-r');
    const hm = document.getElementById('h-mode');
    const hs = document.getElementById('h-shadow');
    const hp = document.getElementById('h-play');
    hw.addEventListener('input', () => { omega = parseFloat(hw.value); document.getElementById('h-w-val').textContent = fmt(omega); buildCurves(); });
    hr.addEventListener('input', () => { range = parseFloat(hr.value); document.getElementById('h-r-val').textContent = fmt(range); buildCurves(); });
    hm.addEventListener('change', () => { mode = hm.value; buildCurves(); });
    hs.addEventListener('change', () => { showShadow = hs.checked; buildCurves(); });
    hp.addEventListener('click', () => { animating = !animating; hp.textContent = animating ? '⏸ עצרי סיבוב' : '▶ סובבי'; });

    window.addEventListener('resize', resize);
    onResize(resize);

    animate();
  }

  function animate() {
    requestAnimationFrame(animate);
    if (animating) t0 += 0.012;
    const theta = (t0 % (2 * range)) * Math.PI - range * Math.PI;
    let r = 1;
    if (mode === 'spiral') r = Math.pow(1.08, theta);
    else if (mode === 'damped') r = Math.exp(-0.12 * Math.abs(theta));
    const x = r * Math.cos(omega * theta);
    const y = r * Math.sin(omega * theta);
    pointMarker.position.set(x, y, theta);
    projMarker.position.set(x, y, -range * Math.PI - 0.5);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function resize() {
    if (!wrap || !renderer) return;
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  return { init, resize };
})();
