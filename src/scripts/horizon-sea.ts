/**
 * Horizon Sea: the living layer of the home hero.
 *
 * A night sea in perspective under the hero's horizon line, a star field above
 * it and a light path on the water under the sail. Canvas 2D only (no WebGL,
 * no library, no network, no storage). Enhancement only: it draws behind the
 * hero content, never hides or moves content, and never runs when the visitor
 * asks for reduced motion, forced colours or data saving. It stops while the
 * hero is off screen or the tab is hidden, and the visitor can pause it
 * (WCAG 2.2.2).
 */

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  depth: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
}

const TAU = Math.PI * 2;
const METEOR_LIFE = 1.1;

/** Deterministic pseudo-random stream, so every visit paints the same sky. */
function stream(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function motionWelcome(): boolean {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (matchMedia("(forced-colors: active)").matches) return false;
  // A display spanned across a hinge keeps the static hero.
  if (
    matchMedia(
      "(horizontal-viewport-segments: 2), (vertical-viewport-segments: 2)",
    ).matches
  ) {
    return false;
  }
  const connection = (navigator as Navigator & { connection?: unknown })
    .connection as { saveData?: boolean } | undefined;
  return connection?.saveData !== true;
}

export function initHorizonSea(root: HTMLElement): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-horizon-sea]");
  const toggle = root.querySelector<HTMLButtonElement>(
    "[data-horizon-sea-toggle]",
  );
  const context = canvas?.getContext("2d");
  if (!canvas || !context || !motionWelcome()) return;
  const ctx: CanvasRenderingContext2D = context;
  const sea: HTMLCanvasElement = canvas;

  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const random = stream(20261110);

  let width = 0;
  let height = 0;
  let horizon = 0;
  let lightX = 0;
  let compact = false;
  let stars: Star[] = [];
  let lineGradient: CanvasGradient | null = null;
  let glow: CanvasGradient | null = null;
  let sailEl: HTMLElement | null = null;
  let focalEl: HTMLElement | null = null;
  /** The product capture: the sea is not drawn through it. */
  let shield: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null = null;
  let meteor: Meteor | null = null;
  let nextMeteor = 6;

  let frame = 0;
  let clock = 0;
  let last = 0;
  let fade = 0;
  let visible = false;
  let paused = false;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let appliedX = 0;
  let appliedY = 0;

  function measure(): void {
    const box = root.getBoundingClientRect();
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    compact = width < 768;
    const ratio = Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2);
    sea.width = Math.round(width * ratio);
    sea.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    // The sea meets the sky on the horizon line the hero already draws.
    const lines = [
      root.querySelector<HTMLElement>(".hero-stage__horizon"),
      root.querySelector<HTMLElement>(".horizon-field__line"),
    ];
    horizon = height * 0.62;
    for (const line of lines) {
      const rect = line?.getBoundingClientRect();
      if (rect && rect.width > 0) {
        horizon = rect.top - box.top;
        break;
      }
    }
    horizon = Math.min(Math.max(horizon, height * 0.3), height * 0.86);

    // The light path falls under the sail (desktop) or the capture (phone).
    sailEl = root.querySelector<HTMLElement>(".hero-visual");
    focalEl = root.querySelector<HTMLElement>("[data-hero-focal]");
    const sailBox = sailEl?.getBoundingClientRect();
    const focalBox = focalEl?.getBoundingClientRect();
    if (!compact && sailBox && sailBox.width > 0 && width >= 1024) {
      lightX = sailBox.left - box.left + sailBox.width * 0.52;
    } else if (focalBox && focalBox.width > 0) {
      lightX = focalBox.left - box.left + focalBox.width * 0.5;
    } else {
      lightX = width * 0.7;
    }

    const capture = root
      .querySelector<HTMLElement>("[data-hero-focal] img")
      ?.getBoundingClientRect();
    shield =
      capture && capture.width > 0
        ? {
            left: capture.left - box.left,
            right: capture.right - box.left,
            top: capture.top - box.top,
            bottom: capture.bottom - box.top,
          }
        : null;

    const count = Math.min(260, Math.round((width * horizon) / 3600));
    const sky = stream(7);
    stars = Array.from({ length: count }, () => {
      const lift = sky();
      return {
        x: sky() * width,
        // More stars high in the sky, fewer in the glow near the horizon.
        y: lift * lift * horizon * 0.96,
        r: 0.5 + sky() * sky() * 1.2,
        phase: sky() * TAU,
        speed: 0.35 + sky() * 1.1,
        depth: 0.25 + sky() * 0.75,
      };
    });

    const centre = Math.min(Math.max(lightX / width, 0.2), 0.8);
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    if (compact) {
      gradient.addColorStop(0, "rgba(37, 100, 255, 0.16)");
      gradient.addColorStop(centre, "rgba(214, 228, 255, 0.95)");
      gradient.addColorStop(1, "rgba(37, 100, 255, 0.16)");
    } else {
      // Quiet under the copy on the left, bright under the sail.
      gradient.addColorStop(0, "rgba(37, 100, 255, 0)");
      gradient.addColorStop(0.36, "rgba(37, 100, 255, 0.13)");
      gradient.addColorStop(centre - 0.16, "rgba(73, 128, 255, 0.5)");
      gradient.addColorStop(centre, "rgba(214, 228, 255, 0.95)");
      gradient.addColorStop(
        Math.min(centre + 0.14, 0.97),
        "rgba(73, 128, 255, 0.5)",
      );
      gradient.addColorStop(1, "rgba(37, 100, 255, 0.12)");
    }
    lineGradient = gradient;

    // The sail's light lying on the water, widest at the horizon.
    const reach = Math.max(height - horizon, 1);
    glow = ctx.createRadialGradient(lightX, 0, 0, lightX, 0, reach * 1.5);
    glow.addColorStop(0, "rgba(120, 160, 255, 0.3)");
    glow.addColorStop(0.35, "rgba(60, 110, 255, 0.11)");
    glow.addColorStop(1, "rgba(37, 100, 255, 0)");
  }

  function drawStars(time: number): void {
    ctx.fillStyle = "#e6eeff";
    for (const star of stars) {
      const twinkle = 0.55 + 0.45 * Math.sin(time * star.speed + star.phase);
      const haze = Math.min(1, (horizon - star.y) / (horizon * 0.3));
      const alpha = fade * twinkle * haze * (0.4 + star.depth * 0.6);
      const x = star.x - pointer.x * star.depth * 14;
      const y = star.y - pointer.y * star.depth * 8;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, star.r, 0, TAU);
      ctx.fill();
      if (star.r > 1.25) {
        // The few bright stars carry a soft bloom.
        ctx.globalAlpha = alpha * 0.16;
        ctx.beginPath();
        ctx.arc(x, y, star.r * 3.4, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawMeteor(time: number): void {
    if (!meteor) {
      if (time < nextMeteor) return;
      meteor = {
        x: width * (0.45 + random() * 0.5),
        y: horizon * (0.08 + random() * 0.3),
        vx: -(width * 0.16 + random() * width * 0.1),
        vy: horizon * (0.16 + random() * 0.12),
        born: time,
      };
    }
    const age = (time - meteor.born) / METEOR_LIFE;
    if (age >= 1) {
      meteor = null;
      nextMeteor = time + 9 + random() * 9;
      return;
    }
    const headX = meteor.x + meteor.vx * age;
    const headY = meteor.y + meteor.vy * age;
    const tailX = headX - meteor.vx * 0.22;
    const tailY = headY - meteor.vy * 0.22;
    const trail = ctx.createLinearGradient(tailX, tailY, headX, headY);
    trail.addColorStop(0, "rgba(230, 238, 255, 0)");
    trail.addColorStop(1, "rgba(230, 238, 255, 0.9)");
    ctx.globalAlpha = fade * Math.sin(Math.PI * age);
    ctx.strokeStyle = trail;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(headX, headY);
    ctx.stroke();
  }

  function drawSea(time: number): void {
    if (!lineGradient) return;
    const depth = height - horizon;
    if (depth < 24) return;
    const rows = compact ? 26 : 40;
    const step = compact ? 14 : 16;
    const near = 1;
    const far = 36;
    const focal = depth * near * 1.04;
    const flow = (time * 0.055) % 1;
    const centre = width * 0.5;
    const camera = pointer.x * 0.55;
    const swell = compact ? 0.05 : 0.06;

    if (glow) {
      ctx.globalAlpha = fade * (0.8 + 0.2 * Math.sin(time * 0.5));
      ctx.fillStyle = glow;
      ctx.save();
      // Flatten the glow into an ellipse that hugs the horizon.
      ctx.translate(0, horizon);
      ctx.scale(1, 0.42);
      ctx.fillRect(0, 0, width, depth / 0.42);
      ctx.restore();
    }

    ctx.lineWidth = 1;
    for (let row = 0; row < rows; row += 1) {
      // Rows travel toward the viewer; u = 1 at the horizon, 0 at the shore.
      const u = (row + 1 - flow) / rows;
      const z = near * Math.pow(far / near, u);
      const scale = focal / z;
      const rowAlpha = Math.pow(Math.sin(Math.PI * Math.min(u, 1)), 0.7);
      if (rowAlpha <= 0.01) continue;

      ctx.globalAlpha = fade * rowAlpha * 0.62;
      ctx.strokeStyle = lineGradient;
      ctx.beginPath();
      for (let sx = -step; sx <= width + step; sx += step) {
        const wx = (sx - centre) / scale + camera;
        const wave =
          Math.sin(wx * 1.9 + time * 0.62 + z * 0.9) * 0.6 +
          Math.sin(wx * 4.3 - time * 0.9 + z * 1.7) * 0.28 +
          Math.sin((wx + z) * 6.1 + time * 1.4) * 0.08;
        const sy = horizon + (1 - wave * swell * (0.4 + z * 0.22)) * scale;
        if (sx === -step) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Light on the water: small strokes that shimmer along a path which
      // widens toward the viewer, like moonlight on a calm sea.
      const reach = 5 + (1 - u) * (compact ? 54 : 96);
      const dash = 3 + (1 - u) * 13;
      ctx.fillStyle = "#eaf1ff";
      for (let index = 0; index < 3; index += 1) {
        const key = row * 3 + index;
        const glint = Math.sin(time * (1.1 + index * 0.45) + key * 2.3);
        const offset =
          Math.sin(key * 12.9898) *
          Math.sin(time * 0.35 + key * 0.7) *
          reach *
          0.5;
        ctx.globalAlpha = fade * rowAlpha * 0.6 * glint * glint;
        ctx.fillRect(
          lightX + offset - dash / 2 - pointer.x * (1 - u) * 18,
          horizon + scale - 0.6,
          dash,
          1.2,
        );
      }
    }

    // Keep the capture clean: erase the sea behind it, following the same
    // floor fade the capture itself uses (opaque to 58 %, clear at 100 %).
    if (shield) {
      const feather = 18;
      const erase = ctx.createLinearGradient(
        shield.left - feather,
        0,
        shield.right + feather,
        0,
      );
      const span = shield.right - shield.left + feather * 2;
      erase.addColorStop(0, "rgba(0, 0, 0, 0)");
      erase.addColorStop((feather * 1.4) / span, "rgba(0, 0, 0, 1)");
      erase.addColorStop(1 - (feather * 1.4) / span, "rgba(0, 0, 0, 1)");
      erase.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = erase;
      const tall = shield.bottom - shield.top;
      const solid = shield.top + tall * 0.58;
      ctx.globalAlpha = 1;
      ctx.fillRect(shield.left - feather, shield.top, span, solid - shield.top);
      const bands = 12;
      const band = (shield.bottom - solid) / bands;
      for (let index = 0; index < bands; index += 1) {
        ctx.globalAlpha = 1 - (index + 0.5) / bands;
        ctx.fillRect(shield.left - feather, solid + index * band, span, band);
      }
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function applyPointer(time: number): void {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    // The sail rides the swell: a slow bob and a degree of roll, plus a
    // little parallax against the pointer. Transform only, never layout.
    if (sailEl && width >= 1024) {
      const bob = Math.sin(time * 0.62) * 2.2;
      const roll = Math.sin(time * 0.47 + 1.1) * 0.55;
      sailEl.style.translate = `${(pointer.x * -12).toFixed(2)}px ${(pointer.y * -7 + bob).toFixed(2)}px`;
      sailEl.style.rotate = `${roll.toFixed(3)}deg`;
    }
    if (
      !focalEl ||
      (Math.abs(pointer.x - appliedX) < 0.002 &&
        Math.abs(pointer.y - appliedY) < 0.002)
    ) {
      return;
    }
    appliedX = pointer.x;
    appliedY = pointer.y;
    focalEl.style.setProperty(
      "--hero-tilt-y",
      `${(pointer.x * 5).toFixed(2)}deg`,
    );
    focalEl.style.setProperty(
      "--hero-tilt-x",
      `${(pointer.y * -3.5).toFixed(2)}deg`,
    );
  }

  function render(now: number): void {
    frame = 0;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += delta;
    fade = Math.min(1, fade + delta / 1.8);
    applyPointer(clock);
    ctx.clearRect(0, 0, width, height);
    drawStars(clock);
    drawMeteor(clock);
    drawSea(clock);
    ctx.globalAlpha = 1;
    schedule();
  }

  function schedule(): void {
    if (frame || paused || !visible || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(render);
  }

  function halt(): void {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function setPaused(next: boolean): void {
    paused = next;
    root.dataset.horizonSeaState = paused ? "paused" : "running";
    if (toggle) {
      const label = paused
        ? toggle.dataset.labelPlay
        : toggle.dataset.labelPause;
      if (label) toggle.setAttribute("aria-label", label);
    }
    if (paused) {
      halt();
      pointer.tx = 0;
      pointer.ty = 0;
    } else {
      schedule();
    }
  }

  measure();
  new ResizeObserver(() => {
    measure();
    if (paused) {
      // Keep the still frame crisp after a resize.
      ctx.clearRect(0, 0, width, height);
      drawStars(clock);
      drawSea(clock);
      ctx.globalAlpha = 1;
    }
  }).observe(root);

  new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) schedule();
      else halt();
    },
    { threshold: 0.02 },
  ).observe(root);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) halt();
    else schedule();
  });

  if (finePointer) {
    root.addEventListener(
      "pointermove",
      (event) => {
        if (paused) return;
        const box = root.getBoundingClientRect();
        pointer.tx = ((event.clientX - box.left) / box.width) * 2 - 1;
        pointer.ty = ((event.clientY - box.top) / box.height) * 2 - 1;
      },
      { passive: true },
    );
    root.addEventListener("pointerleave", () => {
      pointer.tx = 0;
      pointer.ty = 0;
    });
  }

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener("click", () => setPaused(!paused));
  }
  setPaused(false);
}

/** Start after the page has loaded, so the scene never competes with it. */
export function bootHorizonSea(): void {
  const root = document.querySelector<HTMLElement>("[data-horizon-sea-root]");
  if (!root) return;
  const start = (): void => {
    const idle = (
      window as Window & {
        requestIdleCallback?: (callback: () => void) => number;
      }
    ).requestIdleCallback;
    if (idle) idle(() => initHorizonSea(root));
    else setTimeout(() => initHorizonSea(root), 200);
  };
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
}
