import { expect, test, type Page } from "@playwright/test";

/**
 * C3-A Task 3 — Editorial Typography v2 contract.
 *
 * Extends the Wave H12 (WCAG 1.4.4 Resize text) and Wave H13 (1.4.12 Text
 * spacing) guards to the C3 editorial layer: EN/VI wrapping across the
 * responsive ladder, 200% text zoom, and text-spacing overrides.
 *
 * Measurement discipline: the root font size / override style is applied first,
 * then the assertion waits for `document.fonts.ready` and two animation frames
 * before reading layout. Measuring in the same tick can read a pre-reflow,
 * pre-font-swap layout, reporting an overflow that does not exist once the
 * layout settles — or hiding one that does. The previous revision also injected
 * the text-spacing override before navigation, which the navigation discarded;
 * it now applies after the page has loaded.
 */
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
  { name: "small", width: 320, height: 720 },
] as const;

type Overflow = {
  overflow: number;
  metrics: string;
  offenders: string[];
  inner: string[];
  nodes?: string[];
};

async function settledOverflow(page: Page): Promise<Overflow> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
    );
    const doc = document.documentElement;
    // Engine-independent question: "would this document need horizontal
    // scrolling?" scrollWidth vs clientWidth both describe the layout viewport,
    // whereas window.innerWidth includes the scrollbar on some engines and not
    // others - measuring against it hid a real 4px reflow overflow.
    const overflow = doc.scrollWidth - doc.clientWidth;
    const metrics =
      `inner=${window.innerWidth} client=${doc.clientWidth} ` +
      `scroll=${doc.scrollWidth} bodyClient=${document.body.clientWidth} ` +
      `scrollbar=${window.innerWidth - doc.clientWidth}`;
    // Decorative bleed inside an overflow-hidden ancestor cannot create
    // document scroll; report the widest elements that are NOT clipped, with
    // the properties that decide whether they can reflow.
    const isClipped = (el: Element): boolean => {
      let node = el.parentElement;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        if (/(hidden|clip|auto|scroll)/.test(cs.overflowX)) return true;
        node = node.parentElement;
      }
      return false;
    };
    const offenders =
      overflow > 1
        ? [...document.querySelectorAll<HTMLElement>("body *")]
            .map((el) => ({ el, right: el.getBoundingClientRect().right }))
            .filter((entry) => entry.right > doc.clientWidth + 0.5)
            .sort((a, b) => b.right - a.right)
            .slice(0, 4)
            .map((entry) => {
              const cs = getComputedStyle(entry.el);
              const rect = entry.el.getBoundingClientRect();
              return (
                `${entry.el.tagName.toLowerCase()}.${[...entry.el.classList]
                  .slice(0, 3)
                  .join(".")} right=${entry.right.toFixed(1)}` +
                ` w=${Math.round(rect.width)} x=${Math.round(rect.x)}` +
                ` min-w=${cs.minWidth} ws=${cs.whiteSpace}` +
                ` wrap=${cs.overflowWrap}/${cs.wordBreak}` +
                ` clipped=${isClipped(entry.el) ? "yes" : "no"}` +
                ` text="${(entry.el.textContent ?? "").trim().slice(0, 40)}"`
              );
            })
        : [];
    // A box can stay inside the viewport while its own content leaves it (a text
    // run wider than the block, a flex row that cannot wrap). Those containers
    // are where an overflow is actually fixed, so name them too.
    const inner =
      overflow > 1
        ? [...document.querySelectorAll<HTMLElement>("body *")]
            .map((el) => ({ el, excess: el.scrollWidth - el.clientWidth }))
            .filter((entry) => entry.excess > 1 && entry.el.clientWidth > 0)
            .sort((a, b) => b.excess - a.excess)
            .slice(0, 4)
            .map((entry) => {
              const cs = getComputedStyle(entry.el);
              return (
                `${entry.el.tagName.toLowerCase()}.${[...entry.el.classList]
                  .slice(0, 3)
                  .join(".")} excess=${entry.excess}` +
                ` client=${entry.el.clientWidth} display=${cs.display}` +
                ` wrap=${cs.overflowWrap} ws=${cs.whiteSpace}` +
                ` min-w=${cs.minWidth} flex-wrap=${cs.flexWrap}` +
                ` text="${(entry.el.textContent ?? "").trim().slice(0, 30)}"`
              );
            })
        : [];
    return { overflow, metrics, offenders, inner };
  });
}

/**
 * A document can need horizontal scrolling with no element whose border box
 * leaves the viewport: an inline text run wider than its block, or a
 * pseudo-element, widens the scrollable area and belongs to no element rect.
 * When that happens, ask the browser for its layout tree - the same snapshot
 * DevTools renders - and name the node that actually overflows.
 */
async function overflowNodes(page: Page): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const snapshot = (await session.send("DOMSnapshot.captureSnapshot", {
      computedStyles: [],
      includeDOMRects: true,
      includePaintOrder: true,
    })) as unknown as {
      strings: string[];
      documents: {
        nodes: { nodeName: number[]; nodeValue?: number[] };
        layout: { nodeIndex: number[]; bounds: number[][] };
      }[];
    };
    const doc = snapshot.documents?.[0];
    if (!doc?.layout) return [];
    const rows: string[] = [];
    for (let i = 0; i < doc.layout.nodeIndex.length; i += 1) {
      const bounds = doc.layout.bounds[i];
      if (!bounds || bounds.length < 4) continue;
      const [x, , width] = bounds;
      if (width <= 0) continue;
      const right = x + width;
      if (right <= clientWidth + 0.5) continue;
      const nodeIndex = doc.layout.nodeIndex[i];
      const name = snapshot.strings[doc.nodes.nodeName[nodeIndex]];
      const valueIndex = doc.nodes.nodeValue?.[nodeIndex] ?? -1;
      const value = valueIndex >= 0 ? snapshot.strings[valueIndex] : "";
      rows.push(
        `${name} right=${right.toFixed(1)} w=${width.toFixed(1)}` +
          (value ? ` text="${value.trim().slice(0, 40)}"` : ""),
      );
    }
    return rows.sort().slice(0, 6);
  } finally {
    await session.detach().catch(() => undefined);
  }
}

/** Only pay for the layout-tree dump when the document actually overflows. */
async function withNodes(page: Page, result: Overflow): Promise<Overflow> {
  if (result.overflow > 1) {
    result.nodes = await overflowNodes(page).catch(() => []);
  }
  return result;
}

function describe(prefix: string, result: Overflow) {
  const detail = result.offenders.length
    ? ` — ${result.offenders.join(" | ")}`
    : "";
  const inner = result.inner.length
    ? ` | inner overflow: ${result.inner.join(" | ")}`
    : "";
  const nodes = result.nodes?.length
    ? ` | layout nodes: ${result.nodes.join(" | ")}`
    : "";
  return `${prefix} ${result.overflow}px [${result.metrics}]${detail}${inner}${nodes}`;
}

test.describe("C3-A Editorial Typography — EN/VI wrapping", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} (${viewport.width}px): no horizontal overflow`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/en/");
      const result = await withNodes(page, await settledOverflow(page));
      expect(
        result.overflow,
        describe("wrap overflow", result),
      ).toBeLessThanOrEqual(1);
    });
  }

  test("VI copy wraps within the same ladder", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/vi/");
    const result = await withNodes(page, await settledOverflow(page));
    expect(
      result.overflow,
      describe("VI wrap overflow", result),
    ).toBeLessThanOrEqual(1);
  });
});

test.describe("C3-A Editorial Typography — 200% text zoom", () => {
  for (const viewport of VIEWPORTS) {
    test(`${viewport.name} (${viewport.width}px): 200% text zoom does not scroll sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/en/");
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const result = await withNodes(page, await settledOverflow(page));
      expect(
        result.overflow,
        describe("200% zoom overflow", result),
      ).toBeLessThanOrEqual(1);
    });
  }

  test("768px: the product cards do not overflow their own box at 200% text", async ({
    page,
  }) => {
    // The document-level guard above can pass locally and fail on a runner with
    // wider fallback fonts. This one is font-independent: it measures each
    // product card's own box, where a flex child that pins min-content
    // (min-width: auto) shows up as scrollWidth > clientWidth regardless of the
    // glyph widths. Found live: the card header row carried flex-wrap: nowrap
    // and the status badge could not shrink, overflowing by 151px.
    // 768px is the failing condition: md:grid-cols-2 is a px breakpoint, so a
    // 200% root font squeezes each card into a half-width column while every
    // rem-based size inside it doubles.
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/en/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const offenders = await page.evaluate(() => {
      const out: string[] = [];
      const clipped = (el: Element) => {
        const s = getComputedStyle(el);
        return s.overflow !== "visible" || s.overflowX !== "visible";
      };
      for (const card of document.querySelectorAll(
        "article[data-product-tier]",
      )) {
        for (const el of [card, ...card.querySelectorAll("*")]) {
          if (clipped(el) || el.clientWidth === 0) continue;
          if (el.scrollWidth > el.clientWidth + 1) {
            out.push(
              `${el.tagName.toLowerCase()} excess=${el.scrollWidth - el.clientWidth} text="${(el.textContent ?? "").trim().slice(0, 24)}"`,
            );
          }
        }
      }
      return out.slice(0, 6);
    });
    expect(offenders, offenders.join(" | ")).toEqual([]);
  });

  test("320px: the key routes reflow at 200% text", async ({ page }) => {
    // Same structural defect class as the homepage: a grid/flex child that pins
    // its min-content (product-act intro row, bilingual mirror pair, boundary
    // card, contact block). The guard measures each surface directly.
    await page.setViewportSize({ width: 320, height: 720 });
    for (const route of [
      "/en/products/",
      "/vi/products/",
      "/en/contact/",
      "/en/security/",
      "/vi/security/",
      "/en/evidence/security-reporting-is-private/",
    ]) {
      await page.goto(route);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const result = await withNodes(page, await settledOverflow(page));
      expect(
        result.overflow,
        describe(`${route} 200% zoom overflow`, result),
      ).toBeLessThanOrEqual(1);
    }
  });

  test("320px: the VI and ZH homepages reflow at 200% text", async ({
    page,
  }) => {
    // The EN ladder above is the measured contract; trilingual parity means the
    // VI and ZH homepages must satisfy the same 320px + 200% text condition, not
    // only the 390px one covered by text-zoom.spec.ts.
    await page.setViewportSize({ width: 320, height: 720 });
    for (const route of ["/vi/", "/zh/"]) {
      await page.goto(route);
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const result = await withNodes(page, await settledOverflow(page));
      expect(
        result.overflow,
        describe(`${route} 200% zoom overflow`, result),
      ).toBeLessThanOrEqual(1);
    }
  });

  test("text-spacing override is respected", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/");
    await page.addStyleTag({
      content: `
        * {
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
          line-height: 1.5 !important;
        }
      `,
    });
    const result = await withNodes(page, await settledOverflow(page));
    expect(
      result.overflow,
      describe("text-spacing overflow", result),
    ).toBeLessThanOrEqual(1);
  });
});

test.describe("C3-A Editorial Typography — display hierarchy", () => {
  test("headings render with display weight and section hierarchy", async ({
    page,
  }) => {
    await page.goto("/en/");
    await expect(page.locator("h1").first()).toBeVisible();

    const h1Styles = await page
      .locator("h1")
      .first()
      .evaluate((el) => {
        const computed = getComputedStyle(el);
        return {
          fontFamily: computed.fontFamily,
          fontWeight: Number(computed.fontWeight),
          fontSize: Number.parseFloat(computed.fontSize),
        };
      });
    // Brand Kit v5: the display serif at its one shipped weight (300).
    expect(h1Styles.fontFamily).toMatch(/^"?Noto Serif Display"?/);
    expect(h1Styles.fontWeight).toBe(300);
    expect(h1Styles.fontSize).toBeGreaterThanOrEqual(24);
  });
});

test.describe("C3-A Editorial Typography — hero display type", () => {
  /**
   * Display tracking/leading are em-based, so assert the *ratios* (never px):
   * a fluid font size must not fail the contract. VI carries stacked tone marks,
   * so it is set looser and taller than EN while staying inside the display band.
   */
  async function heroType(page: Page) {
    return page.locator("#hero-title").evaluate((el) => {
      const computed = getComputedStyle(el);
      const size = Number.parseFloat(computed.fontSize);
      return {
        tracking: Number.parseFloat(computed.letterSpacing) / size,
        leading: Number.parseFloat(computed.lineHeight) / size,
      };
    });
  }

  test("VI tracking and leading are looser than EN, both stay display-tight", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/");
    const en = await heroType(page);
    await page.goto("/vi/");
    const vi = await heroType(page);

    expect(en.tracking, JSON.stringify(en)).toBeCloseTo(-0.03, 2);
    expect(en.leading, JSON.stringify(en)).toBeCloseTo(1.1, 2);
    expect(vi.tracking, JSON.stringify(vi)).toBeCloseTo(-0.015, 2);
    expect(vi.leading, JSON.stringify(vi)).toBeCloseTo(1.16, 2);
    expect(vi.tracking).toBeGreaterThan(en.tracking);
    expect(vi.tracking).toBeLessThan(0);
    expect(vi.leading).toBeGreaterThan(en.leading);
    expect(vi.leading).toBeLessThan(1.3);
  });

  test("320px at 200% text: the VI headline keeps every stack inside its box", async ({
    page,
  }) => {
    // Tight display tracking is where Vietnamese diacritics collide; the locale
    // rule must leave the heading box intact (no clipped marks), the same
    // condition c4-optical-type.spec.ts guards for the house h2 at 100%.
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/vi/");
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    const box = await page.locator("#hero-title").evaluate((el) => {
      const computed = getComputedStyle(el);
      return {
        horizontal:
          el.scrollWidth > el.clientWidth + 1 &&
          computed.overflowX === "hidden",
        vertical:
          el.scrollHeight > el.clientHeight + 1 &&
          computed.overflowY === "hidden",
        tracking: computed.letterSpacing,
        lineHeight: computed.lineHeight,
      };
    });
    expect(box.horizontal, `heading box clips: ${JSON.stringify(box)}`).toBe(
      false,
    );
    expect(box.vertical, `heading box clips: ${JSON.stringify(box)}`).toBe(
      false,
    );
  });
});

test.describe("Self-hosted Inter — Vietnamese delivery", () => {
  test("keeps font transfer under 100 KB with no layout shifts", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const observedWindow = window as Window & {
        __layoutShifts: { value: number; sources: string[] }[];
      };
      observedWindow.__layoutShifts = [];
      new PerformanceObserver((list) => {
        for (const rawEntry of list.getEntries()) {
          const entry = rawEntry as PerformanceEntry & {
            value: number;
            hadRecentInput: boolean;
            sources: {
              node: Node | null;
              previousRect: DOMRectReadOnly;
              currentRect: DOMRectReadOnly;
            }[];
          };
          if (entry.hadRecentInput) continue;
          observedWindow.__layoutShifts.push({
            value: entry.value,
            sources: entry.sources.map(
              ({ node, previousRect, currentRect }) => {
                const element = node instanceof Element ? node : null;
                const name = element?.className
                  ? `${node?.nodeName}.${String(element.className).replace(/\s+/g, ".")}`
                  : (node?.nodeName ?? "unknown");
                return `${name} ${previousRect.width}x${previousRect.height}->${currentRect.width}x${currentRect.height}`;
              },
            ),
          });
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    // Measure real wire transfer, not `response.body()` byte sums: a cached
    // second fetch still yields the full body but costs no network. Resource
    // Timing exposes the actual transfer size, so a genuine double download
    // (observed on WebKit when the font preload carried `crossorigin`) fails.
    await page.goto("/vi/");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });

    const fontTransfers = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((entry) =>
          /\/fonts\/inter-(latin|vietnamese)-wght-v5\.3\.0\.woff2$/.test(
            entry.name,
          ),
        )
        .map((entry) => ({
          path: new URL(entry.name).pathname,
          transferSize: (entry as PerformanceResourceTiming).transferSize,
        })),
    );
    const transferredBytes = fontTransfers.reduce(
      (total, entry) => total + entry.transferSize,
      0,
    );
    const layoutShifts = await page.evaluate(
      () =>
        (
          window as Window & {
            __layoutShifts: { value: number; sources: string[] }[];
          }
        ).__layoutShifts,
    );
    for (const subset of ["latin", "vietnamese"]) {
      const downloads = fontTransfers.filter(
        (entry) =>
          entry.path.includes(`inter-${subset}-wght-v5.3.0.woff2`) &&
          entry.transferSize > 1_024,
      );
      expect(
        downloads.length,
        `${subset} subset must be downloaded exactly once; a repeated full transfer means the font preload was not reused:\n${JSON.stringify(fontTransfers, null, 2)}`,
      ).toBe(1);
    }
    expect(
      await page.evaluate(() => document.fonts.check('16px "Inter Variable"')),
    ).toBe(true);
    expect(
      transferredBytes,
      JSON.stringify(fontTransfers, null, 2),
    ).toBeLessThanOrEqual(100_000);
    expect(
      layoutShifts.reduce((total, entry) => total + entry.value, 0),
      JSON.stringify(layoutShifts),
    ).toBe(0);
  });
});
