/** Apply an explicitly saved theme before first paint. */
try {
  const mode = localStorage.getItem("blueskyz-theme");
  if (mode === "light" || mode === "dark") {
    document.documentElement.setAttribute("data-theme", mode);
  }
} catch {
  // Storage is optional; CSS continues to follow the operating-system preference.
}

/**
 * Engine-aware font preload. No storage writes and no remote access.
 * Order matters: the display face (hero H1, the LCP element) is requested
 * first so the Inter Latin transfer cannot queue ahead of it.
 */
try {
  const ua = navigator.userAgent ?? "";
  const sharesFontPreloadCache =
    !/AppleWebKit/.test(ua) || /Chrome|Chromium|CriOS|Edg|OPR/.test(ua);
  if (sharesFontPreloadCache) {
    const lang = document.documentElement.lang || "en";
    const subsets = lang === "vi" ? ["latin", "vietnamese"] : ["latin"];
    const preload = (href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
      link.href = href;
      document.head.appendChild(link);
    };
    // Brand Kit v5 display face first (hero H1). Chinese pages set display
    // headings in the system CJK stack and never request it.
    if (!lang.startsWith("zh")) {
      for (const subset of subsets) {
        preload(`/fonts/noto-serif-display-${subset}-300-v2.003.woff2`);
      }
    }
    for (const subset of subsets) {
      preload(`/fonts/inter-${subset}-wght-v5.3.0.woff2`);
    }
  }
} catch {
  // Presentation-only enhancement; the @font-face discovery still loads the font.
}
