// ============ HUD 模块：速度表盘 / 罗盘雷达 / 告警日志 / 火焰边框 ============

// ============ 速度圆形表盘 ============
export class Gauge {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.value = 0;
    this.displayed = 0;
    this.max = 2.5; // m/s
    this.draw();
  }
  set(v) { this.value = v; }
  draw() {
    const ctx = this.ctx, S = this.canvas.width, c = S / 2, R = S / 2 - 14;
    ctx.clearRect(0, 0, S, S);

    // 外圈刻度环
    ctx.save();
    ctx.translate(c, c);
    const start = Math.PI * 0.75, end = Math.PI * 2.25;
    // 底盘圆环
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212,175,55,0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 刻度
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const a = start + (end - start) * t;
      const major = i % 5 === 0;
      const r1 = R, r2 = R - (major ? 10 : 5);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.strokeStyle = major ? 'rgba(244,212,124,0.9)' : 'rgba(212,175,55,0.4)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }

    // 进度弧（金色发光）
    const t = Math.min(this.displayed / this.max, 1);
    ctx.beginPath();
    ctx.arc(0, 0, R - 3, start, start + (end - start) * t);
    ctx.strokeStyle = '#f4d47c';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(244,212,124,0.8)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 指针
    const a = start + (end - start) * t;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * (R - 16), Math.sin(a) * (R - 16));
    ctx.strokeStyle = '#f4d47c';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(244,212,124,0.9)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // 指针中心
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f4d47c';
    ctx.fill();

    ctx.restore();
  }
  update(dt) {
    // 平滑插值
    this.displayed += (this.value - this.displayed) * Math.min(dt * 4, 1);
    this.draw();
  }
}

// ============ 罗盘式雷达 ============
export class Radar {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.S = canvas.width;
    this.rotation = 0;
    this.sweep = 0;
  }
  draw(rover, samples, hazards, dt) {
    const ctx = this.ctx, S = this.S, c = S / 2, R = S / 2 - 6;
    this.rotation += dt * 0.15; // 缓速持续旋转
    this.sweep += dt * 1.4;
    ctx.clearRect(0, 0, S, S);

    ctx.save();
    ctx.translate(c, c);

    // 底盘
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, R);
    grad.addColorStop(0, 'rgba(20,30,28,0.9)');
    grad.addColorStop(1, 'rgba(8,14,13,0.95)');
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 旋转刻度环（外圈）
    ctx.save();
    ctx.rotate(this.rotation);
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const major = i % 6 === 0;
      const r1 = R, r2 = R - (major ? 9 : 4);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
      ctx.strokeStyle = major ? 'rgba(244,212,124,0.95)' : 'rgba(212,175,55,0.45)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }
    // 汉字方位标注（子丑寅卯...）
    const dirs = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    ctx.font = '13px "Ma Shan Zheng", serif';
    ctx.fillStyle = '#f4d47c';
    ctx.shadowColor = 'rgba(244,212,124,0.6)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(dirs[i], Math.cos(a) * (R - 20), Math.sin(a) * (R - 20));
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // 内圈地形点阵（俯视，随巡视器移动）
    const scale = 0.55; // 世界→雷达缩放
    const ox = rover.x, oz = rover.z;
    ctx.fillStyle = 'rgba(127,212,193,0.55)';
    for (let gx = -8; gx <= 8; gx++) {
      for (let gz = -8; gz <= 8; gz++) {
        const wx = ox + gx * 4, wz = oz + gz * 4;
        // 用高度调制点亮度
        const h = (Math.sin(wx * 0.15) * Math.cos(wz * 0.15) + 1) * 0.5;
        const px = gx * 4 * scale, py = gz * 4 * scale;
        if (px * px + py * py > (R - 30) * (R - 30)) continue;
        ctx.globalAlpha = 0.2 + h * 0.5;
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }
    }
    ctx.globalAlpha = 1;

    // 扫描扇形
    const sweepGrad = ctx.createConicGradient ? null : null;
    ctx.save();
    ctx.rotate(this.sweep);
    const sg = ctx.createLinearGradient(0, 0, R - 28, 0);
    sg.addColorStop(0, 'rgba(127,212,193,0.35)');
    sg.addColorStop(1, 'rgba(127,212,193,0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R - 28, -0.4, 0);
    ctx.closePath();
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.restore();

    // 样本点
    for (const s of samples) {
      const dx = (s.x - ox) * scale, dz = (s.z - oz) * scale;
      if (dx * dx + dz * dz > (R - 28) * (R - 28)) continue;
      ctx.beginPath();
      ctx.arc(dx, dz, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#7fd4c1';
      ctx.shadowColor = '#7fd4c1';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // 危险区
    for (const h of hazards) {
      const dx = (h.x - ox) * scale, dz = (h.z - oz) * scale;
      if (dx * dx + dz * dz > (R - 28) * (R - 28)) continue;
      ctx.beginPath();
      ctx.arc(dx, dz, h.r * scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(200,16,46,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 巡视器当前位置（中心，金色三角）
    ctx.save();
    ctx.rotate(rover.heading);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fillStyle = '#f4d47c';
    ctx.shadowColor = '#f4d47c';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

// ============ 告警日志 ============
export class AlertLog {
  constructor(listEl, countEl) {
    this.list = listEl;
    this.countEl = countEl;
    this.count = 0;
    this.pool = [
      { t: 'warn', m: '左前轮载荷波动 ±12%' },
      { t: 'warn', m: '月尘密度升高，能见度下降' },
      { t: 'crit', m: '接近危险区边界' },
      { t: 'warn', m: '太阳能板温度偏高' },
      { t: 'warn', m: '通信链路延迟 240ms' },
      { t: 'crit', m: '电池电量低于安全阈值' },
      { t: 'warn', m: '陀螺仪校准完成' },
      { t: 'warn', m: '样本舱密封正常' },
    ];
    this.idx = 0;
  }
  add(msg, type = 'warn') {
    const li = document.createElement('li');
    li.className = type;
    const now = new Date();
    const ts = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    li.innerHTML = `<span class="t">${ts}</span>${msg}`;
    this.list.appendChild(li);
    while (this.list.children.length > 7) this.list.removeChild(this.list.firstChild);
    this.count++;
    this.countEl.textContent = this.count;
  }
  tick() {
    const item = this.pool[this.idx % this.pool.length];
    this.idx++;
    this.add(item.m, item.t);
  }
}

// ============ 火焰边框控制 ============
export class FlameFrame {
  constructor(el) { this.el = el; this.active = false; }
  set(on) {
    if (on === this.active) return;
    this.active = on;
    this.el.classList.toggle('active', on);
  }
}

// ============ 面板折叠 ============
export function initPanelCollapse() {
  document.querySelectorAll('.panel').forEach((panel) => {
    const head = panel.querySelector('.panel-head');
    head.addEventListener('click', () => panel.classList.toggle('collapsed'));
  });
}
