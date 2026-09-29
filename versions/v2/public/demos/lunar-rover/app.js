import * as THREE from 'three';
import { createScene, terrainHeight, SAMPLE_POINTS, HAZARD_POINTS } from './scene.js';
import { Gauge, Radar, AlertLog, FlameFrame, initPanelCollapse } from './hud.js';

// ============ 初始化 ============
const canvas = document.getElementById('scene');
const S = createScene(canvas);
const { renderer, scene, camera, rover, camState, sun } = S;

const gauge = new Gauge(document.getElementById('gauge'));
const radar = new Radar(document.getElementById('radar'));
const alerts = new AlertLog(document.getElementById('alert-list'), document.getElementById('alert-count'));
const flame = new FlameFrame(document.getElementById('flame-frame'));
initPanelCollapse();

// ============ 巡视器路径（环形巡航线） ============
const pathPoints = [];
for (let i = 0; i <= 120; i++) {
  const t = (i / 120) * Math.PI * 2;
  const x = Math.cos(t) * 70 + Math.sin(t * 3) * 12;
  const z = Math.sin(t) * 55 + Math.cos(t * 2) * 10;
  pathPoints.push(new THREE.Vector3(x, 0, z));
}
let pathIdx = 0;
const roverPos = new THREE.Vector3(pathPoints[0].x, 0, pathPoints[0].z);
let roverHeading = 0;
let roverSpeed = 0;
const targetSpeed = 1.6;

// ============ 样本采集状态 ============
const sampleState = SAMPLE_POINTS.map((s) => ({ ...s, collected: false, count: 0 }));
const sampleCounts = { basalt: 0, glass: 0, ilmenite: 0, anorthosite: 0 };
const sampleGoals = { basalt: 3, glass: 2, ilmenite: 5, anorthosite: 2 };
let totalSamples = 0;

// ============ 诊断数值状态 ============
let battery = 100;
let heat = 18;
let load = 42;
let slip = 3;
let lowBattery = false;

// ============ 镜头控制 ============
const camBtns = document.querySelectorAll('.cam-btn');
camBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    camBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    camState.mode = btn.dataset.cam;
    camState.transitioning = true;
    if (camState.mode === 'orbit') camState.orbitAngle = 0;
  });
});

// HUD 淡出/淡入（基于相机运动速度）
const hudEl = document.getElementById('hud');
let hudFaded = false;
let lastCamPos = new THREE.Vector3();
function updateHudFade(dt) {
  const moveSpeed = lastCamPos.distanceTo(camState.pos) / Math.max(dt, 0.001);
  lastCamPos.copy(camState.pos);
  // 相机运动快时淡出，停稳后淡入
  const shouldFade = moveSpeed > 8;
  if (shouldFade !== hudFaded) {
    hudFaded = shouldFade;
    hudEl.classList.toggle('faded', hudFaded);
  }
}

// ============ 主循环 ============
const clock = new THREE.Clock();
let alertTimer = 0;
let sampleCheckTimer = 0;
let missionProgress = 20;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // ---- 巡视器沿路径移动 ----
  const target = pathPoints[pathIdx];
  const dx = target.x - roverPos.x, dz = target.z - roverPos.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < 2.5) {
    pathIdx = (pathIdx + 1) % pathPoints.length;
  }
  const desiredHeading = Math.atan2(dx, dz);
  let headingDiff = desiredHeading - roverHeading;
  while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
  while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;
  roverHeading += headingDiff * Math.min(dt * 2.5, 1);

  roverSpeed += (targetSpeed - roverSpeed) * Math.min(dt, 1);
  roverPos.x += Math.sin(roverHeading) * roverSpeed * dt;
  roverPos.z += Math.cos(roverHeading) * roverSpeed * dt;
  roverPos.y = terrainHeight(roverPos.x, roverPos.z);

  rover.group.position.copy(roverPos);
  rover.group.rotation.y = roverHeading;
  // 车轮滚动
  for (const w of rover.wheels) w.rotation.x += roverSpeed * dt * 1.8;
  // 传感器镜头闪烁
  rover.lens.material.emissiveIntensity = 1.5 + Math.sin(t * 4) * 0.8;

  // 路径扫描线跟随
  S.scanLine.userData.update(roverPos, roverHeading);
  S.scanLine.material.opacity = 0.4 + Math.sin(t * 2) * 0.2;

  // 太阳阴影跟随
  sun.position.set(roverPos.x + 60, 80, roverPos.z + 30);
  sun.target.position.copy(roverPos);
  sun.target.updateMatrixWorld();

  // ---- 镜头更新 ----
  updateCamera(dt, t);
  updateHudFade(dt);

  // ---- 诊断数值模拟 ----
  battery = Math.max(0, battery - dt * 0.55);
  heat = 18 + Math.sin(t * 0.3) * 4 + roverSpeed * 2;
  load = 42 + Math.sin(t * 0.7) * 8 + Math.sin(t * 1.3) * 4;
  slip = 3 + Math.abs(Math.sin(t * 0.5)) * 5;

  const isLow = battery <= 20;
  if (isLow && !lowBattery) {
    lowBattery = true;
    alerts.add('电池电量低于 20% 阈值，启动节能模式', 'crit');
  }
  flame.set(isLow);
  document.getElementById('stat-battery').classList.toggle('danger', isLow);

  // ---- 更新 DOM ----
  updateDiagDOM();
  gauge.set(roverSpeed);
  gauge.update(dt);
  radar.draw({ x: roverPos.x, z: roverPos.z, heading: roverHeading }, sampleState, HAZARD_POINTS, dt);

  // ---- 告警定时 ----
  alertTimer += dt;
  if (alertTimer > 6 + Math.random() * 4) {
    alertTimer = 0;
    alerts.tick();
  }

  // ---- 样本采集检测 ----
  sampleCheckTimer += dt;
  if (sampleCheckTimer > 0.5) {
    sampleCheckTimer = 0;
    checkSampleCollection();
  }

  // ---- 样本标记动画 ----
  S.sampleMarkers.children.forEach((m, i) => {
    if (m.geometry.type === 'OctahedronGeometry') {
      m.rotation.y += dt;
      m.position.y = m.userData.baseY + Math.sin(t * 2 + i) * 0.3;
    }
  });

  renderer.render(scene, camera);
}

function updateCamera(dt, t) {
  const mode = camState.mode;
  let targetPos = new THREE.Vector3();
  let targetLook = new THREE.Vector3();

  if (mode === 'follow') {
    targetPos.set(
      roverPos.x - Math.sin(roverHeading) * 14,
      roverPos.y + 7,
      roverPos.z - Math.cos(roverHeading) * 14
    );
    targetLook.copy(roverPos).add(new THREE.Vector3(0, 2, 0));
  } else if (mode === 'orbit') {
    camState.orbitAngle += dt * 0.4;
    targetPos.set(
      roverPos.x + Math.sin(camState.orbitAngle) * 16,
      roverPos.y + 6,
      roverPos.z + Math.cos(camState.orbitAngle) * 16
    );
    targetLook.copy(roverPos).add(new THREE.Vector3(0, 2, 0));
  } else if (mode === 'side') {
    targetPos.set(roverPos.x + 16, roverPos.y + 4, roverPos.z);
    targetLook.copy(roverPos).add(new THREE.Vector3(0, 2, 0));
  } else if (mode === 'top') {
    targetPos.set(roverPos.x, roverPos.y + 30, roverPos.z + 0.1);
    targetLook.copy(roverPos);
  }

  const lerp = Math.min(dt * 3, 1);
  camState.pos.lerp(targetPos, lerp);
  camState.look.lerp(targetLook, lerp);
  camera.position.copy(camState.pos);
  camera.lookAt(camState.look);
}

function updateDiagDOM() {
  document.getElementById('speed-value').textContent = roverSpeed.toFixed(2);
  document.getElementById('battery-value').textContent = `${battery.toFixed(0)}%`;
  document.getElementById('battery-fill').style.width = `${battery}%`;
  document.getElementById('heat-value').textContent = `${heat.toFixed(0)}°C`;
  document.getElementById('heat-fill').style.width = `${Math.min((heat / 60) * 100, 100)}%`;
  document.getElementById('load-value').textContent = `${load.toFixed(0)}%`;
  document.getElementById('load-fill').style.width = `${load}%`;
  document.getElementById('slip-value').textContent = `${slip.toFixed(0)}%`;
  document.getElementById('slip-fill').style.width = `${slip * 4}%`;
}

function checkSampleCollection() {
  for (const s of sampleState) {
    if (s.collected) continue;
    const dx = s.x - roverPos.x, dz = s.z - roverPos.z;
    if (dx * dx + dz * dz < 36) {
      s.collected = true;
      s.count++;
      sampleCounts[s.type]++;
      totalSamples++;
      const names = { basalt: '玄武岩芯', glass: '月海玻璃', ilmenite: '钛铁矿粒', anorthosite: '斜长岩屑' };
      alerts.add(`样本采集成功：${names[s.type]} ×1`, 'warn');
      updateSampleDOM();
    }
  }
}

function updateSampleDOM() {
  const order = ['basalt', 'glass', 'ilmenite', 'anorthosite'];
  const counts = document.querySelectorAll('.sample-count');
  counts.forEach((el, i) => {
    const type = order[i];
    el.textContent = `${sampleCounts[type]} / ${sampleGoals[type]}`;
  });
  document.getElementById('sample-total').textContent = totalSamples;

  // 任务进度
  const goalDone = Object.values(sampleCounts).reduce((a, b) => a + b, 0);
  const goalTotal = Object.values(sampleGoals).reduce((a, b) => a + b, 0);
  missionProgress = Math.min(100, 20 + (goalDone / goalTotal) * 80);
  document.getElementById('mission-fill').style.width = `${missionProgress}%`;
  document.getElementById('mission-pct').textContent = `${missionProgress.toFixed(0)}%`;
}

// 初始告警
setTimeout(() => alerts.add('巡视器着陆成功，开始月面巡视', 'warn'), 800);
setTimeout(() => alerts.add('路径扫描完成，前方地形已建模', 'warn'), 2500);

animate();
