import { expect, test, type Page } from "@playwright/test";

/**
 * Experience v6 S4 — display type and fluid scale. Brand Kit v5 (Owner,
 * 2026-11-10): display headings use the loaded Noto Serif Display face at
 * weight 300; Inter stays the interface and body face.
 * - EN/VI display headings resolve to Noto Serif Display, which really loads
 *   (Vietnamese subset on /vi/ with the stacked diacritics in the copy).
 * - zh / zh-hant headings stay on the CJK stack and do not leave a one-glyph or
 *   punctuation-only orphan line at 390 px.
 * - Display headings are never below 28 px and body/H3 keep Inter.
 */
const settle = (page: Page) =>
  page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
  });

test.describe("display typeface", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const lang of ["en", "vi"] as const) {
    test(`/${lang}/ h1 uses the loaded display face`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      await settle(page);
      const info = await page.evaluate(() => {
        const h1 = document.querySelector("h1") as HTMLElement;
        const cs = getComputedStyle(h1);
        const loaded = [...document.fonts]
          .filter(
            (f) =>
              f.family.includes("Noto Serif Display") && f.status === "loaded",
          )
          .map((f) => f.unicodeRange);
        // Engine-neutral coverage: Chromium serializes unicode-range in upper
        // case ("U+1EA0-1EF9"), WebKit in lower case ("U+1ea0-1ef9"). Compare
        // code points numerically instead of matching a string.
        const covers = (cp: number) =>
          loaded.some((list) =>
            list.split(",").some((part) => {
              const m = /^\s*U\+([0-9a-f?]+)(?:-([0-9a-f]+))?\s*$/i.exec(part);
              if (!m) return false;
              const lo = parseInt(m[1].replace(/\?/g, "0"), 16);
              const hi = m[2]
                ? parseInt(m[2], 16)
                : parseInt(m[1].replace(/\?/g, "f"), 16);
              return cp >= lo && cp <= hi;
            }),
          );
        return {
          family: cs.fontFamily,
          // Stacked Vietnamese diacritics (U+1EA0..U+1EF9) must be covered by a
          // loaded display face, and the exact weight + sample text must resolve.
          viCovered: covers(0x1ea0) && covers(0x1ef9),
          viFaceReady: document.fonts.check(
            `${cs.fontWeight} 1em "Noto Serif Display"`,
            "Ạ ế ộ ữ",
          ),
          size: parseFloat(cs.fontSize),
          weight: cs.fontWeight,
          loaded,
          clips: cs.overflow !== "visible",
          bodyFamily: getComputedStyle(document.body).fontFamily,
        };
      });
      // Brand Kit v5: display titles are Noto Serif Display; Inter stays the
      // interface and body face (asserted on body below).
      expect(info.family).toMatch(/^"?Noto Serif Display"?/);
      expect(info.size).toBeGreaterThanOrEqual(28);
      // Light display weight (display-type.css --display-weight: 300, the one
      // static serif weight shipped; never synthetic bold).
      expect(Number(info.weight)).toBe(300);
      expect(info.loaded.length).toBeGreaterThan(0);
      // Nothing may clip the tone-mark stacks above/below the line box.
      expect(info.clips).toBe(false);
      expect(info.bodyFamily).toMatch(/Inter/);
      if (lang === "vi") {
        expect(info.viCovered).toBe(true);
        expect(info.viFaceReady).toBe(true);
      }
    });
  }

  test("display weight is never applied below h1/h2 or to body copy", async ({
    page,
  }) => {
    await page.goto("/en/");
    await settle(page);
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => {
          const h1 = document.querySelector("h1");
          const display = h1 ? getComputedStyle(h1).fontWeight : "";
          return getComputedStyle(el).fontWeight === display;
        })
        .filter((el) => !el.closest("h1, h2"))
        .map((el) => el.tagName),
    );
    expect(offenders).toEqual([]);
  });

  for (const lang of ["zh", "zh-hant"] as const) {
    test(`/${lang}/ headings use the CJK stack without orphan lines`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/`);
      await settle(page);
      const result = await page.evaluate(() => {
        const out: {
          text: string;
          lines: string[];
          family: string;
          lb: string;
        }[] = [];
        for (const h of document.querySelectorAll<HTMLElement>("h1, h2")) {
          const text = h.textContent?.trim() ?? "";
          if (!/[㐀-鿿]/.test(text) || text.length < 6) continue;
          const node =
            h.firstChild?.nodeType === 3
              ? h.firstChild
              : h.querySelector("*")?.firstChild;
          if (!node || node.nodeType !== 3) continue;
          const range = document.createRange();
          const lines: string[] = [];
          let top = -1;
          const t = node.textContent ?? "";
          for (let i = 0; i < t.length; i += 1) {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const r = range.getClientRects()[0];
            if (!r) continue;
            if (Math.abs(r.top - top) > 4) {
              lines.push("");
              top = r.top;
            }
            lines[lines.length - 1] += t[i];
          }
          const cs = getComputedStyle(h);
          out.push({ text, lines, family: cs.fontFamily, lb: cs.lineBreak });
        }
        return out;
      });
      expect(result.length).toBeGreaterThan(0);
      for (const h of result) {
        // The CJK display stack (--font-display-cjk), not the Latin display token.
        expect(h.family).toMatch(
          lang === "zh-hant" ? /PingFang TC/ : /PingFang SC/,
        );
        expect(h.lb).toBe("strict");
        for (const line of h.lines.slice(1)) {
          const trimmed = line.trim();
          expect(
            trimmed.length,
            `orphan line "${trimmed}" in ${h.text}`,
          ).toBeGreaterThanOrEqual(2);
          expect(
            trimmed,
            `line starts with closing punctuation in ${h.text}`,
          ).not.toMatch(/^[，。、；：！？）」』]/);
        }
      }
    });
  }
});
