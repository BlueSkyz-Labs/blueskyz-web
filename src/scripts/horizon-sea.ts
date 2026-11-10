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

interface Mote {
  /** Resting place on the sail, in px from the sail's centre. */
  x: number;
  y: number;
  z: number;
  /** Where it drifts in from: a point in the surrounding sky. */
  fx: number;
  fy: number;
  fz: number;
  layer: number;
  delay: number;
  size: number;
  phase: number;
}

const TAU = Math.PI * 2;

/**
 * The three sail faces of the BlueSkyz mark (viewBox 0 0 512 512), the same
 * path data `SailReveal.astro` copies from the brand kit's flat logo.
 */
const SAIL_FACES = [
  "M72 432 C118 285 226 139 394 54 C326 166 278 256 255 334 C196 329 130 369 72 432 Z",
  "M394 54 C353 165 333 276 371 408 L255 334 C289 244 326 138 394 54 Z",
  "M72 432 C151 363 213 333 255 334 L371 408 C292 363 193 364 72 432 Z",
] as const;
const SAIL_TINTS = ["#f4f7ff", "#a9bde6", "#3f7bff"] as const;
/** SailReveal's hand-off viewBox: maps the flat sail onto the raster mark. */
const SAIL_VIEW = { x: -2.1, y: 2, size: 476.3 };
const ASSEMBLE = 2.6;
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
  let motes: Mote[] = [];
  let sailCentreX = 0;
  let sailCentreY = 0;
  let sailScale = 0;
  let gathered = -1;
  let detail = 1;
  let slow = 0;
  let sampled = 0;
  let stalled = 0;
  let windowStart = 0;
  /** Once the visitor has used the control, the scene never stops itself. */
  let userChose = false;
  const ripple = { x: 0, z: 0, born: -10 };
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

    // The 3D sail stands exactly where the mark is (large screens only).
    if (sailBox && sailBox.width > 0 && width >= 1024) {
      sailScale = sailBox.width / SAIL_VIEW.size;
      sailCentreX = sailBox.left - box.left + sailBox.width / 2;
      sailCentreY = sailBox.top - box.top + sailBox.height / 2;
      if (motes.length === 0) motes = sampleSail();
    } else {
      sailScale = 0;
    }
    root.toggleAttribute(
      "data-horizon-sail",
      sailScale > 0 && motes.length > 0 && detail > 0,
    );

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

  /** Scatter points over the three sail faces and give the sail real depth. */
  function sampleSail(): Mote[] {
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe || typeof Path2D === "undefined") return [];
    const faces = SAIL_FACES.map((d) => new Path2D(d));
    const pick = stream(11);
    const list: Mote[] = [];
    const wanted = 5200;
    let guard = 0;
    while (list.length < wanted && guard < wanted * 12) {
      guard += 1;
      const px = 60 + pick() * 345;
      const py = 46 + pick() * 394;
      const layer = faces.findIndex((face) =>
        probe.isPointInPath(face, px, py),
      );
      if (layer < 0) continue;
      // Depth: the front wing billows toward the viewer, the back wing
      // falls away behind the mast line, the base runs between them.
      const across = (px - 72) / 322;
      const billow = Math.sin(Math.PI * Math.min(Math.max(across, 0), 1));
      const depth =
        layer === 0
          ? 46 * billow
          : layer === 1
            ? -58 - 26 * billow
            : 30 - across * 70;
      const angle = pick() * TAU;
      const far = 420 + pick() * 760;
      list.push({
        x: px - (SAIL_VIEW.x + SAIL_VIEW.size / 2),
        y: py - (SAIL_VIEW.y + SAIL_VIEW.size / 2),
        z: depth,
        fx: Math.cos(angle) * far,
        fy: -120 - pick() * 520,
        fz: Math.sin(angle) * far,
        layer,
        delay: pick() * 0.9 + (1 - py / 512) * 0.5,
        size: 1 + pick() * 1.5,
        phase: pick() * TAU,
      });
    }
    // The edges of each face, drawn denser and brighter, keep the silhouette
    // crisp while the sail turns.
    const outline = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    SAIL_FACES.forEach((d, layer) => {
      outline.setAttribute("d", d);
      const total = outline.getTotalLength?.() ?? 0;
      for (let at = 0; at < total; at += 2.2) {
        const point = outline.getPointAtLength(at);
        const across = (point.x - 72) / 322;
        const billow = Math.sin(Math.PI * Math.min(Math.max(across, 0), 1));
        const depth =
          layer === 0
            ? 46 * billow
            : layer === 1
              ? -58 - 26 * billow
              : 30 - across * 70;
        const angle = pick() * TAU;
        const far = 420 + pick() * 760;
        list.push({
          x: point.x - (SAIL_VIEW.x + SAIL_VIEW.size / 2),
          y: point.y - (SAIL_VIEW.y + SAIL_VIEW.size / 2),
          z: depth,
          fx: Math.cos(angle) * far,
          fy: -120 - pick() * 520,
          fz: Math.sin(angle) * far,
          layer,
          delay: pick() * 0.9 + (1 - point.y / 512) * 0.5,
          size: 2.1,
          phase: pick() * TAU,
        });
      }
    });
    return list;
  }

  /** The sail as a body of light: thousands of points turning in 3D. */
  function drawSail(time: number): void {
    if (sailScale <= 0 || motes.length === 0 || detail === 0) return;
    if (gathered < 0) gathered = time;
    const since = time - gathered;
    const yaw = Math.sin(time * 0.33) * 0.42 + pointer.x * 0.55;
    const pitch = pointer.y * -0.16 + Math.sin(time * 0.27) * 0.04;
    const bob = Math.sin(time * 0.62) * 3;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);
    const lens = 1150;
    const stride = detail < 0.75 ? 2 : 1;

    ctx.globalCompositeOperation = "lighter";
    for (let layer = 0; layer < SAIL_TINTS.length; layer += 1) {
      ctx.fillStyle = SAIL_TINTS[layer] ?? "#ffffff";
      for (let index = 0; index < motes.length; index += stride) {
        const mote = motes[index];
        if (!mote || mote.layer !== layer) continue;
        // Gather: each point swirls in from the sky and settles on the sail.
        const raw = Math.min(Math.max((since - mote.delay) / ASSEMBLE, 0), 1);
        const settle = 1 - Math.pow(1 - raw, 3);
        const away = 1 - settle;
        const swirl = away * 2.4;
        const cosS = Math.cos(swirl);
        const sinS = Math.sin(swirl);
        const fx = mote.fx * cosS - mote.fz * sinS;
        const fz = mote.fx * sinS + mote.fz * cosS;
        const x = (mote.x + (fx - mote.x) * away) * sailScale;
        const y = (mote.y + (mote.fy - mote.y) * away) * sailScale;
        const z = (mote.z + (fz - mote.z) * away) * sailScale;
        // Turn about the mast (yaw), then nod (pitch).
        const x1 = x * cosY + z * sinY;
        const z1 = z * cosY - x * sinY;
        const y1 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;
        const scale = lens / (lens - z2);
        const shimmer = 0.72 + 0.28 * Math.sin(time * 1.6 + mote.phase);
        const near = Math.min(Math.max(0.55 + z2 / 260, 0.25), 1);
        ctx.globalAlpha =
          fade *
          (0.25 + 0.75 * settle) *
          shimmer *
          near *
          (layer === 2 ? 0.95 : 0.8);
        const size = mote.size * scale * (stride === 2 ? 1.5 : 1);
        ctx.fillRect(
          sailCentreX + x1 * scale - size / 2,
          sailCentreY + y1 * scale + bob - size / 2,
          size,
          size,
        );
      }
    }
    ctx.globalCompositeOperation = "source-over";
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
    const rippleAge = time - ripple.born;
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
        // A touch on the water sends one ring outward and lets it die away.
        let ring = 0;
        if (rippleAge < 3.2) {
          const reachX = wx - ripple.x;
          const reachZ = (z - ripple.z) * 0.6;
          const distance = Math.sqrt(reachX * reachX + reachZ * reachZ);
          const front = distance - rippleAge * 1.5;
          ring =
            Math.sin(front * 7) *
            Math.exp(-front * front * 1.6) *
            (1 - rippleAge / 3.2) *
            2.4;
        }
        const sy =
          horizon + (1 - (wave + ring) * swell * (0.4 + z * 0.22)) * scale;
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

  function applyPointer(): void {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
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
    const gap = (now - last) / 1000;
    const delta = Math.min(gap, 0.05);
    last = now;
    clock += delta;
    fade = Math.min(1, fade + delta / 1.8);
    applyPointer();
    ctx.clearRect(0, 0, width, height);
    drawStars(clock);
    drawMeteor(clock);
    drawSea(clock);
    drawSail(clock);
    ctx.globalAlpha = 1;
    govern(now, gap);
    schedule();
  }

  /**
   * The page comes before the scene. When frames run long the scene steps
   * down: first the sail thins out, then the sail hands back to the static
   * mark and only the sea and sky remain, and if even that is too much the
   * scene holds one still frame (the visitor can start it with the control).
   */
  function govern(started: number, gap: number): void {
    // The first moments after a start are warm-up, not a verdict.
    if (fade < 0.15) return;
    const cost = performance.now() - started;
    if (sampled === 0) windowStart = started;
    sampled += 1;
    // Slow: under 30 frames a second, or a frame that takes most of its slot.
    if (cost > 12 || gap > 0.034) slow += 1;
    if (cost > 28 || gap > 0.06) stalled += 1;
    // Judge every 30 frames, or sooner when frames are so long that 30 of
    // them would keep a struggling device waiting.
    if (sampled < 30 && (sampled < 4 || started - windowStart < 1200)) return;
    const slowShare = slow / sampled;
    const stalledShare = stalled / sampled;
    sampled = 0;
    slow = 0;
    stalled = 0;
    windowStart = started;
    if (stalledShare > 0.5) {
      if (detail > 0) dropSail();
      else if (!userChose) setPaused(true, "resting");
    } else if (slowShare >= 0.3) {
      if (detail === 1) detail = 0.5;
      else if (detail === 0.5) dropSail();
    }
  }

  function dropSail(): void {
    detail = 0;
    root.removeAttribute("data-horizon-sail");
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

  function setPaused(
    next: boolean,
    state: "paused" | "resting" = "paused",
  ): void {
    paused = next;
    root.dataset.horizonSeaState = paused ? state : "running";
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
      drawSail(clock);
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

  // A press on the water sends a ring across it; a press on the sky sends
  // the sail back to the stars to gather again. Links and buttons are left
  // alone: the press only counts on the bare scene.
  root.addEventListener(
    "pointerdown",
    (event) => {
      if (paused) return;
      const target = event.target as Element | null;
      if (target?.closest("a, button, summary, input, [data-hero-focal]"))
        return;
      const box = root.getBoundingClientRect();
      const px = event.clientX - box.left;
      const py = event.clientY - box.top;
      if (py > horizon + 6) {
        const depth = height - horizon;
        const z = Math.min(Math.max((depth * 1.04) / (py - horizon), 1), 36);
        ripple.x = (px - width / 2) / ((depth * 1.04) / z) + pointer.x * 0.55;
        ripple.z = z;
        ripple.born = clock;
      } else if (sailScale > 0) {
        gathered = clock;
      }
    },
    { passive: true },
  );

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
      userChose = true;
      setPaused(!paused);
    });
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
