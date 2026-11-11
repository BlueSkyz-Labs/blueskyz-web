import type { Language } from "@/data/site";

/**
 * v8 W2 home copy, verbatim from docs/superpowers/plans/v8/copy-deck.md
 * (rows hom-2, hom-6, hom-8, hom-9, hom-14). Home-only strings: the product
 * registry (`src/content/products/*.yaml`) stays the truth for claim binding
 * and profile pages. zh and zh-hant are deck suggestions, NOT VERIFIED by a
 * native reviewer.
 */
type Localized = Record<Language, string>;

/**
 * hom-2: product line under the H1, as segments around the two product names.
 * Preview 2026-10-15: Sổ Trọ (first name) is in preview, Sổ Tâm in development.
 */
export const HOME_PRODUCT_LINE: Record<
  Language,
  { lead: string; a: string; b: string }
> = {
  en: {
    lead: "Now in preview: ",
    a: ", a landlord's notebook for their rooms. In development: ",
    b: ", a private journal.",
  },
  vi: {
    lead: "Đang mở bản xem trước: ",
    a: ", sổ tay giúp chủ trọ quản lý phòng. Đang phát triển: ",
    b: ", cuốn nhật ký của riêng bạn.",
  },
  zh: {
    lead: "预览中：",
    a: "，帮房东管理出租房间的记事本。开发中：",
    b: "，只属于你的私密日记。",
  },
  "zh-hant": {
    lead: "預覽中：",
    a: "，幫房東管理出租房間的記事本。開發中：",
    b: "，只屬於你的私密日記。",
  },
};

/**
 * Home one-liners under the flagship name (hero) and in the product house.
 * v12 S2 (customer-led): the Sổ Trọ line now answers the landlord's own
 * question (which rooms have not paid, what needs doing today), reframing the
 * registry's first job (`jobs[0]` in `src/content/products/sotro.yaml`) and
 * the "rooms not yet paid" state the real home capture shows. It adds no
 * capability. Sổ Tâm keeps the registry copy except in English, where
 * "local-first" is said in plain words. zh and zh-hant are NOT VERIFIED
 * (native review pending).
 */
export const HOME_ONE_LINER: Record<
  string,
  Partial<Record<Language, string>> | undefined
> = {
  sotro: {
    en: "For landlords in Vietnam: see what is still unpaid this month and what needs doing today.",
    vi: "Dành cho chủ trọ ở Việt Nam: xem tháng này còn ai chưa đóng tiền và hôm nay cần lo việc gì.",
    zh: "给越南房东：查看本月还有谁没交租、今天要处理什么。",
    "zh-hant": "給越南房東：查看本月還有誰沒繳租、今天要處理什麼。",
  },
  sotam: {
    en: "A private journal, kept on your own device first.",
  },
};

/**
 * v12 S2: one outcome line that opens the home flagship act, before the two
 * proof points. It restates the registry's second job (`jobs[1]`: dependable
 * room, tenant, meter and monthly charge records) as what the landlord gets.
 * zh and zh-hant are NOT VERIFIED (native review pending).
 */
export const HOME_FLAGSHIP_LEAD: Record<string, Localized | undefined> = {
  sotro: {
    en: "Rooms, tenants, meter readings and monthly charges in one place. No paper notebook, no spreadsheet.",
    vi: "Phòng, người thuê, số điện nước và tiền từng tháng, gom về một chỗ. Không cần sổ giấy, không cần bảng tính.",
    zh: "房间、租客、水电表读数和每月费用，集中在一处。不用纸本，也不用表格。",
    "zh-hant":
      "房間、房客、水電表度數和每月費用，集中在一處。不用紙本，也不用試算表。",
  },
};

/**
 * The two home proof points for Sổ Trọ, from the registry capabilities.
 * Copy polish 2026-11-11: the old first point ("electricity bills ... with
 * each tier shown") is gone, because the Sotro public profile lists tiered
 * electricity billing as deliberately NOT claimed (invoices use the flat
 * rate). It is replaced by capability 1 (large text, family helper by QR).
 */
export const HOME_PROOF_POINTS: Localized[] = [
  {
    en: "Large text and buttons; family joins by scanning a QR code",
    vi: "Chữ to, nút lớn; người nhà tham gia bằng cách quét mã QR",
    zh: "大字号与大按钮；家人的手机扫描二维码即可加入",
    "zh-hant": "大字級與大按鈕；家人的手機掃描 QR 碼即可加入",
  },
  {
    en: "Confirm each payment received, then copy the receipt to Zalo",
    vi: "Xác nhận từng khoản đã nhận, rồi sao chép biên nhận gửi qua Zalo",
    zh: "确认每笔已收款项，然后把收据复制到 Zalo",
    "zh-hant": "確認每筆已收款項，然後把收據複製到 Zalo",
  },
];
