import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ═══════════════════════════════════════════
   §1  FLOWER PRESETS
   ═══════════════════════════════════════════ */

const FLOWERS = [
  { id:'bougainvillea', name:'九重葛云', nameEn:'Bougainvillea Cloud', hue:330, sat:75, light:55, petalCount:10, petalLen:.55, petalW:.28, curl:35, stemH:.7, shape:'round', center:'#FFD54F', season:'spring', hueTag:'红粉' },
  { id:'hibiscus', name:'珊瑚芙蓉', nameEn:'Coral Hibiscus', hue:15, sat:80, light:58, petalCount:6, petalLen:.7, petalW:.4, curl:55, stemH:.9, shape:'round', center:'#FF8A65', season:'summer', hueTag:'红粉' },
  { id:'hyacinth', name:'白色风信子', nameEn:'White Hyacinth', hue:340, sat:20, light:88, petalCount:16, petalLen:.25, petalW:.1, curl:15, stemH:.5, shape:'bell', center:'#FFF9C4', season:'spring', hueTag:'白色' },
  { id:'hydrangea', name:'蓝色绣球', nameEn:'Blue Hydrangea', hue:210, sat:60, light:55, petalCount:22, petalLen:.2, petalW:.12, curl:5, stemH:.35, shape:'round', center:'#90CAF9', season:'summer', hueTag:'蓝紫' },
  { id:'sunflower', name:'金色向日葵', nameEn:'Golden Sunflower', hue:45, sat:90, light:55, petalCount:20, petalLen:.6, petalW:.08, curl:0, stemH:1.2, shape:'pointed', center:'#5D4037', season:'summer', hueTag:'黄橙' },
  { id:'lavender', name:'紫色薰衣草', nameEn:'Purple Lavender', hue:270, sat:50, light:50, petalCount:14, petalLen:.35, petalW:.06, curl:20, stemH:1.0, shape:'pointed', center:'#CE93D8', season:'summer', hueTag:'蓝紫' },
  { id:'rose', name:'赤陶玫瑰', nameEn:'Terracotta Rose', hue:15, sat:55, light:50, petalCount:8, petalLen:.45, petalW:.3, curl:45, stemH:.65, shape:'spiral', center:'#FFCC80', season:'autumn', hueTag:'红粉' },
  { id:'morning-glory', name:'海蓝牵牛花', nameEn:'Sea Blue Morning Glory', hue:200, sat:70, light:50, petalCount:5, petalLen:.5, petalW:.35, curl:60, stemH:.6, shape:'bell', center:'#E3F2FD', season:'winter', hueTag:'蓝紫' },
  { id:'peony', name:'粉色牡丹', nameEn:'Pink Peony', hue:340, sat:45, light:75, petalCount:14, petalLen:.5, petalW:.35, curl:20, stemH:.5, shape:'round', center:'#FFF176', season:'spring', hueTag:'红粉' },
  { id:'jasmine', name:'白色茉莉', nameEn:'White Jasmine', hue:0, sat:0, light:95, petalCount:6, petalLen:.2, petalW:.12, curl:0, stemH:.3, shape:'round', center:'#FFFDE7', season:'winter', hueTag:'白色' },
  { id:'marigold', name:'橙色金盏花', nameEn:'Orange Marigold', hue:30, sat:85, light:55, petalCount:16, petalLen:.35, petalW:.1, curl:30, stemH:.45, shape:'pointed', center:'#FFB74D', season:'autumn', hueTag:'黄橙' },
  { id:'iris', name:'淡紫鸢尾', nameEn:'Lavender Iris', hue:260, sat:40, light:55, petalCount:6, petalLen:.55, petalW:.18, curl:65, stemH:.75, shape:'pointed', center:'#E1BEE7', season:'winter', hueTag:'蓝紫' },
];

/* ═══════════════════════════════════════════
   §2  GLOBAL STATE
   ═══════════════════════════════════════════ */

const state = {
  page: 'catalog',
  selectedFlower: null,
  editorParams: { petalCount:8, curl:30, size:80, stem:80, hue:0 },
  gardenSelected: 0,
  gardenSize: 100,
  gardenHue: 0,
  gardenBatch: false,
  gardenSun: 12,
  gardenStyle: 'realistic',
  gardenFlowers: [],
  seasonFilter: 'all',
  searchQuery: '',
};

/* ═══════════════════════════════════════════
   §3  PROCEDURAL FLOWER GENERATION
   ═══════════════════════════════════════════ */

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return `#${[f(0),f(8),f(4)].map(c => c.toString(16).padStart(2,'0')).join('')}`;
}

function createPetalGeometry(len, w, curl, shape) {
  const pts = [];
  if (shape === 'round') {
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(w * .6, len * .15));
    pts.push(new THREE.Vector2(w, len * .5));
    pts.push(new THREE.Vector2(w * .7, len * .8));
    pts.push(new THREE.Vector2(0, len));
    pts.push(new THREE.Vector2(-w * .7, len * .8));
    pts.push(new THREE.Vector2(-w, len * .5));
    pts.push(new THREE.Vector2(-w * .6, len * .15));
  } else if (shape === 'pointed') {
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(w * .5, len * .2));
    pts.push(new THREE.Vector2(w * .3, len * .6));
    pts.push(new THREE.Vector2(0, len));
    pts.push(new THREE.Vector2(-w * .3, len * .6));
    pts.push(new THREE.Vector2(-w * .5, len * .2));
  } else if (shape === 'bell') {
    pts.push(new THREE.Vector2(-w * .4, 0));
    pts.push(new THREE.Vector2(-w * .9, len * .3));
    pts.push(new THREE.Vector2(-w * .7, len * .7));
    pts.push(new THREE.Vector2(0, len));
    pts.push(new THREE.Vector2(w * .7, len * .7));
    pts.push(new THREE.Vector2(w * .9, len * .3));
    pts.push(new THREE.Vector2(w * .4, 0));
  } else { // spiral
    pts.push(new THREE.Vector2(0, 0));
    pts.push(new THREE.Vector2(w * .8, len * .1));
    pts.push(new THREE.Vector2(w, len * .4));
    pts.push(new THREE.Vector2(w * .5, len * .7));
    pts.push(new THREE.Vector2(0, len * .9));
    pts.push(new THREE.Vector2(-w * .5, len * .7));
    pts.push(new THREE.Vector2(-w, len * .4));
    pts.push(new THREE.Vector2(-w * .8, len * .1));
  }

  const shape2D = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape2D, {
    depth: .015, bevelEnabled: true,
    bevelThickness: .008, bevelSize: .008, bevelSegments: 2,
    curveSegments: 8,
  });

  // Apply curl
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, y / len));
    const z = pos.getZ(i);
    pos.setZ(i, z + Math.sin(t * Math.PI * .6) * curl * .012 * t);
  }
  geo.computeVertexNormals();
  return geo;
}

function createLeaf() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(.06, .05, .08, .15, 0, .22);
  s.bezierCurveTo(-.08, .15, -.06, .05, 0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: .005, bevelEnabled: false });
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: .8, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

function createFlower3D(params) {
  const { hue, sat, light, petalCount, petalLen, petalW, curl, stemH, shape, center, hueShift = 0 } = params;
  const group = new THREE.Group();
  const finalHue = (hue + hueShift + 360) % 360;
  const petalColor = new THREE.Color().setHSL(finalHue / 360, sat / 100, light / 100);

  // Stem
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(.03, stemH * .35, .01),
    new THREE.Vector3(-.02, stemH * .7, -.01),
    new THREE.Vector3(0, stemH, 0),
  ]);
  const stemGeo = new THREE.TubeGeometry(stemCurve, 8, .018, 6, false);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: .85 });
  group.add(new THREE.Mesh(stemGeo, stemMat));

  // Leaves
  for (let i = 0; i < 2; i++) {
    const leaf = createLeaf();
    leaf.position.y = stemH * (.25 + i * .2);
    leaf.rotation.y = i * Math.PI + .3;
    leaf.rotation.z = -.3;
    group.add(leaf);
  }

  // Petals
  const petalGeo = createPetalGeometry(petalLen, petalW, curl, shape);
  const petalMat = new THREE.MeshStandardMaterial({
    color: petalColor, side: THREE.DoubleSide, roughness: .55, metalness: 0,
  });

  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.y = stemH;
    petal.rotation.y = angle;
    petal.rotation.x = shape === 'bell' ? -.15 : -Math.PI / 4;
    petal.rotation.z = (Math.random() - .5) * .08;
    group.add(petal);
  }

  // Center
  const centerGeo = new THREE.SphereGeometry(petalW * .5, 12, 12);
  const centerMat = new THREE.MeshStandardMaterial({ color: center || 0xffd700, roughness: .5 });
  const centerMesh = new THREE.Mesh(centerGeo, centerMat);
  centerMesh.position.y = stemH + .02;
  centerMesh.scale.y = .4;
  group.add(centerMesh);

  // Stamens (for flowers with visible centers)
  if (petalCount <= 8) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const stamenGeo = new THREE.CylinderGeometry(.003, .003, .12, 4);
      const stamenMat = new THREE.MeshStandardMaterial({ color: 0xffee58 });
      const stamen = new THREE.Mesh(stamenGeo, stamenMat);
      stamen.position.set(Math.cos(a) * .04, stemH + .08, Math.sin(a) * .04);
      stamen.rotation.z = Math.cos(a) * .3;
      stamen.rotation.x = Math.sin(a) * .3;
      group.add(stamen);

      const tipGeo = new THREE.SphereGeometry(.012, 6, 6);
      const tipMat = new THREE.MeshStandardMaterial({ color: 0xffd54f });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(Math.cos(a) * .06, stemH + .14, Math.sin(a) * .06);
      group.add(tip);
    }
  }

  return group;
}

/* ═══════════════════════════════════════════
   §4  THUMBNAIL RENDERER
   ═══════════════════════════════════════════ */

const thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
thumbRenderer.setSize(240, 240);
thumbRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
thumbRenderer.toneMappingExposure = 1.1;

const thumbScenes = [];

function renderThumb(flower) {
  const scene = new THREE.Scene();
  scene.background = null;

  // Lighting
  const amb = new THREE.AmbientLight(0xfff5e6, .7);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xfff0dd, 1.2);
  dir.position.set(2, 4, 3);
  scene.add(dir);
  const fill = new THREE.DirectionalLight(0xc8e6ff, .4);
  fill.position.set(-2, 2, -1);
  scene.add(fill);

  const flower3d = createFlower3D(flower);
  scene.add(flower3d);

  const camera = new THREE.PerspectiveCamera(35, 1, .1, 50);
  camera.position.set(0, .8, 2.2);
  camera.lookAt(0, .5, 0);

  thumbRenderer.render(scene, camera);

  const dataURL = thumbRenderer.domElement.toDataURL('image/png');

  // Cleanup
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
      else obj.material.dispose();
    }
  });

  return dataURL;
}

/* ═══════════════════════════════════════════
   §5  TERRA COTTA TEXTURE
   ═══════════════════════════════════════════ */

function createTerracottaTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#C07850';
  ctx.fillRect(0, 0, 512, 512);

  const ts = 64;
  for (let x = 0; x < 512; x += ts) {
    for (let y = 0; y < 512; y += ts) {
      const v = (Math.random() - .5) * 24;
      const r = Math.round(192 + v);
      const g = Math.round(120 + v * .6);
      const b = Math.round(80 + v * .3);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);

      // Subtle grout lines
      ctx.strokeStyle = 'rgba(160,100,60,.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + .5, y + .5, ts - 1, ts - 1);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/* ═══════════════════════════════════════════
   §6  SKY GRADIENT TEXTURE
   ═══════════════════════════════════════════ */

function createSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 2; c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#5BA8C8');
  grad.addColorStop(.35, '#8EC8E0');
  grad.addColorStop(.7, '#C5E4F0');
  grad.addColorStop(1, '#E8F4FD');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 512);
  return new THREE.CanvasTexture(c);
}

/* ═══════════════════════════════════════════
   §7  CATALOG PAGE
   ═══════════════════════════════════════════ */

function buildCatalog() {
  const grid = document.getElementById('flower-grid');
  const empty = document.getElementById('catalog-empty');
  grid.innerHTML = '';

  const filtered = FLOWERS.filter(f => {
    const matchSeason = state.seasonFilter === 'all' || f.season === state.seasonFilter;
    const matchSearch = !state.searchQuery ||
      f.name.includes(state.searchQuery) ||
      f.nameEn.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      f.hueTag.includes(state.searchQuery);
    return matchSeason && matchSearch;
  });

  if (filtered.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  filtered.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'flower-card';
    card.style.animationDelay = `${i * 60}ms`;
    card.dataset.id = f.id;

    const thumb = renderThumb(f);
    const colorHex = hslToHex(f.hue, f.sat, f.light);

    card.innerHTML = `
      <div class="card-img-wrap">
        <img src="${thumb}" alt="${f.name}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-name">${f.name}</div>
        <div class="card-name-en">${f.nameEn}</div>
        <div class="card-tags">
          <span class="card-tag tag-hue" style="background:${colorHex}22;color:${colorHex}">${f.hueTag}</span>
          <span class="card-tag tag-season">${{spring:'春',summer:'夏',autumn:'秋',winter:'冬'}[f.season]}</span>
          <span class="card-tag tag-shape">${{round:'圆形',pointed:'尖形',bell:'钟形',spiral:'螺旋'}[f.shape]}</span>
        </div>
      </div>
      <div class="card-arrow">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedFlower = f;
      location.hash = `#/editor/${f.id}`;
    });

    grid.appendChild(card);
  });
}

function filterCatalog() {
  buildCatalog();
}

// Search
document.getElementById('search-input')?.addEventListener('input', e => {
  state.searchQuery = e.target.value.trim();
  filterCatalog();
});

// Season chips
document.getElementById('season-chips')?.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  document.querySelectorAll('#season-chips .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.seasonFilter = chip.dataset.season;
  filterCatalog();
});

/* ═══════════════════════════════════════════
   §8  EDITOR PAGE
   ═══════════════════════════════════════════ */

let editorRenderer, editorScene, editorCamera, editorControls, editorFlower, editorCurrentId;

function initEditor() {
  const canvas = document.getElementById('editor-canvas');
  const rect = canvas.parentElement.getBoundingClientRect();

  editorRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  editorRenderer.setSize(rect.width, rect.height);
  editorRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  editorRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  editorRenderer.toneMappingExposure = 1.15;
  editorRenderer.shadowMap.enabled = true;
  editorRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  editorScene = new THREE.Scene();

  // Sky gradient background
  const skyTex = createSkyTexture();
  editorScene.background = skyTex;

  // Lighting
  const amb = new THREE.AmbientLight(0xfff5e6, .6);
  editorScene.add(amb);

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0xc07850, .5);
  editorScene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0dd, 1.4);
  sun.position.set(3, 5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = .1;
  sun.shadow.camera.far = 20;
  sun.shadow.camera.left = -3;
  sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3;
  sun.shadow.camera.bottom = -3;
  editorScene.add(sun);

  // Ground hint
  const groundGeo = new THREE.CircleGeometry(2.5, 32);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: .9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.01;
  ground.receiveShadow = true;
  editorScene.add(ground);

  editorCamera = new THREE.PerspectiveCamera(40, rect.width / rect.height, .1, 50);
  editorCamera.position.set(0, 1.2, 2.8);

  editorControls = new OrbitControls(editorCamera, canvas);
  editorControls.enableDamping = true;
  editorControls.dampingFactor = .08;
  editorControls.target.set(0, .6, 0);
  editorControls.minDistance = 1.5;
  editorControls.maxDistance = 6;
  editorControls.maxPolarAngle = Math.PI / 2 + .1;
  editorControls.update();

  buildPresetList();
  setupEditorSliders();
}

function buildPresetList() {
  const list = document.getElementById('preset-list');
  list.innerHTML = '';

  FLOWERS.forEach(f => {
    const card = document.createElement('div');
    card.className = 'preset-card' + (state.selectedFlower?.id === f.id ? ' active' : '');
    card.dataset.id = f.id;

    const thumb = renderThumb(f);
    card.innerHTML = `
      <img class="preset-thumb" src="${thumb}" alt="${f.name}">
      <div class="preset-info">
        <div class="preset-name">${f.name}</div>
        <div class="preset-name-en">${f.nameEn}</div>
      </div>
    `;

    card.addEventListener('click', () => {
      state.selectedFlower = f;
      state.editorParams = { petalCount: f.petalCount, curl: f.curl, size: 80, stem: Math.round(f.stemH * 100), hue: 0 };
      updateEditorSliders();
      updatePresetActive();
      rebuildEditorFlower();
    });

    list.appendChild(card);
  });
}

function updatePresetActive() {
  document.querySelectorAll('.preset-card').forEach(c => {
    c.classList.toggle('active', c.dataset.id === state.selectedFlower?.id);
  });
}

function setupEditorSliders() {
  const sliders = [
    { id: 'p-petals', val: 'v-petals', key: 'petalCount', fmt: v => v },
    { id: 'p-curl',   val: 'v-curl',   key: 'curl',      fmt: v => v + '°' },
    { id: 'p-size',   val: 'v-size',   key: 'size',      fmt: v => v },
    { id: 'p-stem',   val: 'v-stem',   key: 'stem',      fmt: v => v },
    { id: 'p-hue',    val: 'v-hue',    key: 'hue',       fmt: v => v + '°' },
  ];

  sliders.forEach(({ id, val, key, fmt }) => {
    const el = document.getElementById(id);
    const valEl = document.getElementById(val);
    el.addEventListener('input', () => {
      const v = Number(el.value);
      state.editorParams[key] = v;
      valEl.textContent = fmt(v);
      updateSliderFill(el);
      rebuildEditorFlower();
    });
  });

  document.getElementById('btn-plant')?.addEventListener('click', () => {
    location.hash = '#/garden';
  });

  document.getElementById('editor-back')?.addEventListener('click', () => {
    location.hash = '#/';
  });
}

function updateEditorSliders() {
  const p = state.editorParams;
  const map = [
    { id: 'p-petals', val: 'v-petals', v: p.petalCount, fmt: v => v },
    { id: 'p-curl',   val: 'v-curl',   v: p.curl,      fmt: v => v + '°' },
    { id: 'p-size',   val: 'v-size',   v: p.size,      fmt: v => v },
    { id: 'p-stem',   val: 'v-stem',   v: p.stem,      fmt: v => v },
    { id: 'p-hue',    val: 'v-hue',    v: p.hue,       fmt: v => v + '°' },
  ];
  map.forEach(({ id, val, v, fmt }) => {
    const el = document.getElementById(id);
    const valEl = document.getElementById(val);
    el.value = v;
    valEl.textContent = fmt(v);
    updateSliderFill(el);
  });
}

function updateSliderFill(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--fill', pct + '%');
}

function rebuildEditorFlower() {
  if (editorFlower) {
    editorScene.remove(editorFlower);
    editorFlower.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  const f = state.selectedFlower;
  if (!f) return;

  const p = state.editorParams;
  const scale = p.size / 80;
  const stemScale = p.stem / 80;

  editorFlower = createFlower3D({
    hue: f.hue, sat: f.sat, light: f.light,
    petalCount: p.petalCount,
    petalLen: f.petalLen * scale,
    petalW: f.petalW * scale,
    curl: p.curl,
    stemH: f.stemH * stemScale,
    shape: f.shape,
    center: f.center,
    hueShift: p.hue,
  });

  editorFlower.traverse(obj => { if (obj.isMesh) obj.castShadow = true; });
  editorScene.add(editorFlower);

  document.getElementById('flower-bubble').textContent = f.name;
}

function animateEditor() {
  if (!editorRenderer || state.page !== 'editor') return;
  requestAnimationFrame(animateEditor);
  editorControls.update();
  editorRenderer.render(editorScene, editorCamera);
}

/* ═══════════════════════════════════════════
   §9  GARDEN PAGE
   ═══════════════════════════════════════════ */

let gardenRenderer, gardenScene, gardenCamera, gardenControls, gardenSunLight, gardenAmbient, gardenRaycaster, gardenMouse;
let gardenBatchStart = null, gardenBatchRect = null, gardenBatchOverlay = null;

function initGarden() {
  const canvas = document.getElementById('garden-canvas');
  const rect = canvas.parentElement.getBoundingClientRect();

  gardenRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  gardenRenderer.setSize(rect.width, rect.height);
  gardenRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  gardenRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  gardenRenderer.toneMappingExposure = 1.1;
  gardenRenderer.shadowMap.enabled = true;
  gardenRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  gardenScene = new THREE.Scene();

  // Sky
  const skyTex = createSkyTexture();
  gardenScene.background = skyTex;

  // Lighting
  gardenAmbient = new THREE.AmbientLight(0xfff5e6, .5);
  gardenScene.add(gardenAmbient);

  const hemi = new THREE.HemisphereLight(0x87ceeb, 0xc07850, .4);
  gardenScene.add(hemi);

  gardenSunLight = new THREE.DirectionalLight(0xfff0dd, 1.3);
  gardenSunLight.position.set(5, 8, 4);
  gardenSunLight.castShadow = true;
  gardenSunLight.shadow.mapSize.set(2048, 2048);
  gardenSunLight.shadow.camera.near = .5;
  gardenSunLight.shadow.camera.far = 30;
  gardenSunLight.shadow.camera.left = -8;
  gardenSunLight.shadow.camera.right = 8;
  gardenSunLight.shadow.camera.top = 8;
  gardenSunLight.shadow.camera.bottom = -8;
  gardenSunLight.shadow.bias = -.001;
  gardenScene.add(gardenSunLight);

  // Ground — terracotta tiles
  const groundGeo = new THREE.PlaneGeometry(16, 16);
  const groundMat = new THREE.MeshStandardMaterial({
    map: createTerracottaTexture(),
    roughness: .85,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.name = 'ground';
  gardenScene.add(ground);

  // White walls
  buildWalls();

  // Sea beyond walls
  buildSea();

  // Camera
  gardenCamera = new THREE.PerspectiveCamera(45, rect.width / rect.height, .1, 100);
  gardenCamera.position.set(0, 6, 10);

  gardenControls = new OrbitControls(gardenCamera, canvas);
  gardenControls.enableDamping = true;
  gardenControls.dampingFactor = .07;
  gardenControls.target.set(0, 0, 0);
  gardenControls.minDistance = 4;
  gardenControls.maxDistance = 18;
  gardenControls.maxPolarAngle = Math.PI / 2.05;
  gardenControls.minPolarAngle = .3;
  gardenControls.update();

  // Raycasting
  gardenRaycaster = new THREE.Raycaster();
  gardenMouse = new THREE.Vector2();

  // Events
  canvas.addEventListener('click', onGardenClick);
  canvas.addEventListener('mousemove', onGardenMouseMove);
  canvas.addEventListener('pointerdown', onGardenPointerDown);
  canvas.addEventListener('pointerup', onGardenPointerUp);

  buildTray();
  setupGardenControls();
  updateSunlight();
}

function buildWalls() {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e8, roughness: .9 });
  const wallH = 1.2;
  const wallT = .3;
  const half = 7;

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + wallT, wallH, wallT), wallMat);
  backWall.position.set(0, wallH / 2, -half);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  gardenScene.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, half * 2 + wallT), wallMat);
  leftWall.position.set(-half, wallH / 2, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  gardenScene.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, half * 2 + wallT), wallMat);
  rightWall.position.set(half, wallH / 2, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  gardenScene.add(rightWall);

  // Front wall (with gap)
  const frontL = new THREE.Mesh(new THREE.BoxGeometry(3, wallH, wallT), wallMat);
  frontL.position.set(-4, wallH / 2, half);
  frontL.castShadow = true;
  gardenScene.add(frontL);

  const frontR = new THREE.Mesh(new THREE.BoxGeometry(3, wallH, wallT), wallMat);
  frontR.position.set(4, wallH / 2, half);
  frontR.castShadow = true;
  gardenScene.add(frontR);

  // Wall cap (slightly wider top)
  const capMat = new THREE.MeshStandardMaterial({ color: 0xede7dc, roughness: .85 });
  const capBack = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + wallT + .1, .08, wallT + .1), capMat);
  capBack.position.set(0, wallH + .04, -half);
  gardenScene.add(capBack);

  const capLeft = new THREE.Mesh(new THREE.BoxGeometry(wallT + .1, .08, half * 2 + wallT + .1), capMat);
  capLeft.position.set(-half, wallH + .04, 0);
  gardenScene.add(capLeft);

  const capRight = new THREE.Mesh(new THREE.BoxGeometry(wallT + .1, .08, half * 2 + wallT + .1), capMat);
  capRight.position.set(half, wallH + .04, 0);
  gardenScene.add(capRight);
}

function buildSea() {
  const seaGeo = new THREE.PlaneGeometry(40, 20);
  const seaMat = new THREE.MeshStandardMaterial({
    color: 0x1b6b93,
    roughness: .3,
    metalness: .1,
    transparent: true,
    opacity: .85,
  });
  const sea = new THREE.Mesh(seaGeo, seaMat);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, -.3, -18);
  gardenScene.add(sea);

  // Lighter sea strip
  const seaLightGeo = new THREE.PlaneGeometry(40, 3);
  const seaLightMat = new THREE.MeshStandardMaterial({
    color: 0x2e9bc6,
    roughness: .2,
    metalness: .15,
    transparent: true,
    opacity: .6,
  });
  const seaLight = new THREE.Mesh(seaLightGeo, seaLightMat);
  seaLight.rotation.x = -Math.PI / 2;
  seaLight.position.set(0, -.25, -12);
  gardenScene.add(seaLight);
}

function buildTray() {
  const tray = document.getElementById('tray-grid');
  tray.innerHTML = '';

  FLOWERS.forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'tray-item' + (i === state.gardenSelected ? ' active' : '');
    const thumb = renderThumb(f);
    item.innerHTML = `<img src="${thumb}" alt="${f.name}" title="${f.name}">`;
    item.addEventListener('click', () => {
      state.gardenSelected = i;
      document.querySelectorAll('.tray-item').forEach((t, j) => t.classList.toggle('active', j === i));
    });
    tray.appendChild(item);
  });
}

function setupGardenControls() {
  // Size
  const sizeEl = document.getElementById('g-size');
  sizeEl.addEventListener('input', () => {
    state.gardenSize = Number(sizeEl.value);
    document.getElementById('v-gsize').textContent = sizeEl.value + '%';
    updateSliderFill(sizeEl);
  });

  // Hue
  const hueEl = document.getElementById('g-hue');
  hueEl.addEventListener('input', () => {
    state.gardenHue = Number(hueEl.value);
    document.getElementById('v-ghue').textContent = hueEl.value + '°';
    updateSliderFill(hueEl);
  });

  // Batch
  document.getElementById('g-batch').addEventListener('change', e => {
    state.gardenBatch = e.target.checked;
    document.getElementById('batch-hint').style.display = state.gardenBatch ? 'flex' : 'none';
  });

  // Sunlight
  const sunEl = document.getElementById('g-sun');
  sunEl.addEventListener('input', () => {
    state.gardenSun = Number(sunEl.value);
    const h = Math.floor(sunEl.value);
    const m = Math.round((sunEl.value - h) * 60);
    document.getElementById('v-sun').textContent = `${h}:${m.toString().padStart(2, '0')}`;
    updateSliderFill(sunEl);
    updateSunlight();
  });

  // Render style
  document.getElementById('g-style').addEventListener('change', e => {
    state.gardenStyle = e.target.value;
    applyRenderStyle();
  });

  // Clear
  document.getElementById('btn-clear').addEventListener('click', () => {
    state.gardenFlowers.forEach(f => {
      gardenScene.remove(f.mesh);
      f.mesh.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    });
    state.gardenFlowers = [];
    updateFlowerCount();
  });
}

function updateSunlight() {
  if (!gardenSunLight) return;
  const t = (state.gardenSun - 6) / 12; // 0 = morning, 1 = evening
  const angle = t * Math.PI; // 0 to PI

  // Sun position
  const x = Math.cos(angle) * 8;
  const y = Math.sin(angle) * 8 + 1;
  gardenSunLight.position.set(x, y, 4);

  // Color: warm orange at edges, white at noon
  const warmth = Math.abs(t - .5) * 2; // 0 at noon, 1 at edges
  const r = 1;
  const g = 1 - warmth * .35;
  const b = 1 - warmth * .55;
  gardenSunLight.color.setRGB(r, g, b);

  // Intensity
  gardenSunLight.intensity = 1.3 - warmth * .4;
  gardenAmbient.intensity = .5 - warmth * .15;

  // Sky color shift
  if (gardenScene.background) {
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 2; skyCanvas.height = 512;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);

    // Top sky color
    const topR = Math.round(91 - warmth * 40);
    const topG = Math.round(168 - warmth * 60);
    const topB = Math.round(200 - warmth * 30);
    grad.addColorStop(0, `rgb(${topR},${topG},${topB})`);

    // Mid sky
    const midR = Math.round(142 - warmth * 30);
    const midG = Math.round(200 - warmth * 50);
    const midB = Math.round(224 - warmth * 20);
    grad.addColorStop(.35, `rgb(${midR},${midG},${midB})`);

    // Bottom
    const botR = Math.round(232 - warmth * 20);
    const botG = Math.round(244 - warmth * 40);
    const botB = Math.round(253 - warmth * 10);
    grad.addColorStop(.7, `rgb(${botR},${botG},${botB})`);
    grad.addColorStop(1, `rgb(${botR},${botG},${botB})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);
    gardenScene.background = new THREE.CanvasTexture(skyCanvas);
  }
}

function applyRenderStyle() {
  gardenScene.traverse(obj => {
    if (!obj.isMesh || !obj.material) return;
    if (obj.name === 'ground') return;

    if (state.gardenStyle === 'watercolor') {
      if (obj.material.isMeshStandardMaterial) {
        obj.userData._origMat = obj.material;
        obj.material = new THREE.MeshToonMaterial({ color: obj.material.color?.clone() || new THREE.Color(0xffffff) });
      }
    } else if (state.gardenStyle === 'mosaic') {
      gardenRenderer.toneMapping = THREE.LinearToneMapping;
      gardenRenderer.toneMappingExposure = .9;
    } else {
      if (obj.userData._origMat) {
        obj.material = obj.userData._origMat;
        delete obj.userData._origMat;
      }
      gardenRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      gardenRenderer.toneMappingExposure = 1.1;
    }
  });
}

function onGardenClick(e) {
  if (state.gardenBatch) return;

  const rect = e.target.getBoundingClientRect();
  gardenMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  gardenMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  gardenRaycaster.setFromCamera(gardenMouse, gardenCamera);
  const ground = gardenScene.getObjectByName('ground');
  const hits = gardenRaycaster.intersectObject(ground);

  if (hits.length > 0) {
    const pt = hits[0].point;
    if (Math.abs(pt.x) < 6.5 && Math.abs(pt.z) < 6.5) {
      plantFlower(pt.x, pt.z);
    }
  }
}

function plantFlower(x, z) {
  const f = FLOWERS[state.gardenSelected];
  const scale = state.gardenSize / 100;

  const mesh = createFlower3D({
    hue: f.hue, sat: f.sat, light: f.light,
    petalCount: f.petalCount,
    petalLen: f.petalLen * scale,
    petalW: f.petalW * scale,
    curl: f.curl,
    stemH: f.stemH * scale,
    shape: f.shape,
    center: f.center,
    hueShift: state.gardenHue,
  });

  mesh.position.set(x, 0, z);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  mesh.traverse(obj => { if (obj.isMesh) obj.castShadow = true; });

  // Bounce animation
  mesh.scale.set(0, 0, 0);
  gardenScene.add(mesh);

  const startTime = performance.now();
  const duration = 500;

  function bounce() {
    const elapsed = performance.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = bounceOut(t);
    mesh.scale.set(ease, ease, ease);
    if (t < 1) requestAnimationFrame(bounce);
  }
  bounce();

  state.gardenFlowers.push({ mesh, flowerId: f.id, name: f.name });
  updateFlowerCount();
}

function bounceOut(t) {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
  return n * (t -= 2.625 / d) * t + .984375;
}

function updateFlowerCount() {
  document.getElementById('flower-count').innerHTML = `已种植 <strong>${state.gardenFlowers.length}</strong> 朵花`;
}

function onGardenMouseMove(e) {
  const rect = e.target.getBoundingClientRect();
  gardenMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  gardenMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  gardenRaycaster.setFromCamera(gardenMouse, gardenCamera);
  const ground = gardenScene.getObjectByName('ground');
  const hits = gardenRaycaster.intersectObject(ground);

  const tooltip = document.getElementById('garden-tooltip');
  if (hits.length > 0) {
    const pt = hits[0].point;
    if (Math.abs(pt.x) < 6.5 && Math.abs(pt.z) < 6.5) {
      const f = FLOWERS[state.gardenSelected];
      tooltip.textContent = `${f.name} · (${pt.x.toFixed(1)}, ${pt.z.toFixed(1)})`;
      tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      tooltip.style.top = (e.clientY - rect.top - 28) + 'px';
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  } else {
    tooltip.classList.remove('visible');
  }
}

function onGardenPointerDown(e) {
  if (!state.gardenBatch) return;
  const rect = e.target.getBoundingClientRect();
  gardenBatchStart = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };

  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: absolute; border: 2px dashed var(--magenta);
    background: var(--magenta-glow); pointer-events: none; z-index: 5;
    border-radius: 4px;
  `;
  e.target.parentElement.appendChild(overlay);
  gardenBatchOverlay = overlay;
}

function onGardenPointerUp(e) {
  if (!state.gardenBatch || !gardenBatchStart) return;

  const rect = e.target.getBoundingClientRect();
  const endX = e.clientX - rect.left;
  const endY = e.clientY - rect.top;

  const x = Math.min(gardenBatchStart.x, endX);
  const y = Math.min(gardenBatchStart.y, endY);
  const w = Math.abs(endX - gardenBatchStart.x);
  const h = Math.abs(endY - gardenBatchStart.y);

  if (w > 20 && h > 20 && gardenBatchOverlay) {
    // Convert screen rect to world coords via raycasting
    const corners = [
      { x: x / rect.width * 2 - 1, y: -(y / rect.height) * 2 + 1 },
      { x: (x + w) / rect.width * 2 - 1, y: -((y + h) / rect.height) * 2 + 1 },
    ];

    gardenRaycaster.setFromCamera(new THREE.Vector2(corners[0].x, corners[0].y), gardenCamera);
    const ground = gardenScene.getObjectByName('ground');
    const hits1 = gardenRaycaster.intersectObject(ground);

    gardenRaycaster.setFromCamera(new THREE.Vector2(corners[1].x, corners[1].y), gardenCamera);
    const hits2 = gardenRaycaster.intersectObject(ground);

    if (hits1.length && hits2.length) {
      const p1 = hits1[0].point;
      const p2 = hits2[0].point;
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minZ = Math.min(p1.z, p2.z);
      const maxZ = Math.max(p1.z, p2.z);

      // Plant in grid
      const spacing = .6;
      for (let px = minX + spacing / 2; px < maxX; px += spacing) {
        for (let pz = minZ + spacing / 2; pz < maxZ; pz += spacing) {
          if (Math.abs(px) < 6.5 && Math.abs(pz) < 6.5) {
            plantFlower(px, pz);
          }
        }
      }
    }
  }

  gardenBatchStart = null;
  if (gardenBatchOverlay) {
    gardenBatchOverlay.remove();
    gardenBatchOverlay = null;
  }
}

function animateGarden() {
  if (!gardenRenderer || state.page !== 'garden') return;
  requestAnimationFrame(animateGarden);
  gardenControls.update();

  // Update batch overlay
  if (gardenBatchOverlay && gardenBatchStart) {
    // handled by pointer events
  }

  gardenRenderer.render(gardenScene, gardenCamera);
}

/* ═══════════════════════════════════════════
   §10  ROUTING
   ═══════════════════════════════════════════ */

function navigate() {
  const hash = location.hash || '#/';
  const parts = hash.slice(2).split('/'); // remove '#/'
  const page = parts[0] || '';

  // Update nav
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

  if (page === 'editor' && parts[1]) {
    const flowerId = parts[1];
    const flower = FLOWERS.find(f => f.id === flowerId);
    if (flower) {
      state.selectedFlower = flower;
      state.editorParams = {
        petalCount: flower.petalCount,
        curl: flower.curl,
        size: 80,
        stem: Math.round(flower.stemH * 100),
        hue: 0,
      };
    }
    showPage('editor');
    document.getElementById('nav-garden').classList.add('active');
    if (!editorRenderer) initEditor();
    rebuildEditorFlower();
    updateEditorSliders();
    updatePresetActive();
    animateEditor();
  } else if (page === 'garden') {
    showPage('garden');
    document.getElementById('nav-garden').classList.add('active');
    if (!gardenRenderer) initGarden();
    animateGarden();
  } else {
    showPage('catalog');
    document.getElementById('nav-catalog').classList.add('active');
    buildCatalog();
  }
}

function showPage(name) {
  state.page = name;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');

  // Resize renderers
  requestAnimationFrame(() => {
    if (name === 'editor' && editorRenderer) {
      const canvas = document.getElementById('editor-canvas');
      const rect = canvas.parentElement.getBoundingClientRect();
      editorRenderer.setSize(rect.width, rect.height);
      editorCamera.aspect = rect.width / rect.height;
      editorCamera.updateProjectionMatrix();
    }
    if (name === 'garden' && gardenRenderer) {
      const canvas = document.getElementById('garden-canvas');
      const rect = canvas.parentElement.getBoundingClientRect();
      gardenRenderer.setSize(rect.width, rect.height);
      gardenCamera.aspect = rect.width / rect.height;
      gardenCamera.updateProjectionMatrix();
    }
  });
}

/* ═══════════════════════════════════════════
   §11  INIT
   ═══════════════════════════════════════════ */

window.addEventListener('hashchange', navigate);
window.addEventListener('resize', () => {
  if (editorRenderer) {
    const canvas = document.getElementById('editor-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    editorRenderer.setSize(rect.width, rect.height);
    editorCamera.aspect = rect.width / rect.height;
    editorCamera.updateProjectionMatrix();
  }
  if (gardenRenderer) {
    const canvas = document.getElementById('garden-canvas');
    const rect = canvas.parentElement.getBoundingClientRect();
    gardenRenderer.setSize(rect.width, rect.height);
    gardenCamera.aspect = rect.width / rect.height;
    gardenCamera.updateProjectionMatrix();
  }
});

// Expose filter function for empty state button
window._filterCatalog = filterCatalog;

// Init slider fills
document.querySelectorAll('input[type="range"]').forEach(updateSliderFill);

// Start
navigate();
