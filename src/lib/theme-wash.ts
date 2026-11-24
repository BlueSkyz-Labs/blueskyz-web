/**
 * Theme wash (Owner 2026-11-24): the new theme grows over the page as a
 * soft-edged circle from the press point, like light spreading, instead of
 * the whole page flipping at once.
 *
 * Mechanism: a same-document View Transition. The new snapshot is masked by
 * a radial gradient (CSS in global.css, `html[data-theme-wash]`) whose radius
 * `--theme-wash-radius` is animated once with the Web Animations API, so no
 * `@keyframes` and no infinite motion. A keyboard press (event.detail === 0)
 * grows from the icon's centre.
 *
 * Fallback: engines without View Transitions and visitors who prefer reduced
 * motion get the plain, immediate switch. The theme itself is still applied
 * only through the root attribute (theme.ts), so CSP `script-src 'self'`
 * holds.
 */

const WASH = {
  duration: 600,
  easing: "cubic-bezier(.3, .5, .3, 1)",
  fill: "forwards" as const,
};

// The mask is fully opaque up to 70% of the radius, then fades: the radius
// must reach the far corner divided by 0.7 to clear the whole page.
const SOFT_EDGE = 0.7;

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

let current: object | null = null;

export function washTheme(event: MouseEvent, apply: () => void): void {
  const doc = document as TransitionDocument;
  if (
    typeof doc.startViewTransition !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    apply();
    return;
  }

  const button = event.currentTarget as HTMLElement | null;
  const box = button?.getBoundingClientRect();
  const fromKeyboard = event.detail === 0 && box;
  const x = fromKeyboard ? box.x + box.width / 2 : event.clientX;
  const y = fromKeyboard ? box.y + box.height / 2 : event.clientY;
  const radius =
    Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    ) / SOFT_EDGE;

  const root = document.documentElement;
  root.setAttribute("data-theme-wash", "");
  root.style.setProperty("--theme-wash-x", `${x}px`);
  root.style.setProperty("--theme-wash-y", `${y}px`);

  const token = {};
  current = token;
  const transition = doc.startViewTransition(apply);
  transition.ready
    .then(() => {
      root.animate(
        { "--theme-wash-radius": ["0px", `${radius}px`] },
        { ...WASH, pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
  transition.finished
    .catch(() => {})
    .finally(() => {
      // A second press during the wash owns the cleanup.
      if (current !== token) return;
      root.removeAttribute("data-theme-wash");
      root.style.removeProperty("--theme-wash-x");
      root.style.removeProperty("--theme-wash-y");
    });
}
