import type { Language } from "@/data/site";
import type { ProductEntry } from "@/lib/products";
import { productCopy } from "@/lib/product-copy";

/**
 * v8 W3: visible copy of a product profile page, from the v8 copy deck
 * (sro-*, stm-*). zh and zh-hant lines are deck suggestions and stay NOT
 * VERIFIED for native review.
 *
 * v12 S2: the Sổ Trọ lead is the customer outcome, built only from the
 * record's jobs and capabilities; the list below gives the detail and the
 * screens the proof. Preview 2026-10-15: every line is backed by shipped code
 * and tests in Sotro (vendored profile `_rationale.capabilities`); tiered
 * electricity billing, automatic sending and bank matching are not claimed.
 *
 * The record fields (`shortDescription`, `jobs`, `capabilities`) are canonical
 * claim/proof bindings; `jobs`/`capabilities` are mirrored against the vendored
 * upstream profile, so the five "What it does" lines live here for every
 * language instead of in the record.
 */
type ProductData = ProductEntry["data"];

const DECK: Record<
  string,
  Record<Language, { oneLiner: string; whatItDoes: string[] }>
> = {
  sotro: {
    en: {
      oneLiner:
        "Record rent for each room or home, count each payment once, send a receipt on Zalo. Made for landlords in Vietnam.",
      whatItDoes: [
        "See at a glance who still owes this month and what needs doing today",
        "Review, then confirm: each payment is recorded once",
        "A QR code for bank transfer, and a receipt image to copy into Zalo",
        "Large text and big buttons; a family helper joins by scanning a QR code",
        "Meter readings, monthly charges and a C06 residence export",
      ],
    },
    vi: {
      oneLiner:
        "Ghi tiền thu từng phòng, từng căn, mỗi khoản chỉ ghi một lần, có biên nhận gửi qua Zalo. Làm cho người có nhà cho thuê ở Việt Nam.",
      whatItDoes: [
        "Nhìn một lần là biết tháng này phòng trọ, căn hộ nào còn nợ và hôm nay cần làm gì",
        "Xem lại rồi mới xác nhận: mỗi khoản thu chỉ ghi một lần",
        "Mã QR chuyển khoản ngân hàng, và ảnh biên nhận sao chép gửi qua Zalo",
        "Chữ to, nút lớn cho chủ nhà lớn tuổi; người nhà tham gia chỉ bằng cách quét mã QR",
        "Chỉ số điện nước, khoản thu hằng tháng của nhà trọ hay căn hộ, và bảng C06 tạm trú",
      ],
    },
    zh: {
      oneLiner:
        "逐间、逐套记下租金，每笔只记一次，收据可发到 Zalo。为越南房东打造。",
      whatItDoes: [
        "本月谁还欠租、今天要做什么",
        "先核对再确认：每笔收款只记一次",
        "转账二维码，收据可复制到 Zalo",
        "大字大按钮；家人扫码即可加入",
        "水电读数、每月费用和 C06 暂住表",
      ],
    },
    "zh-hant": {
      oneLiner:
        "逐間、逐戶記下房租，每筆只記一次，收據可傳到 Zalo。為越南房東打造。",
      whatItDoes: [
        "本月誰還欠租、今天要做什麼",
        "先核對再確認：每筆收款只記一次",
        "轉帳 QR 碼，收據可複製到 Zalo",
        "大字大按鈕；家人掃碼即可加入",
        "水電度數、每月費用和 C06 暫住表",
      ],
    },
  },
  sotam: {
    en: {
      oneLiner: "A private, local-first journal for reflections and memories.",
      whatItDoes: [
        "Write private reflections at your own pace",
        "Reread your entries and memories",
        "Your writing stays on your own device first, in a private Personal Vault",
        "Export your reflections to your device whenever you choose",
        "Vault storage that states plainly what can and cannot be recovered",
      ],
    },
    vi: {
      oneLiner:
        "Cuốn nhật ký riêng tư, ưu tiên lưu trên máy, để viết suy nghĩ và giữ kỷ niệm.",
      whatItDoes: [
        "Viết suy nghĩ riêng tư theo nhịp của bạn",
        "Đọc lại nhật ký và kỷ niệm",
        "Nhật ký của bạn lưu trên máy trước tiên, trong kho cá nhân riêng tư",
        "Tự xuất bài viết ra máy khi bạn muốn",
        "Lưu trong kho cá nhân riêng tư, nói rõ điều gì khôi phục được và điều gì không",
      ],
    },
    zh: {
      oneLiner: "私密、本地优先的日记，用来写下所思所想、留住回忆。",
      whatItDoes: [
        "按自己的节奏写下私密想法",
        "重读自己的日记与回忆",
        "在私有的个人保险库中本地优先写作",
        "在你需要时把日记导出到你的设备",
        "私有个人保险库存储，恢复范围有明确界定",
      ],
    },
    "zh-hant": {
      oneLiner: "私密、本機優先的日記，用來寫下所思所想、留住回憶。",
      whatItDoes: [
        "按自己的節奏寫下私密想法",
        "重讀自己的日記與回憶",
        "在私有的個人保險庫中以本機優先的方式寫作",
        "在你需要時把日記匯出到你的裝置",
        "私有個人保險庫儲存，復原範圍有明確界定",
      ],
    },
  },
};

/** At most five plain statements, so the page never turns back into a data sheet. */
export const WHAT_IT_DOES_MAX = 5;

export function productPageCopy(data: ProductData, lang: Language) {
  const deck = DECK[data.slug]?.[lang];
  const copy = productCopy(data, lang);
  return {
    oneLiner: deck?.oneLiner ?? copy.shortDescription,
    whatItDoes: (
      deck?.whatItDoes ?? [...copy.jobs, ...copy.capabilities]
    ).slice(0, WHAT_IT_DOES_MAX),
  };
}

type Strings = Record<Language, string>;
const S = (en: string, vi: string, zh: string, zhHant: string): Strings => ({
  en,
  vi,
  zh,
  "zh-hant": zhHant,
});

export const PAGE_LABELS = {
  // sro-2
  seeScreens: S(
    "See the screens",
    "Xem các màn hình",
    "查看界面截图",
    "查看畫面截圖",
  ),
  // Owner 2026-10-24 (O-04): label of the app-language fact row.
  appLanguage: S(
    "App language",
    "Ngôn ngữ ứng dụng",
    "应用语言",
    "應用程式語言",
  ),
  // sro-8 / stm-8 heading
  whatItDoes: S("What it does", "Tính năng", "功能", "功能"),
  // sro-14
  artCaption: S(
    "Brand artwork, not an app screenshot.",
    "Hình ảnh thương hiệu, không phải ảnh chụp ứng dụng.",
    "品牌插图，并非应用截图。",
    "品牌視覺素材，並非應用程式截圖。",
  ),
  // Localized identity-artwork alt suffix (a11y: the record's media.alt is
  // English-only; callers compose `${productName} — ${artIdentity[lang]}`).
  artIdentity: S(
    "brand identity artwork",
    "hình ảnh nhận diện thương hiệu",
    "品牌标识图",
    "品牌標識圖",
  ),
  // sro-15 / stm-9
  privacy: S(
    "Website privacy",
    "Quyền riêng tư website",
    "网站隐私",
    "網站隱私權",
  ),
  privacyScope: S(
    "This notice covers blueskyzlabs.com only, not the product.",
    "Thông báo này chỉ áp dụng cho website blueskyzlabs.com, không áp dụng cho sản phẩm.",
    "此说明仅适用于网站 blueskyzlabs.com，不适用于该产品。",
    "此說明僅適用於網站 blueskyzlabs.com，不適用於該產品。",
  ),
  security: S("Security", "Bảo mật", "安全", "資訊安全"),
  support: S("Support", "Hỗ trợ", "帮助与支持", "協助與支援"),
} as const;

/** Availability line (sro-5 / stm-4 and the platform "Web" of sro-7). */
export const AVAILABILITY = {
  label: S("Availability", "Tình trạng", "可用情况", "可用情況"),
  web: S("Web", "Web", "网页", "網頁"),
  inDevelopment: S("in development", "đang phát triển", "开发中", "開發中"),
  // Preview 2026-10-15: the web app accepts new workspaces in limited numbers.
  preview: S(
    "open preview, limited places",
    "bản xem trước đã mở, số chỗ có hạn",
    "预览版已开放，名额有限",
    "預覽版已開放，名額有限",
  ),
  // Public availability (Owner 2026-11-23): the web app is open to everyone.
  open: S(
    "open to everyone",
    "đã mở cho mọi người",
    "已开放使用",
    "已開放使用",
  ),
  native: S(
    "Android and iOS",
    "Android và iOS",
    "Android 与 iOS",
    "Android 與 iOS",
  ),
  noStore: S(
    "no store release",
    "chưa có bản trên cửa hàng ứng dụng",
    "尚未上架应用商店",
    "尚未上架應用程式商店",
  ),
  colon: S(": ", ": ", "：", "："),
  sep: S(", ", ", ", "，", "，"),
} as const;

/**
 * The web app of this record is open to new users as a preview: an early
 * lifecycle (`beta`, or later) that is listed as `preview` or `public`.
 */
export function webPreviewOpen(data: ProductData): boolean {
  return (
    data.platforms.includes("web") &&
    ["beta", "active", "maintenance"].includes(data.lifecycle) &&
    ["preview", "public"].includes(data.availability)
  );
}

/** Web availability wording: `open` when public, `preview` while limited. */
export function webStateLabel(data: ProductData, lang: Language): string {
  return data.availability === "public"
    ? AVAILABILITY.open[lang]
    : AVAILABILITY.preview[lang];
}

/**
 * G6 / ACQ-03 / ACQ-11 (Owner 2026-10-20): the contact sentence that closes
 * the single Availability line while no native app is available. It is the
 * existing "Questions? Get in touch." clause of the preview note, split so the
 * link text is the last clause. No waitlist, date or promise. `join` is the
 * space (none in Chinese) between the line's full stop and the question.
 */
export const CONTACT_NOTE = {
  en: { join: " ", before: "Questions? ", link: "Get in touch", after: "." },
  vi: {
    join: " ",
    before: "Cần hỏi thêm? ",
    link: "Liên hệ với chúng tôi",
    after: ".",
  },
  zh: { join: "", before: "有疑问？", link: "与我们联系", after: "。" },
  "zh-hant": {
    join: "",
    before: "有疑問？",
    link: "與我們聯絡",
    after: "。",
  },
} as const;

/**
 * While no native app of the record is available (every declared Android/iOS
 * app is still in development) the profile offers the contact action, as a
 * secondary button beside the primary action. A store-listed app replaces it.
 */
export function showsContactAction(appAccess: ProductData["appAccess"]) {
  const apps = [appAccess?.android, appAccess?.ios].filter(
    (app): app is NonNullable<typeof app> => Boolean(app),
  );
  return (
    apps.length > 0 &&
    !apps.some((app) => app.state === "available" && app.storeUrl)
  );
}
