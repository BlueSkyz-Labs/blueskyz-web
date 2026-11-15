import type { EditionRecord } from "../lib/editions.ts";

/**
 * C4-B G6 — Authored collected editions.
 *
 * Each edition curates items that are ALREADY public on this site. Nothing here
 * creates a product, claim, evidence or release statement: the ids below must
 * keep resolving in the canonical indexes, and `resolveEdition` drops any that
 * stop resolving rather than publishing a stale promise.
 */

export const EDITIONS: readonly EditionRecord[] = [
  {
    id: "trust-foundations",
    title: {
      en: "Trust Foundations",
      vi: "Nền tảng tin cậy",
      zh: "信任基础",
      "zh-hant": "信任基礎",
    },
    deck: {
      en: "Three public statements about security reports, tracking and products, each linked to its sources.",
      vi: "Ba tuyên bố công khai về báo cáo bảo mật, theo dõi và sản phẩm, mỗi tuyên bố đều dẫn tới nguồn.",
      zh: "关于安全报告、追踪和产品的三条公开声明，每条都链接到其来源。",
      "zh-hant": "關於資安通報、追蹤和產品的三則公開聲明，每則都連結到其來源。",
    },
    sources: [
      { kind: "claim", id: "security-reporting-is-private" },
      { kind: "claim", id: "privacy-no-tracking-on-this-site" },
      { kind: "claim", id: "registry-publishes-only-proven-products" },
    ],
    note: {
      en: "Every statement here was already published on this site; this collection adds none of its own.",
      vi: "Mọi tuyên bố ở đây đều đã đăng trên trang này; tuyển tập không thêm tuyên bố nào mới.",
      zh: "选自本站已发布的声明，不新增任何声明。",
      "zh-hant": "選自本站已發布的聲明，不新增任何聲明。",
    },
    published: "2026-09-23",
  },
];

/** Look up one authored edition by id. */
export function getEdition(id: string): EditionRecord | undefined {
  return EDITIONS.find((edition) => edition.id === id);
}
