import * as THREE from 'three';
import { makeNoise, craterHeight } from './noise.js';

// ============ 场景常量 ============
export const TERRAIN_SIZE = 260;
export const TERRAIN_SEG = 180;

const craters = [
  { x: -40, z: -30, r: 16, d: 5 },
  { x: 55, z: 20, r: 22, d: 7 },
  { x: -15, z: 60, r: 12, d: 4 },
  { x: 30, z: -65, r: 18, d: 6 },
  { x: -70, z: 25, r: 14, d: 4.5 },
];

// 全局高度函数（地形网格与巡视器贴地共用）
export function terrainHeight(x, z) {
  const n = makeNoiseCached();
  let h = n(x * 0.018, z * 0.018, 5) * 7 - 3.5;
  h += n(x * 0.06, z * 0.06, 3) * 1.6;
  for (const c of craters) h += craterHeight(x, z, c.x, c.z, c.r, c.d);
  return h;
}
let _noise = null;
function makeNoiseCached() {
  if (!_noise) _noise = makeNoise(20240914);
  return _noise;
}

// ============ 构建场景 ============
export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x05060a, 0.0075);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 600);

  // ---- 光照：太阳主光 + 地球反照补光 + 轮廓光 ----
  const sun = new THREE.DirectionalLight(0xfff4e0, 2.6);
  sun.position.set(60, 80, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 260;
  sun.shadow.camera.left = -90;
  sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90;
  sun.shadow.camera.bottom = -90;
  sun.shadow.bias = -0.0008;
  scene.add(sun);
  scene.add(sun.target);

  const earthShine = new THREE.DirectionalLight(0x6a8fc4, 0.35);
  earthShine.position.set(-50, 30, -40);
  scene.add(earthShine);

  const rim = new THREE.DirectionalLight(0xd4af37, 0.5);
  rim.position.set(-30, 20, 60);
  scene.add(rim);

  scene.add(new THREE.AmbientLight(0x1a2030, 0.6));

  // ---- 星空 ----
  scene.add(createStars());

  // ---- 地形 ----
  const terrain = createTerrain();
  scene.add(terrain.mesh);

  // ---- 岩石 ----
  const rocks = createRocks();
  scene.add(rocks);

  // ---- 样本点标记 ----
  const sampleMarkers = createSampleMarkers();
  scene.add(sampleMarkers);

  // ---- 危险区标记 ----
  const hazardMarkers = createHazardMarkers();
  scene.add(hazardMarkers);

  // ---- 巡视器 ----
  const rover = createRover();
  scene.add(rover.group);

  // ---- 金色路径扫描线 ----
  const scanLine = createScanLine();
  scene.add(scanLine);

  // ---- 镜头状态 ----
  const camState = {
    mode: 'follow',
    pos: new THREE.Vector3(0, 12, 22),
    look: new THREE.Vector3(),
    orbitAngle: 0,
    transitioning: false,
  };

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  return { renderer, scene, camera, sun, terrain, rocks, sampleMarkers, hazardMarkers, rover, scanLine, camState };
}

// ============ 星空 ============
function createStars() {
  const count = 1400;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 380 + Math.random() * 120;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) * 0.9 + 10;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.85 });
  return new THREE.Points(geo, mat);
}

// ============ 地形网格 ============
function createTerrain() {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEG, TERRAIN_SEG);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    const h = terrainHeight(x, z);
    p.setY(i, h);
    // 灰沙着色：基色 + 高度/坡度明暗
    const shade = 0.42 + (h + 4) * 0.028;
    const n = makeNoiseCached()(x * 0.4, z * 0.4, 2);
    c.setRGB(shade * (0.92 + n * 0.12), shade * (0.9 + n * 0.1), shade * (0.88 + n * 0.08));
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.02 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return { mesh };
}

// ============ 岩石 ============
function createRocks() {
  const group = new THREE.Group();
  const geos = [
    new THREE.DodecahedronGeometry(1, 0),
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.OctahedronGeometry(1, 0),
  ];
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a6a70, roughness: 0.95, flatShading: true });
  const rand = mulberry32(4242);
  for (let i = 0; i < 90; i++) {
    const g = geos[Math.floor(rand() * geos.length)];
    const m = new THREE.Mesh(g, mat);
    const x = (rand() - 0.5) * TERRAIN_SIZE * 0.92;
    const z = (rand() - 0.5) * TERRAIN_SIZE * 0.92;
    const s = 0.4 + rand() * 1.8;
    m.scale.set(s, s * (0.5 + rand() * 0.7), s);
    m.position.set(x, terrainHeight(x, z) + s * 0.3, z);
    m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

// ============ 样本点 / 危险区标记 ============
export const SAMPLE_POINTS = [
  { x: 18, z: -12, type: 'basalt' },
  { x: -25, z: 15, type: 'glass' },
  { x: 40, z: 35, type: 'ilmenite' },
  { x: -45, z: -35, type: 'anorthosite' },
  { x: 8, z: 48, type: 'basalt' },
  { x: -10, z: -50, type: 'glass' },
];
export const HAZARD_POINTS = [
  { x: 30, z: 5, r: 9 },
  { x: -35, z: -10, r: 8 },
  { x: 0, z: 25, r: 7 },
];

function createSampleMarkers() {
  const group = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.9, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x7fd4c1, emissive: 0x2a6a5a, emissiveIntensity: 1.2, roughness: 0.3, metalness: 0.4,
  });
  for (const s of SAMPLE_POINTS) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(s.x, terrainHeight(s.x, s.z) + 1.6, s.z);
    m.userData.baseY = m.position.y;
    group.add(m);
    // 光柱
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.4, 8, 8, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x7fd4c1, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
    );
    beam.position.set(s.x, terrainHeight(s.x, s.z) + 4, s.z);
    group.add(beam);
  }
  return group;
}

function createHazardMarkers() {
  const group = new THREE.Group();
  for (const h of HAZARD_POINTS) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(h.r - 0.5, h.r, 48),
      new THREE.MeshBasicMaterial({ color: 0xc8102e, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(h.x, terrainHeight(h.x, h.z) + 0.25, h.z);
    group.add(ring);
  }
  return group;
}

// ============ 巡视器 ============
function createRover() {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2d34, roughness: 0.7, metalness: 0.5 });
  const black = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });

  // 底盘
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.2), dark);
  body.position.y = 1.1;
  body.castShadow = true;
  group.add(body);

  // 金色装饰板
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 1.4), gold);
  plate.position.set(0, 1.5, -0.4);
  plate.castShadow = true;
  group.add(plate);

  // 太阳能板
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.8), new THREE.MeshStandardMaterial({ color: 0x1a2440, roughness: 0.25, metalness: 0.7 }));
  panel.position.set(0, 1.75, 0.9);
  panel.rotation.x = -0.12;
  panel.castShadow = true;
  group.add(panel);

  // 桅杆 + 传感器头
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), gold);
  mast.position.set(0, 2.2, -1.2);
  group.add(mast);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.4), dark);
  head.position.set(0, 2.95, -1.2);
  head.castShadow = true;
  group.add(head);
  // 传感器镜头（发光）
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), new THREE.MeshStandardMaterial({ color: 0x7fd4c1, emissive: 0x7fd4c1, emissiveIntensity: 2 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.set(0, 2.95, -0.95);
  group.add(lens);

  // 车轮（6轮）
  const wheels = [];
  const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1c1e22, roughness: 0.95 });
  const hubMat = gold;
  for (const dx of [-1.25, 1.25]) {
    for (const dz of [-1.1, 0, 1.1]) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(dx, 0.55, dz);
      w.castShadow = true;
      group.add(w);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.42, 8), hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(w.position);
      group.add(hub);
      wheels.push(w);
    }
  }

  // 天线
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), gold);
  dish.position.set(-0.7, 2.0, 1.4);
  dish.rotation.x = Math.PI;
  group.add(dish);

  return { group, wheels, lens, speed: 0 };
}

// ============ 金色路径扫描线（跟随巡视器） ============
function createScanLine() {
  const N = 60;
  const positions = new Float32Array((N + 1) * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xf4d47c, transparent: true, opacity: 0.6 });
  const line = new THREE.Line(geo, mat);
  line.frustumCulled = false;
  line.userData.update = (roverPos, heading) => {
    const arr = geo.attributes.position.array;
    for (let i = 0; i <= N; i++) {
      const d = (i / N) * 30 - 5; // 巡视器后方5m到前方25m
      const x = roverPos.x + Math.sin(heading) * d;
      const z = roverPos.z + Math.cos(heading) * d;
      arr[i * 3] = x;
      arr[i * 3 + 1] = terrainHeight(x, z) + 0.3;
      arr[i * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };
  return line;
}

// ============ 工具：确定性随机 ============
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
