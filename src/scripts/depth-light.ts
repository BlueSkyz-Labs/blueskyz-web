/**
 * Depth light: product captures answer a fine pointer (Owner 2026-11-10).
 *
 * An element marked `data-depth-light="<max degrees>"` leans a few degrees
 * toward the pointer and a soft light follows it across the surface. The
 * script only records where the pointer is, as custom properties; all drawing
 * is CSS in `cinematic-product-house.css`. Presentation only: nothing is
 * hidden, moved in layout or made interactive. It does not run on touch
 * screens, under reduced motion or in forced colours, where the capture is
 * the plain static image.
 */
const TARGET = "[data-depth-light]";

function bind(target: HTMLElement) {
  const limit = Number(target.dataset.depthLight) || 4;
  let frame = 0;
  let nextX = 0;
  let nextY = 0;

  const paint = () => {
    frame = 0;
    const box = target.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const x = Math.min(1, Math.max(0, (nextX - box.left) / box.width));
    const y = Math.min(1, Math.max(0, (nextY - box.top) / box.height));
    const style = target.style;
    style.setProperty("--depth-ry", `${((x - 0.5) * 2 * limit).toFixed(2)}deg`);
    style.setProperty("--depth-rx", `${((0.5 - y) * 2 * limit).toFixed(2)}deg`);
    style.setProperty("--depth-light-x", `${(x * 100).toFixed(1)}%`);
    style.setProperty("--depth-light-y", `${(y * 100).toFixed(1)}%`);
    target.setAttribute("data-depth-active", "");
  };

  target.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType !== "mouse") return;
      nextX = event.clientX;
      nextY = event.clientY;
      if (frame === 0) frame = requestAnimationFrame(paint);
    },
    { passive: true },
  );
  target.addEventListener("pointerleave", () => {
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    target.removeAttribute("data-depth-active");
    target.style.removeProperty("--depth-ry");
    target.style.removeProperty("--depth-rx");
  });
}

export function initDepthLight() {
  if (
    !matchMedia("(hover: hover) and (pointer: fine)").matches ||
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    matchMedia("(forced-colors: active)").matches
  ) {
    return;
  }
  for (const target of document.querySelectorAll<HTMLElement>(TARGET)) {
    bind(target);
  }
}
