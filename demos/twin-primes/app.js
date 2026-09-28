/* Nymphéas · Twin's Starry Pond
 * Twin primes ≤10M laid on an even-arc-length Archimedean spiral,
 * rendered as an impressionist starry pond in Three.js (WebGL),
 * with free astronaut flight, click-selection, interval filtering,
 * viewpoint presets, auto-rotation and sporadic twinkles.
 * Zero build step; Three.js r128 via CDN chain → Canvas2D fallback. */
(function () {
  'use strict';

  var THREE_URLS = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
    'https://unpkg.com/three@0.128.0/build/three.min.js'
  ];

  var LIM = 10000000;          // sieve upper bound
  var SPIRAL_TURNS = 70;       // number of revolutions
  var OUTER_R = 420;           // outer radius of the spiral (world units)
  var SPIN_SPEED = (Math.PI * 2) / 96; // ~96s per revolution
  var PAIR_GAP = 1.35;         // world offset between the two primes of a pair

  /* ------------------------------------------------------------------ *
   * 1. Twin-prime computation (chunked sieve so the loader can breathe) *
   * ------------------------------------------------------------------ */
  function computeTwinPrimes(onProgress, done) {
    var sieve = new Uint8Array(LIM + 1);
    var MARK_CHUNK = 250000;
    var i = 2;
    function markStep() {
      var end = Math.min(i + MARK_CHUNK, Math.floor(Math.sqrt(LIM)) + 1);
      for (; i < end; i++) {
        if (!sieve[i]) {
          for (var j = i * i; j <= LIM; j += i) sieve[j] = 1;
        }
      }
      if (onProgress) onProgress(i / (Math.sqrt(LIM) + 1));
      if (i <= Math.floor(Math.sqrt(LIM))) { setTimeout(markStep, 0); return; }
      collect();
    }
    var pairs = [];
    function collect() {
      for (var p = 3; p + 2 <= LIM; p += 2) {
        if (!sieve[p] && !sieve[p + 2]) pairs.push(p);
      }
      done(pairs);
    }
    setTimeout(markStep, 0);
  }

  /* ------------------------------------------------------------------ *
   * 2. Archimedean spiral — even arc-length spacing (uniform density)   *
   * ------------------------------------------------------------------ */
  function archSpiralPoint(theta, b) {
    var r = b * theta;
    return { x: r * Math.cos(theta), z: r * Math.sin(theta), r: r };
  }
  // Arc length of r=b·θ from 0..θ:  L = (b/2)(θ√(θ²+1) + asinh θ)
  function arcLength(theta, b) {
    return 0.5 * b * (theta * Math.sqrt(theta * theta + 1) + Math.asinh(theta));
  }
  function thetaForArc(s, b, thetaMax) {
    // invert arcLength by binary search
    var lo = 0, hi = thetaMax;
    for (var k = 0; k < 40; k++) {
      var mid = 0.5 * (lo + hi);
      if (arcLength(mid, b) < s) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  // Monet impressionist palette (low-contrast green / lavender / water pink)
  var PALETTE = [
    { h: 265, s: 0.42, l: 0.74, w: 0.30 }, // lavender 淡紫
    { h: 340, s: 0.46, l: 0.79, w: 0.24 }, // water pink 水粉
    { h: 150, s: 0.28, l: 0.70, w: 0.20 }, // pale green 淡绿
    { h: 205, s: 0.38, l: 0.75, w: 0.15 }, // pale blue 淡蓝
    { h: 46, s: 0.42, l: 0.74, w: 0.05 },  // pale gold 淡金 (rare)
    { h: 60, s: 0.18, l: 0.88, w: 0.06 }   // moon white 月白
  ];
  function pickColor(rand) {
    var x = rand() * 1.0, acc = 0;
    for (var k = 0; k < PALETTE.length; k++) {
      acc += PALETTE[k].w;
      if (x <= acc) return PALETTE[k];
    }
    return PALETTE[0];
  }
  // tiny seeded PRNG for reproducible organic layout
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build the full star list from twin-prime pairs. Each pair → two stars.
  function buildStars(pairs) {
    var b = OUTER_R / (SPIRAL_TURNS * 2 * Math.PI);
    var thetaMax = SPIRAL_TURNS * 2 * Math.PI;
    var totalArc = arcLength(thetaMax, b);
    var rand = mulberry32(20260925);
    var stars = [];
    var N = pairs.length;
    for (var i = 0; i < N; i++) {
      var s = (i + 0.5) / N * totalArc;
      var theta = thetaForArc(s, b, thetaMax);
      var pt = archSpiralPoint(theta, b);
      // organic vertical ripple + gentle radial jitter
      var y = Math.sin(theta * 3.0 + i * 0.013) * 2.2 + (rand() - 0.5) * 1.6;
      var col = pickColor(rand);
      // orientation for the pair offset: perpendicular to the tangent
      var tang = theta + Math.PI / 2;
      var ox = Math.cos(tang), oz = Math.sin(tang);
      for (var k = 0; k < 2; k++) {
        var sign = k === 0 ? -1 : 1;
        var jitter = (rand() - 0.5) * 0.5;
        stars.push({
          x: pt.x + ox * sign * (PAIR_GAP + jitter),
          y: y + (rand() - 0.5) * 0.4,
          z: pt.z + oz * sign * (PAIR_GAP + jitter),
          h: col.h + (rand() - 0.5) * 14,
          s: Math.min(0.6, col.s + (rand() - 0.5) * 0.1),
          l: Math.min(0.92, col.l + (rand() - 0.5) * 0.12),
          size: 1.4 + rand() * 2.6 + (rand() < 0.06 ? 2.4 : 0),
          phase: rand() * Math.PI * 2,
          twinkle: rand() < 0.22 ? 0.6 + rand() * 0.4 : rand() * 0.18,
          value: pairs[i] + (k === 0 ? 0 : 2),
          pair: i
        });
      }
    }
    return stars;
  }

  /* ------------------------------------------------------------------ *
   * 3. Shared state                                                     *
   * ------------------------------------------------------------------ */
  var S = {
    allStars: [],
    viewStars: [],
    renderer: null, scene: null, camera: null, points: null, group: null,
    geo: null, mat: null,
    spin: 0, running: false, mode: 'none',
    // fly rig
    pos: null, yaw: 0, pitch: 0,
    keys: {}, drag: false, lastX: 0, lastY: 0,
    // filter
    lo: 3, hi: LIM,
    // selection
    selected: -1, hover: -1,
    // tween
    tween: null,
    sprites: null // fallback sprite cache
  };

  function projectToScreen(wx, wy, wz) {
    // world → screen px, accounting for group spin + camera. Returns null if behind.
    var v = new THREE.Vector3(wx, wy, wz);
    v.applyMatrix4(S.group.matrixWorld);
    v.project(S.camera);
    if (v.z > 1) return null;
    var rect = S.renderer.domElement.getBoundingClientRect();
    return {
      x: (v.x * 0.5 + 0.5) * rect.width,
      y: (-v.y * 0.5 + 0.5) * rect.height
    };
  }

  /* ------------------------------------------------------------------ *
   * 4. Three.js scene                                                   *
   * ------------------------------------------------------------------ */
  var VERT = [
    'attribute float aSize;',
    'attribute float aPhase;',
    'attribute float aTwinkle;',
    'attribute vec3 aColor;',
    'uniform float uTime;',
    'uniform float uPixel;',
    'varying vec3 vColor;',
    'varying float vBright;',
    'void main() {',
    '  vColor = aColor;',
    '  float t = uTime;',
    '  float s1 = sin(t*0.9 + aPhase);',
    '  float s2 = sin(t*0.371 + aPhase*1.7);',
    '  float s3 = sin(t*1.63 + aPhase*0.5);',
    '  float spike = pow(max(s1*s2*0.5+0.5, 0.0), 6.0) * (0.6 + 0.4*s3);',
    '  float bright = 1.0 + aTwinkle * spike * 2.4;',
    '  vBright = bright;',
    '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
    '  float dist = -mv.z;',
    '  float fog = exp(-0.0000016 * dist * dist);',
    '  vBright *= mix(0.12, 1.0, clamp(fog, 0.0, 1.0));',
    '  float ps = aSize * uPixel * (320.0 / max(dist, 1.0)) * (0.72 + 0.28*bright);',
    '  gl_PointSize = min(ps, 70.0);',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');
  var FRAG = [
    'varying vec3 vColor;',
    'varying float vBright;',
    'void main() {',
    '  vec2 uv = gl_PointCoord - 0.5;',
    '  float d = length(uv);',
    '  if (d > 0.5) discard;',
    '  float glow = pow(smoothstep(0.5, 0.0, d), 1.7);',
    '  float core = smoothstep(0.15, 0.0, d);',
    '  vec3 col = vColor * glow + vec3(1.0) * core * 0.85;',
    '  gl_FragColor = vec4(col * vBright, glow);',
    '}'
  ].join('\n');

  function buildGeometry(stars) {
    var n = stars.length;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var size = new Float32Array(n);
    var phase = new Float32Array(n);
    var twk = new Float32Array(n);
    var c = new THREE.Color();
    for (var i = 0; i < n; i++) {
      var st = stars[i];
      pos[i * 3] = st.x; pos[i * 3 + 1] = st.y; pos[i * 3 + 2] = st.z;
      c.setHSL(st.h / 360, st.s, st.l);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = st.size; phase[i] = st.phase; twk[i] = st.twinkle;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    g.setAttribute('aTwinkle', new THREE.BufferAttribute(twk, 1));
    return g;
  }

  function initThree() {
    var canvas = document.getElementById('scene');
    S.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    S.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.scene = new THREE.Scene();
    S.scene.fog = new THREE.FogExp2(0x1c2331, 0.0009);
    S.camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 1, 6000);

    S.group = new THREE.Group();
    S.scene.add(S.group);

    S.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixel: { value: S.renderer.getPixelRatio() } },
      vertexShader: VERT, fragmentShader: FRAG,
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.AdditiveBlending
    });

    rebuildPoints(S.viewStars);

    // faint pond-surface disc for grounding / reflection feel
    var discGeo = new THREE.CircleGeometry(OUTER_R * 1.06, 96);
    var discMat = new THREE.MeshBasicMaterial({
      color: 0x2a3550, transparent: true, opacity: 0.22,
      side: THREE.DoubleSide, depthWrite: false
    });
    var disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -6;
    S.group.add(disc);

    setView('overlook', true);
    bindThreeEvents();
    window.addEventListener('resize', onResize);
    S.mode = 'three';
    S.running = true;
    requestAnimationFrame(frame);
  }

  function rebuildPoints(stars) {
    S.viewStars = stars;
    if (S.points) { S.group.remove(S.points); S.geo.dispose(); }
    S.geo = buildGeometry(stars);
    S.points = new THREE.Points(S.geo, S.mat);
    S.points.frustumCulled = false;
    S.group.add(S.points);
    S.selected = -1;
    updateReadout();
  }

  function onResize() {
    if (S.mode !== 'three') return;
    S.camera.aspect = window.innerWidth / window.innerHeight;
    S.camera.updateProjectionMatrix();
    S.renderer.setSize(window.innerWidth, window.innerHeight);
    S.mat.uniforms.uPixel.value = S.renderer.getPixelRatio();
  }

  /* ------------------------------------------------------------------ *
   * 5. Fly rig + events                                                 *
   * ------------------------------------------------------------------ */
  function forwardVec() {
    var cp = Math.cos(S.pitch);
    return new THREE.Vector3(-cp * Math.sin(S.yaw), Math.sin(S.pitch), -cp * Math.cos(S.yaw));
  }
  function rightVec() {
    var f = forwardVec();
    return new THREE.Vector3(-f.z, 0, f.x).normalize(); // cross(f, up)
  }
  function applyCamera() {
    S.camera.position.copy(S.pos);
    S.camera.rotation.set(S.pitch, S.yaw, 0, 'YXZ');
  }
  function orientFrom(pos, target) {
    S.pos = pos.clone();
    var dir = new THREE.Vector3().subVectors(target, pos).normalize();
    S.pitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
    S.yaw = Math.atan2(-dir.x, -dir.z);
    applyCamera();
  }

  var VIEWS = {
    overlook: { pos: [0, 360, 560], tgt: [0, 0, 0] },
    skim:     { pos: [0, 16, 640],  tgt: [0, 0, -40] },
    core:     { pos: [0, 8, 70],    tgt: [0, 0, -30] },
    rim:      { pos: [420, 90, 420],tgt: [0, 0, 0] }
  };
  function setView(name, instant) {
    var v = VIEWS[name]; if (!v) return;
    document.querySelectorAll('.vp-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.view === name);
    });
    var toPos = new THREE.Vector3(v.pos[0], v.pos[1], v.pos[2]);
    var toTgt = new THREE.Vector3(v.tgt[0], v.tgt[1], v.tgt[2]);
    if (instant) { orientFrom(toPos, toTgt); return; }
    S.tween = {
      t: 0, dur: 1.8,
      fromPos: S.pos.clone(), toPos: toPos,
      fromYaw: S.yaw, fromPitch: S.pitch,
      toYaw: Math.atan2(-(toTgt.x - toPos.x), -(toTgt.z - toPos.z)),
      toPitch: Math.asin(Math.max(-1, Math.min(1, (toTgt.y - toPos.y) / toPos.distanceTo(toTgt))))
    };
  }
  function stepTween(dt) {
    var tw = S.tween; if (!tw) return;
    tw.t += dt / tw.dur;
    var e = tw.t >= 1 ? 1 : (tw.t < 0.5 ? 4 * tw.t * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 3) / 2);
    S.pos.lerpVectors(tw.fromPos, tw.toPos, e);
    S.yaw = tw.fromYaw + (tw.toYaw - tw.fromYaw) * e;
    S.pitch = tw.fromPitch + (tw.toPitch - tw.fromPitch) * e;
    if (tw.t >= 1) S.tween = null;
  }

  function bindThreeEvents() {
    var el = S.renderer.domElement;
    el.addEventListener('pointerdown', function (e) {
      S.drag = true; S.lastX = e.clientX; S.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      updateHover(e.clientX, e.clientY);
      if (!S.drag) return;
      var dx = e.clientX - S.lastX, dy = e.clientY - S.lastY;
      S.lastX = e.clientX; S.lastY = e.clientY;
      S.yaw -= dx * 0.0032;
      S.pitch -= dy * 0.0032;
      S.pitch = Math.max(-1.45, Math.min(1.45, S.pitch));
    });
    el.addEventListener('pointerup', function (e) {
      if (S.drag) {
        var moved = Math.abs(e.clientX - S.lastX) + Math.abs(e.clientY - S.lastY);
        S.drag = false;
        if (moved < 6) selectAt(e.clientX, e.clientY);
      }
    });
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      var f = forwardVec();
      var d = e.deltaY * 0.6;
      S.pos.addScaledVector(f, -d);
    }, { passive: false });

    window.addEventListener('keydown', function (e) { S.keys[e.code] = true; });
    window.addEventListener('keyup', function (e) { S.keys[e.code] = false; });
  }

  function movement(dt) {
    if (S.tween) return;
    var speed = (S.keys['ShiftLeft'] || S.keys['ShiftRight'] ? 260 : 110) * dt;
    var f = forwardVec();
    var r = rightVec();
    if (S.keys['KeyW']) S.pos.addScaledVector(f, speed);
    if (S.keys['KeyS']) S.pos.addScaledVector(f, -speed);
    if (S.keys['KeyD']) S.pos.addScaledVector(r, speed);
    if (S.keys['KeyA']) S.pos.addScaledVector(r, -speed);
    if (S.keys['KeyE'] || S.keys['Space']) S.pos.y += speed;
    if (S.keys['KeyQ']) S.pos.y -= speed;
    // keep from diving through the pond floor
    if (S.pos.y < -40) S.pos.y = -40;
  }

  function nearestStarAt(cx, cy, radius) {
    var best = -1, bestD = radius * radius;
    for (var i = 0; i < S.viewStars.length; i++) {
      var st = S.viewStars[i];
      var p = projectToScreen(st.x, st.y, st.z);
      if (!p) continue;
      var dx = p.x - cx, dy = p.y - cy;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function updateHover(cx, cy) {
    S.hover = nearestStarAt(cx, cy, 16);
    S.renderer.domElement.style.cursor = S.hover >= 0 ? 'pointer' : 'grab';
  }
  function selectAt(cx, cy) {
    var idx = nearestStarAt(cx, cy, 26);
    S.selected = idx;
    updateReadout();
  }

  /* ------------------------------------------------------------------ *
   * 6. Render loop                                                      *
   * ------------------------------------------------------------------ */
  var clock = null;
  function frame() {
    if (!S.running) return;
    requestAnimationFrame(frame);
    if (!clock) clock = new THREE.Clock();
    var dt = Math.min(clock.getDelta(), 0.05);
    S.spin += SPIN_SPEED * dt;
    S.group.rotation.y = S.spin;
    S.group.updateMatrixWorld();
    movement(dt);
    stepTween(dt);
    applyCamera();
    S.mat.uniforms.uTime.value += dt;
    S.renderer.render(S.scene, S.camera);
    updateSelectionVisual();
  }

  /* ------------------------------------------------------------------ *
   * 7. UI: readout, selection ring, filter, chips                       *
   * ------------------------------------------------------------------ */
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  function updateReadout() {
    var total = S.allStars.length / 2;
    var shown = S.viewStars.length / 2;
    document.getElementById('stat-total').textContent = fmt(total);
    document.getElementById('stat-shown').textContent = fmt(shown);
    var sel = document.getElementById('sel-info');
    if (S.selected >= 0 && S.viewStars[S.selected]) {
      var st = S.viewStars[S.selected];
      var twin = st.value + 2;
      sel.innerHTML =
        '<div class="sel-title">孪星对 · Twin Pair</div>' +
        '<div class="sel-vals"><b>' + fmt(st.value) + '</b><span class="sep">·</span><b>' + fmt(twin) + '</b></div>' +
        '<div class="sel-meta">Δ = 2 &nbsp;·&nbsp; 第 ' + fmt(st.pair + 1) + ' 对</div>';
      sel.classList.add('on');
    } else {
      sel.innerHTML = '<div class="sel-hint">点击任意星 · 查看孪生素数对</div>';
      sel.classList.remove('on');
    }
  }

  var ringEl = null, labelEl = null;
  function updateSelectionVisual() {
    if (!ringEl) { ringEl = document.getElementById('sel-ring'); labelEl = document.getElementById('sel-label'); }
    if (S.selected < 0 || !S.viewStars[S.selected]) {
      ringEl.style.display = 'none'; labelEl.style.display = 'none'; return;
    }
    var st = S.viewStars[S.selected];
    var p = projectToScreen(st.x, st.y, st.z);
    if (!p) { ringEl.style.display = 'none'; labelEl.style.display = 'none'; return; }
    var t = performance.now() * 0.004;
    var pulse = 12 + Math.sin(t) * 4;
    ringEl.style.display = 'block';
    ringEl.style.left = (p.x - pulse) + 'px';
    ringEl.style.top = (p.y - pulse) + 'px';
    ringEl.style.width = (pulse * 2) + 'px';
    ringEl.style.height = (pulse * 2) + 'px';
    labelEl.style.display = 'block';
    labelEl.style.left = (p.x + pulse + 8) + 'px';
    labelEl.style.top = (p.y - 10) + 'px';
    labelEl.textContent = fmt(st.value) + ' · ' + fmt(st.value + 2);
  }

  function applyFilter() {
    var lo = S.lo, hi = S.hi;
    var vs = [];
    for (var i = 0; i < S.allStars.length; i++) {
      var v = S.allStars[i].value;
      if (v >= lo && v <= hi) vs.push(S.allStars[i]);
    }
    if (S.mode === 'three') rebuildPoints(vs);
    else rebuildFallback(vs);
  }

  /* ------------------------------------------------------------------ *
   * 8. Canvas2D fallback (no WebGL / Three.js failed)                   *
   * ------------------------------------------------------------------ */
  function initFallback() {
    var canvas = document.getElementById('scene');
    var ctx = canvas.getContext('2d');
    S.fallback = { ctx: ctx, cx: window.innerWidth / 2, cy: window.innerHeight / 2, scale: 0.14, rot: 0 };
    S.mode = 'fallback';
    S.running = true;
    bindFallbackEvents();
    rebuildFallback(S.viewStars);
    requestAnimationFrame(fallbackFrame);
  }
  function fbProject(st) {
    var f = S.fallback;
    var cos = Math.cos(f.rot), sin = Math.sin(f.rot);
    var rx = st.x * cos - st.z * sin, rz = st.x * sin + st.z * cos;
    return { x: f.cx + rx * f.scale, y: f.cy + st.y * f.scale - rz * f.scale * 0.62 };
  }
  function rebuildFallback(stars) {
    S.viewStars = stars;
    S.selected = -1;
    updateReadout();
  }
  function bindFallbackEvents() {
    var el = document.getElementById('scene');
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      S.fallback.scale *= e.deltaY > 0 ? 0.9 : 1.1;
      S.fallback.scale = Math.max(0.03, Math.min(1.2, S.fallback.scale));
    }, { passive: false });
    var down = false, lx = 0, ly = 0;
    el.addEventListener('pointerdown', function (e) { down = true; lx = e.clientX; ly = e.clientY; });
    el.addEventListener('pointermove', function (e) {
      if (!down) return;
      S.fallback.rot += (e.clientX - lx) * 0.005;
      S.fallback.cy += (e.clientY - ly) * 0.5;
      lx = e.clientX; ly = e.clientY;
    });
    el.addEventListener('pointerup', function (e) {
      if (Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly) < 6) {
        var best = -1, bd = 400;
        for (var i = 0; i < S.viewStars.length; i++) {
          var p = fbProject(S.viewStars[i]);
          var d = (p.x - e.clientX) * (p.x - e.clientX) + (p.y - e.clientY) * (p.y - e.clientY);
          if (d < bd) { bd = d; best = i; }
        }
        S.selected = best; updateReadout();
      }
      down = false;
    });
  }
  function fallbackFrame() {
    if (!S.running) return;
    requestAnimationFrame(fallbackFrame);
    var f = S.fallback, ctx = f.ctx, W = window.innerWidth, H = window.innerHeight;
    f.rot += SPIN_SPEED * 0.016;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    var t = performance.now() * 0.001;
    for (var i = 0; i < S.viewStars.length; i++) {
      var st = S.viewStars[i];
      var p = fbProject(st);
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
      var tw = 0.7 + 0.3 * Math.sin(t * 1.3 + st.phase) * st.twinkle * 3;
      tw = Math.max(0.4, Math.min(2.2, tw));
      var r = st.size * f.scale * 3.2 * tw;
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(r, 1.5));
      g.addColorStop(0, 'hsla(' + st.h + ',' + Math.round(st.s * 100) + '%,' + Math.round(st.l * 100) + '%,0.9)');
      g.addColorStop(1, 'hsla(' + st.h + ',' + Math.round(st.s * 100) + '%,' + Math.round(st.l * 100) + '%,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(r, 1.5), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ------------------------------------------------------------------ *
   * 9. Boot                                                             *
   * ------------------------------------------------------------------ */
  function loadScript(urls, cb) {
    if (!urls.length) { cb(false); return; }
    var s = document.createElement('script');
    s.src = urls[0];
    s.onload = function () { cb(true); };
    s.onerror = function () { loadScript(urls.slice(1), cb); };
    document.head.appendChild(s);
  }

  function startApp() {
    // wire controls that exist in both modes
    document.querySelectorAll('.vp-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (S.mode === 'three') setView(b.dataset.view, false);
      });
    });
    var loEl = document.getElementById('range-lo');
    var hiEl = document.getElementById('range-hi');
    var loOut = document.getElementById('lo-out');
    var hiOut = document.getElementById('hi-out');
    var fTimer = null;
    function onRange() {
      S.lo = Math.min(+loEl.value, +hiEl.value - 100000);
      S.hi = Math.max(+hiEl.value, +loEl.value + 100000);
      loOut.textContent = fmt(S.lo); hiOut.textContent = fmt(S.hi);
      var span = 10000000;
      var f = document.getElementById('range-fill');
      if (f) f.style.left = (S.lo / span * 100) + '%';
      if (f) f.style.width = ((S.hi - S.lo) / span * 100) + '%';
      document.querySelectorAll('.chip').forEach(function (x) {
        x.classList.toggle('active', +x.dataset.lo === S.lo && +x.dataset.hi === S.hi);
      });
      if (fTimer) clearTimeout(fTimer);
      fTimer = setTimeout(applyFilter, 140);
    }
    loEl.addEventListener('input', onRange);
    hiEl.addEventListener('input', onRange);
    document.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        document.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('active'); });
        c.classList.add('active');
        loEl.value = c.dataset.lo; hiEl.value = c.dataset.hi;
        onRange();
      });
    });
    document.getElementById('btn-reset').addEventListener('click', function () {
      if (S.mode === 'three') setView('overlook', false);
      else { S.fallback.scale = 0.14; S.fallback.rot = 0; S.fallback.cy = window.innerHeight / 2; }
    });
    // space toggles pause of spin is handled by movement; add explicit pause
    document.getElementById('btn-pause').addEventListener('click', function () {
      S.running = !S.running;
      this.classList.toggle('active', !S.running);
      this.textContent = S.running ? '暂停自转' : '继续自转';
      if (S.running && S.mode === 'three') requestAnimationFrame(frame);
      if (S.running && S.mode === 'fallback') requestAnimationFrame(fallbackFrame);
    });

    computeTwinPrimes(function (frac) {
      var bar = document.getElementById('load-bar');
      if (bar) bar.style.width = Math.round(frac * 90) + '%';
    }, function (pairs) {
      S.allStars = buildStars(pairs);
      S.viewStars = S.allStars.slice();
      loadScript(THREE_URLS, function (ok) {
        var gl = ok && window.THREE && !!document.getElementById('scene').getContext('webgl');
        var loader = document.getElementById('loader');
        setTimeout(function () {
          loader.classList.add('hide');
          setTimeout(function () { loader.style.display = 'none'; }, 900);
          if (gl) { try { initThree(); } catch (err) { initFallback(); } }
          else initFallback();
        }, 500);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
  } else { startApp(); }
})();
