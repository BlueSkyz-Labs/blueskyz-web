/**
 * Journey card rail (Owner 2026-11-24). Progressive enhancement only: the
 * server-rendered row already scrolls natively and every card is a link.
 * This adds
 *  - previous / next buttons that move the row by one card and disable at
 *    either end (the source's canScrollLeft / canScrollRight);
 *  - a preview dialog: a plain click on a card opens the expanded card in a
 *    native modal <dialog> (focus stays inside, Escape and a click outside
 *    close it); a modified click (new tab, new window) keeps the link.
 * On close the row brings the card back into view and focus returns to its
 * link. DOM APIs only (no innerHTML): the site runs with Trusted Types.
 */

const reducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;

function enhanceRail(section: HTMLElement): void {
  const rail = section.querySelector<HTMLElement>("[data-journal-rail]");
  const controls = section.querySelector<HTMLElement>(
    "[data-journal-rail-controls]",
  );
  const prev = section.querySelector<HTMLButtonElement>(
    "[data-journal-rail-prev]",
  );
  const next = section.querySelector<HTMLButtonElement>(
    "[data-journal-rail-next]",
  );
  if (!rail || !controls || !prev || !next) return;

  const update = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    // One pixel of slack for fractional scroll positions.
    prev.disabled = rail.scrollLeft <= 1;
    next.disabled = rail.scrollLeft >= max - 1;
    rail.toggleAttribute("data-more-start", !prev.disabled);
    rail.toggleAttribute("data-more-end", !next.disabled);
    // Nothing to scroll (one or two cards on a wide screen): no buttons.
    controls.hidden = max <= 1;
  };
  const step = () => {
    const card = rail.querySelector<HTMLElement>("[data-journal-item]");
    const gap = parseFloat(
      getComputedStyle(rail.firstElementChild as Element).columnGap || "0",
    );
    return card ? card.getBoundingClientRect().width + gap : 300;
  };
  const move = (direction: -1 | 1) =>
    rail.scrollBy({
      left: direction * step(),
      behavior: reducedMotion() ? "auto" : "smooth",
    });

  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  let frame = 0;
  rail.addEventListener(
    "scroll",
    () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    },
    { passive: true },
  );
  new ResizeObserver(update).observe(rail);
  rail.dataset.enhanced = "";
  update();
}

function enhancePreview(root: HTMLElement): void {
  const dialog = root.querySelector<HTMLDialogElement>(
    "[data-journal-preview]",
  );
  if (!dialog || typeof dialog.showModal !== "function") return;
  const panel = dialog.querySelector<HTMLElement>(
    "[data-journal-preview-panel]",
  );
  const date = dialog.querySelector<HTMLElement>("[data-journal-preview-date]");
  const title = dialog.querySelector<HTMLElement>("#journal-preview-title");
  const figure = dialog.querySelector<HTMLElement>(
    "[data-journal-preview-figure]",
  );
  const caption = dialog.querySelector<HTMLElement>(
    "[data-journal-preview-caption]",
  );
  const text = dialog.querySelector<HTMLElement>("[data-journal-preview-text]");
  const read = dialog.querySelector<HTMLAnchorElement>(
    "[data-journal-preview-read]",
  );
  const close = dialog.querySelector<HTMLButtonElement>(
    "[data-journal-preview-close]",
  );
  if (
    !panel ||
    !date ||
    !title ||
    !figure ||
    !caption ||
    !text ||
    !read ||
    !close
  )
    return;

  let opener: HTMLAnchorElement | null = null;

  const open = (link: HTMLAnchorElement) => {
    const card = link.closest<HTMLElement>("[data-journal-item]");
    if (!card) return;
    opener = link;
    const time = card.querySelector("time");
    date.replaceChildren(...(time ? [time.cloneNode(true)] : []));
    title.textContent = link.textContent?.trim() ?? "";
    text.textContent =
      card.querySelector(".journal-item__description")?.textContent?.trim() ??
      "";
    read.setAttribute("href", link.getAttribute("href") ?? link.href);

    figure.querySelector("img")?.remove();
    const art = card.querySelector<HTMLElement>("[data-journal-card-art]");
    const source = art?.querySelector("img");
    figure.hidden = !source;
    if (source) {
      const img = document.createElement("img");
      img.srcset = source.srcset;
      img.sizes = "(min-width: 64rem) 56rem, 92vw";
      img.src = source.src;
      img.alt = source.alt;
      img.width = source.width;
      img.height = source.height;
      img.decoding = "async";
      figure.prepend(img);
    }
    caption.textContent = art?.dataset.caption ?? "";

    document.documentElement.style.overflow = "hidden";
    dialog.showModal();
    dialog.scrollTop = 0;
    close.focus();
  };

  dialog.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    const link = opener;
    opener = null;
    if (!link) return;
    // The source's onCardClose: bring the card that was open back into view.
    const card = link.closest<HTMLElement>("[data-journal-item]");
    const rail = link.closest<HTMLElement>("[data-journal-rail]");
    if (card && rail) {
      const railBox = rail.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(rail).scrollPaddingInlineStart);
      if (cardBox.left < railBox.left || cardBox.right > railBox.right) {
        rail.scrollTo({
          left:
            rail.scrollLeft +
            cardBox.left -
            railBox.left -
            (Number.isFinite(pad) ? pad : 0),
          behavior: reducedMotion() ? "auto" : "smooth",
        });
      }
    }
    link.focus({ preventScroll: true });
  });
  close.addEventListener("click", () => dialog.close());
  // A press outside the panel (on the dimmed area) closes, as the source's
  // useOutsideClick does.
  dialog.addEventListener("click", (event) => {
    if (!panel.contains(event.target as Node)) dialog.close();
  });

  for (const link of root.querySelectorAll<HTMLAnchorElement>(
    "[data-journal-card-link]",
  )) {
    link.setAttribute("aria-haspopup", "dialog");
    link.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      open(link);
    });
  }
}

export function enhanceJournalRails(): void {
  const root = document.querySelector<HTMLElement>("[data-journal-index]");
  if (!root) return;
  for (const section of root.querySelectorAll<HTMLElement>(
    "[data-journal-branch]",
  )) {
    enhanceRail(section);
  }
  enhancePreview(root);
}
