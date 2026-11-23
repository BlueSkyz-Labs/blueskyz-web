import { expect, test } from "@playwright/test";

/**
 * The landlord framing of the showcase (a landlord's month, tenants, a family
 * phone, the owner's computer) belongs to Sổ Trọ only. Vững Tay Lái and Sổ
 * Tâm render the same showcase with neutral wording, so a driving-theory or
 * journaling app is never headed "A landlord's month".
 */
const LANDLORD_WORDS: Record<"en" | "vi", RegExp> = {
  en: /landlord|tenant|owner’s computer|family phone/i,
  vi: /chủ trọ|chủ nhà|người thuê|người nhà/i,
};

/** Landlord words found in a text, or [] when the text is neutral. */
export const landlordWords = (lang: "en" | "vi", text: string) =>
  text.match(new RegExp(LANDLORD_WORDS[lang].source, "gi")) ?? [];

test("negative proof: the landlord-word scan catches the old heading", () => {
  expect(landlordWords("en", "A landlord’s month in Vững Tay Lái")).toEqual([
    "landlord",
  ]);
  expect(landlordWords("vi", "Một tháng làm chủ trọ cùng Sổ Tâm")).toEqual([
    "chủ trọ",
  ]);
  expect(landlordWords("vi", "Một tháng của chủ nhà cùng Sổ Tâm")).toEqual([
    "chủ nhà",
  ]);
  expect(landlordWords("en", "Vững Tay Lái, screen by screen")).toEqual([]);
});

for (const lang of ["en", "vi"] as const) {
  for (const product of ["vungtaylai", "sotam"]) {
    test(`${lang} ${product}: the showcase carries no landlord framing`, async ({
      page,
    }) => {
      await page.goto(`/${lang}/products/${product}/`);
      const showcase = page.locator(`[data-product-showcase="${product}"]`);
      await expect(showcase).toHaveCount(1);
      const text = await showcase.evaluate((node) => node.textContent ?? "");
      expect(landlordWords(lang, text)).toEqual([]);
    });
  }

  test(`${lang} sotro: the landlord story keeps its heading`, async ({
    page,
  }) => {
    await page.goto(`/${lang}/products/sotro/`);
    const heading = page.locator("#profile-showcase");
    await expect(heading).toHaveText(
      lang === "en"
        ? "A landlord’s month in Sổ Trọ"
        : /^Một tháng của chủ nhà cùng \S.*$/,
    );
  });
}
