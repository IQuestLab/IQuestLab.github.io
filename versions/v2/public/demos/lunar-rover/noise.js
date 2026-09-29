// 月面地形噪声：值噪声 + FBM 分形叠加，确定性可复现
export function makeNoise(seed = 1337) {
  // 简单哈希
  function hash(x, y) {
    let h = x * 374761393 + y * 668265263 + seed * 1442695040888963407;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function value(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = smooth(xf), v = smooth(yf);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  }
  // FBM
  return function fbm(x, y, octaves = 5) {
    let val = 0, amp = 0.5, freq = 1, sum = 0;
    for (let i = 0; i < octaves; i++) {
      val += amp * value(x * freq, y * freq);
      sum += amp;
      amp *= 0.5;
      freq *= 2.03;
    }
    return val / sum;
  };
}

// 陨石坑：给定中心与半径，返回该点的下凹高度（含坑缘隆起）
export function craterHeight(px, pz, cx, cz, radius, depth) {
  const dx = px - cx, dz = pz - cz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > radius * 1.4) return 0;
  const t = dist / radius;
  if (t < 1) {
    // 坑内：抛物线下凹
    return -depth * (1 - t * t) + depth * 0.35 * Math.exp(-Math.pow((t - 0.95) * 4, 2));
  }
  // 坑缘环脊
  const rim = (t - 1) / 0.4;
  return depth * 0.3 * Math.exp(-rim * rim * 3);
}
