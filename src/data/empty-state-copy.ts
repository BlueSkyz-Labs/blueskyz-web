import type { LocalizedLabel } from "@/data/site";

/**
 * Experience v6 S8 — short composition labels for the honest empty states
 * (Contact, About, profiles without captures). These are labels only: no
 * capability, contact, founder or availability claim lives here. Every entry
 * not already present in `SHARED_LABELS`/authored copy is a short derived
 * translation flagged for native review in the slice PR.
 */
export const EMPTY_STATE_COPY = {
  contactLede: {
    en: "Want to work with us, ask about one of our apps, or something else? Choose the contact below that fits.",
    vi: "Bạn muốn hợp tác, hỏi về ứng dụng hay cần việc khác? Hãy chọn kênh liên hệ phù hợp bên dưới.",
    zh: "想与我们合作、询问应用或其他事情？请在下方选择合适的联系方式。",
    "zh-hant":
      "想與我們合作、詢問應用程式或其他事情？請在下方選擇合適的聯絡方式。",
  },
  notPublished: {
    en: "Not listed",
    vi: "Không có trong danh sách",
    zh: "未列出",
    "zh-hant": "未列出",
  },
  businessPending: {
    en: "No business mailbox is listed.",
    vi: "Không có hộp thư doanh nghiệp nào được liệt kê.",
    zh: "未列出商务邮箱。",
    "zh-hant": "未列出商務電子信箱。",
  },
  aboutCheck: {
    en: "What you can check",
    vi: "Bạn có thể tự kiểm chứng",
    zh: "你可以自行核实",
    "zh-hant": "你可以自行查證",
  },
  aboutCheckNoCookies: {
    en: "This site sets no cookies.",
    vi: "Trang web này không đặt cookie.",
    zh: "本站不设置 Cookie。",
    "zh-hant": "本站不設定 Cookie。",
  },
  aboutCheckSecurity: {
    en: "Security reports go through a private GitHub channel.",
    vi: "Báo cáo bảo mật được gửi qua kênh GitHub riêng tư.",
    zh: "安全报告通过 GitHub 私有渠道提交。",
    "zh-hant": "資安通報透過 GitHub 私有管道提交。",
  },
  aboutCheckCta: {
    en: "Check what we say",
    vi: "Xem các tuyên bố và nguồn",
    zh: "查看我们的声明与来源",
    "zh-hant": "查看我們的聲明與依據",
  },
  aboutContactCta: {
    en: "Contact us",
    vi: "Liên hệ với chúng tôi",
    zh: "与我们联系",
    "zh-hant": "與我們聯絡",
  },
  aboutWhatWeMake: {
    en: "What we are building",
    vi: "Những gì chúng tôi đang làm",
    zh: "我们正在打造",
    "zh-hant": "我們正在打造",
  },
  noCaptures: {
    en: "No app screenshots are published yet.",
    vi: "Chưa có ảnh chụp giao diện ứng dụng nào được công bố.",
    zh: "尚未公布任何应用截图。",
    "zh-hant": "尚未公布任何應用程式截圖。",
  },
  ladderCurrent: {
    en: "Current stage",
    vi: "Giai đoạn hiện tại",
    zh: "当前阶段",
    "zh-hant": "目前階段",
  },
} as const satisfies Record<string, LocalizedLabel>;
