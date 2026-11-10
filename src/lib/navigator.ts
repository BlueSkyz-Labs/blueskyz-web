import { getFooterLinks, getNav, type Language } from "@/data/site";
import { TRUST_LEDGER } from "@/data/trust-ledger";
import { INTEGRITY_ENTRIES } from "@/data/integrity";
import { GUIDE_META } from "@/data/page-meta";
import {
  getEvidencePassport,
  getEvidencePassportIds,
  getEvidencePassportPath,
} from "@/lib/claims";
import { getProductProfilePath } from "@/lib/product-routes";
import { productCopy } from "@/lib/product-copy";
import { productPageCopy } from "@/components/product/product-page-copy";
import type { ProductEntry } from "@/lib/products";

export interface NavigatorItem {
  href: string;
  label: string;
  kind: "route" | "trust" | "product" | "evidence";
  aliases: string[];
}

const ROUTE_ALIASES: Record<string, Record<Language, string[]>> = {
  products: {
    en: ["products", "public registry", "product status"],
    vi: ["sản phẩm", "trạng thái sản phẩm"],
    zh: ["产品", "公开目录", "产品状态"],
    "zh-hant": ["產品", "公開目錄", "產品狀態"],
  },
  about: {
    en: ["about", "company", "founder"],
    vi: ["về blueskyz", "công ty"],
    zh: ["关于", "公司", "创始人"],
    "zh-hant": ["關於", "公司", "創辦人"],
  },
  contact: {
    en: ["contact", "reach out"],
    vi: ["liên hệ", "liên lạc"],
    zh: ["联系", "联系我们"],
    "zh-hant": ["聯絡", "聯絡我們"],
  },
  support: {
    en: ["support", "help", "recourse"],
    vi: ["hỗ trợ", "giúp đỡ"],
    zh: ["支持", "帮助", "补救"],
    "zh-hant": ["支援", "協助", "補救"],
  },
  privacy: {
    en: ["privacy", "data"],
    vi: ["quyền riêng tư", "dữ liệu"],
    zh: ["隐私", "数据"],
    "zh-hant": ["隱私", "資料"],
  },
  verify: {
    en: ["verify", "check yourself"],
    vi: ["kiểm chứng", "xác minh", "cách chúng tôi kiểm chứng"],
    zh: ["核实", "核验", "验证", "我们如何核验"],
    "zh-hant": ["核實", "核驗", "驗證", "查證", "我們如何核驗"],
  },
  editions: {
    en: ["collected editions", "editions", "collections"],
    vi: ["tuyển tập", "bộ sưu tập"],
    zh: ["选集", "已发布选集", "精选集合", "合集"],
    "zh-hant": ["選集", "合集"],
  },
  dossier: {
    en: ["public dossier", "dossier", "printable summary"],
    vi: ["hồ sơ công khai", "bản tóm tắt để in"],
    zh: ["公开档案", "档案", "可打印摘要"],
    "zh-hant": ["公開檔案", "可列印摘要"],
  },
  security: {
    en: ["security", "vulnerability", "report an issue"],
    vi: ["bảo mật", "lỗ hổng"],
    zh: ["安全", "漏洞", "报告问题"],
    "zh-hant": ["安全", "漏洞", "報告問題"],
  },
};

/** Search keywords for every public evidence-passport item (>= 2 per locale). */
const EVIDENCE_PASSPORT_ALIASES: Record<Language, string[]> = {
  en: ["evidence", "claim", "passport"],
  vi: ["bằng chứng", "tuyên bố"],
  zh: ["证据", "声明"],
  "zh-hant": ["證據", "聲明"],
};

/**
 * Existing page titles / link texts only (no new copy). Kept in lock-step with
 * the page files by tests/architecture/navigator-pages.test.mjs.
 */
const DECISION_ROOM_LABEL: Record<Language, string> = {
  en: "Compare claims",
  vi: "So sánh tuyên bố",
  zh: "比较声明",
  "zh-hant": "比較聲明",
};

const DECISION_ROOM_ALIASES: Record<Language, string[]> = {
  en: ["compare", "decision room"],
  vi: ["so sánh", "tuyên bố"],
  zh: ["比较", "声明"],
  "zh-hant": ["比較", "聲明"],
};

/** The showcase story page; the label is the word its own eyebrow shows. */
const SHOWCASE_LABEL: Record<Language, string> = {
  en: "Showcase",
  vi: "Showcase",
  zh: "展示",
  "zh-hant": "展示",
};
const SHOWCASE_ALIASES: Record<Language, string[]> = {
  en: ["screens", "screenshots", "apps"],
  vi: ["giao diện", "ảnh chụp", "ứng dụng"],
  zh: ["界面", "截图", "应用"],
  "zh-hant": ["介面", "截圖", "應用"],
};

const GUIDE_ALIASES: Record<Language, string> = {
  en: "guide",
  vi: "hướng dẫn",
  zh: "指南",
  "zh-hant": "指南",
};

/** The product showcase's own "read the guide" link text. */
const GUIDE_LINK_TEXT: Record<Language, string> = {
  en: "Read the getting-started guide",
  vi: "Xem hướng dẫn bắt đầu",
  zh: "阅读入门指南",
  "zh-hant": "閱讀入門指南",
};

/**
 * S+ Command Navigator index (Task 9).
 * Generated from live route truth + the Trust Ledger + the real public
 * product registry — never a manually duplicated list. Unknown routes are
 * impossible: every href originates from an approved source.
 */
export function buildNavigatorIndex(
  lang: Language,
  products: ProductEntry[],
  /** Gated routes that exist only when their data does (e.g. the Journal,
   * TRU-15: see `journalNavItems`). Empty by default. */
  extraRoutes: readonly { label: string; href: string }[] = [],
): NavigatorItem[] {
  const items: NavigatorItem[] = [];
  const byHref = new Map<string, NavigatorItem>();

  for (const link of [
    ...getNav(lang),
    ...extraRoutes,
    ...getFooterLinks(lang),
  ]) {
    if (byHref.has(link.href)) {
      continue;
    }
    const segment = link.href.split("/").filter(Boolean)[1] ?? "";
    const item: NavigatorItem = {
      href: link.href,
      label: link.label,
      kind: "route",
      aliases: [...(ROUTE_ALIASES[segment]?.[lang] ?? [])],
    };
    items.push(item);
    byHref.set(item.href, item);
  }

  for (const entry of TRUST_LEDGER) {
    const href = entry.href[lang];
    const existing = byHref.get(href);
    if (existing) {
      existing.aliases.push(entry.summary[lang]);
      continue;
    }
    const item: NavigatorItem = {
      href,
      label: entry.label[lang],
      kind: "trust",
      aliases: [entry.summary[lang]],
    };
    items.push(item);
    byHref.set(item.href, item);
  }

  // Provenance items derive from the integrity data only — public evidence
  // destinations, merged by href so no duplicate entries exist.
  for (const entry of INTEGRITY_ENTRIES) {
    for (const evidence of entry.evidence) {
      const href = evidence.href[lang];
      // Machine-readable artifacts (e.g. /.well-known/sgps.json) are evidence a
      // visitor can fetch, but they are not navigable command destinations.
      if (evidence.kind === "artifact" || href.includes("/.well-known/")) {
        continue;
      }
      if (byHref.has(href)) {
        // Destinations already present keep their own aliases: evidence ids
        // (e.g. "privacy-data-practices") can name other topics and must not
        // create false cross-topic matches.
        continue;
      }
      const aliases = [entry.id, entry.state, entry.summary[lang]];
      const item: NavigatorItem = {
        href,
        label: evidence.label[lang],
        kind: "evidence",
        aliases,
      };
      items.push(item);
      byHref.set(item.href, item);
    }
  }

  const decisionHref = `/${lang}/decision-room/`;
  if (!byHref.has(decisionHref)) {
    const item: NavigatorItem = {
      href: decisionHref,
      label: DECISION_ROOM_LABEL[lang],
      kind: "route",
      aliases: [...DECISION_ROOM_ALIASES[lang]],
    };
    items.push(item);
    byHref.set(item.href, item);
  }

  const showcaseHref = `/${lang}/showcase/`;
  if (!byHref.has(showcaseHref)) {
    const item: NavigatorItem = {
      href: showcaseHref,
      label: SHOWCASE_LABEL[lang],
      kind: "route",
      aliases: [...SHOWCASE_ALIASES[lang]],
    };
    items.push(item);
    byHref.set(item.href, item);
  }

  // Public evidence passports: the claim statement is the page's own label.
  const productRefs = products.map((product) => ({
    slug: product.data.slug,
    name: product.data.name,
  }));
  for (const id of getEvidencePassportIds(productRefs)) {
    const passport = getEvidencePassport(id, productRefs);
    const href = getEvidencePassportPath(lang, id);
    if (!passport || byHref.has(href)) continue;
    const item: NavigatorItem = {
      href,
      label: passport.claim[lang],
      kind: "evidence",
      aliases: [...EVIDENCE_PASSPORT_ALIASES[lang]],
    };
    items.push(item);
    byHref.set(href, item);
  }

  for (const product of products) {
    const guide = GUIDE_META[product.data.slug]?.[lang];
    const guideHref = `${getProductProfilePath(lang, product.data.slug)}guide/`;
    if (guide && !byHref.has(guideHref)) {
      items.push({
        href: guideHref,
        label: guide.title,
        kind: "route",
        aliases: [GUIDE_LINK_TEXT[lang], GUIDE_ALIASES[lang]],
      });
      byHref.set(guideHref, items[items.length - 1]!);
    }
  }

  for (const product of products) {
    items.push({
      href: getProductProfilePath(lang, product.data.slug),
      label: product.data.name,
      kind: "product",
      aliases: [product.data.slug, "product", "sản phẩm", "产品"],
    });
  }

  return items;
}

/**
 * ACQ-02: task-word search text per product profile path. It joins only the
 * strings the profile already publishes in the reader's language (registry
 * `jobs` and `capabilities`, and the profile's own "what it does" list), so a
 * visitor can find a product by the task it serves ("rent", "thu tiền")
 * without any new claim or visible label. The caller passes the public
 * products only; a product that is not public has no entry here.
 */
export function buildProductSearchText(
  lang: Language,
  products: ProductEntry[],
): Map<string, string> {
  const out = new Map<string, string>();
  for (const product of products) {
    const copy = productCopy(product.data, lang);
    const parts = new Set<string>([
      ...copy.jobs,
      ...copy.capabilities,
      ...productPageCopy(product.data, lang).whatItDoes,
    ]);
    out.set(
      getProductProfilePath(lang, product.data.slug),
      [...parts].join(" "),
    );
  }
  return out;
}
