/**
 * Truth-safe integrity contract (S+ v2 Task 0.4, populated by v3 S+5).
 *
 * Fail-closed by design: entries reference only facts that are already
 * public on the routes below. This module intentionally contains no scoring,
 * no blanket verification, and no runtime-generated dates.
 */

import { SECURITY_ADVISORY_URL } from "./site.ts";

export type TruthState =
  "source-linked" | "reviewed" | "changed" | "not-published" | "unavailable";

export interface LocalizedText {
  en: string;
  vi: string;
  zh: string;
  "zh-hant": string;
}

/**
 * One plain definition of the "Source-linked" truth-state label, shown beside
 * its first occurrence on every page that uses it.
 */
export const SOURCE_LINKED_LEGEND: LocalizedText = {
  en: "Source-linked means every claim on this page cites at least one public source you can open.",
  vi: "Đã gắn nguồn nghĩa là mọi tuyên bố trên trang này đều dẫn ít nhất một nguồn công khai bạn có thể mở.",
  zh: "“已关联来源”表示本页每一项声明都至少引出一个你可打开的公开来源。",
  "zh-hant":
    "「已關聯來源」表示本頁每一項聲明都至少引出一個你可開啟的公開來源。",
};

export interface EvidenceReference {
  /** Stable public evidence id referenced by the claim fabric. */
  id: string;
  kind: "route" | "artifact" | "private-reporting";
  href: LocalizedText;
  label: LocalizedText;
}

export interface ReviewMetadata {
  /** Authored ISO date (YYYY-MM-DD). Never generated at runtime. */
  reviewedOn: string;
  source: "content-review" | "evidence-update";
}

export interface BoundaryStatement {
  /** Stable public boundary id referenced by the claim fabric. */
  id: string;
  claim: LocalizedText;
  doesNotImply: LocalizedText;
}

export interface IntegrityEntry {
  id: string;
  surface: string;
  state: TruthState;
  summary: LocalizedText;
  evidence: EvidenceReference[];
  review?: ReviewMetadata;
  boundary?: BoundaryStatement;
}

/**
 * Authored, source-backed boundary statements (v3 S+3).
 * Each one is concrete: the claim mirrors what the page actually does, and
 * the "does not establish" half names a real, tempting over-reading.
 */
export const SECURITY_BOUNDARY: BoundaryStatement = {
  id: "bnd-security-reporting",
  claim: {
    en: "You can report a vulnerability privately through GitHub security advisories. Only the maintainers can see the report.",
    vi: "Bạn có thể báo cáo lỗ hổng riêng tư qua GitHub security advisories (kênh báo lỗ hổng riêng tư của GitHub). Chỉ người bảo trì đọc được báo cáo.",
    zh: "可通过 GitHub 安全通告私下报告漏洞，仅维护者可见。",
    "zh-hant": "可透過 GitHub 安全通告私下報告漏洞，僅維護者可見。",
  },
  doesNotImply: {
    en: "It does not create a bug-bounty program, a promised response time or a right to public disclosure.",
    vi: "Điều này không tạo ra chương trình thưởng lỗ hổng, cam kết thời gian phản hồi hay quyền công bố công khai.",
    zh: "这并不构成漏洞赏金计划、响应时间服务等级协议，或要求公开披露的权利。",
    "zh-hant":
      "這並不構成漏洞賞金計畫、回應時間服務等級協定，或要求公開揭露的權利。",
  },
};

export const PRIVACY_BOUNDARY: BoundaryStatement = {
  id: "bnd-privacy-collection",
  claim: {
    en: "This site sets no cookies. It keeps only the language and theme preferences you choose, in this browser, and does no tracking or profiling.",
    vi: "Trang web này không đặt cookie. Trang chỉ giữ lựa chọn ngôn ngữ và giao diện của bạn, ngay trong trình duyệt này, và không theo dõi hay lập hồ sơ người xem.",
    zh: "本站不设置 Cookie；仅在访客明确选择语言或主题时于浏览器本地保存偏好，不进行跟踪或行为画像。",
    "zh-hant":
      "本站不設定 Cookie；僅在訪客明確選擇語言或主題時於瀏覽器本地儲存偏好，不進行追蹤或行為剖析。",
  },
  doesNotImply: {
    en: "It does not mean that no data is processed at all: any website needs infrastructure that handles network data such as IP addresses and request headers.",
    vi: "Điều này không có nghĩa là không có dữ liệu nào được xử lý: trang web nào cũng cần hạ tầng xử lý dữ liệu mạng như địa chỉ IP và header yêu cầu (thông tin kỹ thuật trình duyệt tự gửi kèm).",
    zh: "这并不表示完全不会处理任何数据：提供任何网站服务仍需要基础设施处理网络层面元数据，例如 IP 地址和请求头。",
    "zh-hant":
      "這並不表示完全不會處理任何資料：提供任何網站服務仍需要基礎設施處理網路層級的中繼資料，例如 IP 位址和請求標頭。",
  },
};

/**
 * Public integrity entries (v3 S+5). Every entry references facts already
 * public on the routes below — nothing internal, nothing speculative.
 */
export const INTEGRITY_ENTRIES: readonly IntegrityEntry[] = [
  {
    id: "security-private-reporting",
    surface: "security",
    state: "source-linked",
    summary: {
      en: "Vulnerability reports reach the maintainers through GitHub's private advisories, and the security page shows no badge that has not been proven.",
      vi: "Báo cáo lỗ hổng đến tay người bảo trì qua kênh báo cáo riêng tư của GitHub, và trang bảo mật không đăng huy hiệu nào chưa được chứng minh.",
      zh: "漏洞报告通过 GitHub 私有通告送达维护者，安全页面不发布未经证明的徽章。",
      "zh-hant":
        "漏洞報告透過 GitHub 私有通告送達維護者，安全頁面不發布未經證明的徽章。",
    },
    evidence: [
      {
        id: "ev-security-advisory",
        kind: "private-reporting",
        href: {
          en: SECURITY_ADVISORY_URL,
          vi: SECURITY_ADVISORY_URL,
          zh: SECURITY_ADVISORY_URL,
          "zh-hant": SECURITY_ADVISORY_URL,
        },
        label: {
          en: "GitHub private vulnerability reporting",
          vi: "Báo cáo lỗ hổng riêng tư trên GitHub",
          zh: "GitHub 私有漏洞报告",
          "zh-hant": "GitHub 私有漏洞報告",
        },
      },
      {
        id: "ev-security-route",
        kind: "route",
        href: {
          en: "/en/security/",
          vi: "/vi/security/",
          zh: "/zh/security/",
          "zh-hant": "/zh-hant/security/",
        },
        label: {
          en: "Security page",
          vi: "Trang Bảo mật",
          zh: "安全页面",
          "zh-hant": "安全頁面",
        },
      },
    ],
    review: { reviewedOn: "2026-09-12", source: "content-review" },
    boundary: SECURITY_BOUNDARY,
  },
  {
    id: "privacy-data-practices",
    surface: "privacy",
    state: "source-linked",
    summary: {
      en: "The privacy page says exactly what is and is not collected, including how page speed is measured with Cloudflare Web Analytics.",
      vi: "Trang quyền riêng tư nói rõ điều gì được thu thập và điều gì không, kể cả cách đo tốc độ tải trang bằng Cloudflare Web Analytics.",
      zh: "隐私页面明确说明收集与不收集的内容，页面加载速度通过 Cloudflare Web Analytics 测量，详见该页。",
      "zh-hant":
        "隱私頁面明確說明收集與不收集的內容，頁面載入速度透過 Cloudflare Web Analytics 測量，詳見該頁。",
    },
    evidence: [
      {
        id: "ev-privacy-route",
        kind: "route",
        href: {
          en: "/en/privacy/",
          vi: "/vi/privacy/",
          zh: "/zh/privacy/",
          "zh-hant": "/zh-hant/privacy/",
        },
        label: {
          en: "Privacy page",
          vi: "Trang Quyền riêng tư",
          zh: "隐私页面",
          "zh-hant": "隱私頁面",
        },
      },
      {
        id: "ev-security-route",
        kind: "route",
        href: {
          en: "/en/security/",
          vi: "/vi/security/",
          zh: "/zh/security/",
          "zh-hant": "/zh-hant/security/",
        },
        label: {
          en: "Security reporting page",
          vi: "Trang báo cáo bảo mật",
          zh: "安全报告页面",
          "zh-hant": "安全報告頁面",
        },
      },
    ],
    boundary: PRIVACY_BOUNDARY,
  },
  {
    id: "products-publication",
    surface: "products",
    state: "not-published",
    summary: {
      en: "The public registry is sparse on purpose: a product is listed only when its evidence is ready to verify.",
      vi: "Danh mục công khai cố ý để thưa: một sản phẩm chỉ được liệt kê khi bằng chứng của nó đã sẵn sàng để kiểm chứng.",
      zh: "公开登记表按设计保持静默：仅当产品的证据可核验时才显示条目。",
      "zh-hant":
        "公開登錄名單按設計保持靜默：僅當產品的證據可核驗時才顯示條目。",
    },
    evidence: [
      {
        id: "ev-products-route",
        kind: "route",
        href: {
          en: "/en/products/",
          vi: "/vi/products/",
          zh: "/zh/products/",
          "zh-hant": "/zh-hant/products/",
        },
        label: {
          en: "Products page",
          vi: "Trang Sản phẩm",
          zh: "产品页面",
          "zh-hant": "產品頁面",
        },
      },
      {
        id: "ev-public-manifest",
        kind: "artifact",
        href: {
          en: "/.well-known/sgps.json",
          vi: "/.well-known/sgps.json",
          zh: "/.well-known/sgps.json",
          "zh-hant": "/.well-known/sgps.json",
        },
        label: {
          en: "Public claims file (JSON)",
          vi: "Tệp tuyên bố công khai (JSON)",
          zh: "公开声明文件（JSON）",
          "zh-hant": "公開聲明檔案（JSON）",
        },
      },
    ],
  },
];

/** Authored EN/VI pairs for the selective bilingual mirror (v3 S+8). */
export interface MirrorPair {
  id: string;
  en: string;
  vi: string;
}

export const MIRROR_PAIRS: readonly MirrorPair[] = [
  {
    id: "security-reporting",
    en: "You can report a vulnerability privately through GitHub security advisories. Only the maintainers can see the report.",
    vi: "Bạn có thể báo cáo lỗ hổng riêng tư qua GitHub security advisories (kênh báo lỗ hổng riêng tư của GitHub). Chỉ người bảo trì đọc được báo cáo.",
  },
  {
    id: "security-limits",
    en: "Reporting does not create a bug-bounty program, a promised response time or a right to public disclosure.",
    vi: "Gửi báo cáo không đồng nghĩa với chương trình thưởng lỗ hổng, cam kết thời gian phản hồi hay quyền công bố công khai.",
  },
];
