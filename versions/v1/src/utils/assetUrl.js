export function assetUrl(relativePath) {
  const clean = String(relativePath || "").replace(/^\/+/, "");

  // SSR/构建期兜底：保持以根为起点（此时没有 window.location）
  if (typeof window === "undefined") {
    return `/${clean}`;
  }

  // 以“当前页面所在目录”作为基准，兼容：
  // - 部署在子路径（如 /iquest/）
  // - history 路由（如 /iquest/report）下资源仍指向 /iquest/*
  // - file:// 直接打开 dist/index.html
  const { pathname } = window.location;
  const baseDir = pathname.endsWith("/")
    ? pathname
    : pathname.replace(/\/[^/]*$/, "/");

  return `${baseDir}${clean}`;
}


