/**
 * v8 W5a: visitor copy for /security/ and /privacy/ in the four locales.
 * Strings follow docs/superpowers/plans/v8/copy-deck.md rows sec-1..6 and
 * pri-1..5. zh and zh-hant lines are deck suggestions pending native review.
 * Claim and boundary text stays in claims.ts and integrity.ts; this module
 * adds no new fact.
 */
import type { Language } from "@/data/site";

type PerLang<T> = Record<Language, T>;

export interface SourceRef {
  /** Evidence id from the claim's evidenceIds. */
  id: string;
  label: string;
}

export interface SecurityCopy {
  title: string;
  lede: string;
  cta: string;
  note: string;
  offerLead: string;
  offerBody: string;
  whyLabel: string;
  whyBody: string;
  limitLabel: string;
  limitBody: string;
  sourcesLabel: string;
  sources: SourceRef[];
  reviewed: string;
  emailLabel: string;
}

export const SECURITY_COPY: PerLang<SecurityCopy> = {
  en: {
    title: "Security",
    lede: "Report security problems privately through GitHub. Do not open a public issue.",
    cta: "Report a vulnerability",
    note: "Only maintainers can see reports.",
    offerLead: "What we do not offer:",
    offerBody:
      "a bug bounty, a response-time commitment or a right to public disclosure. We show no certification badge unless the evidence behind it has been verified.",
    whyLabel: "Why private:",
    whyBody:
      "A public issue shows everyone the defect, and who reported it, before anyone has had a chance to look at it.",
    limitLabel: "Limit:",
    limitBody:
      "This site does not collect reports itself. Every report goes to GitHub.",
    sourcesLabel: "Sources:",
    sources: [
      {
        id: "ev-security-advisory",
        label: "GitHub private vulnerability reporting",
      },
      { id: "ev-security-route", label: "Security page" },
    ],
    reviewed: "Reviewed",
    emailLabel: "Email",
  },
  vi: {
    title: "Bảo mật",
    lede: "Hãy báo cáo vấn đề bảo mật một cách riêng tư qua GitHub, đừng mở issue công khai (mục báo lỗi công khai trên GitHub).",
    cta: "Báo cáo lỗ hổng",
    note: "Chỉ người bảo trì (người quản lý kho mã nguồn trên GitHub) xem được.",
    offerLead: "Chúng tôi không cung cấp:",
    offerBody:
      "chương trình thưởng lỗ hổng, cam kết thời gian phản hồi hay quyền công bố công khai. Chúng tôi không gắn huy hiệu chứng nhận nào khi chưa có bằng chứng đã được kiểm chứng.",
    whyLabel: "Vì sao riêng tư:",
    whyBody:
      "Một issue công khai sẽ để lộ cả lỗ hổng lẫn người báo trước khi có ai kịp xem xét.",
    limitLabel: "Giới hạn:",
    limitBody:
      "Trang web này không tự nhận báo cáo. Mọi báo cáo đều gửi qua GitHub.",
    sourcesLabel: "Nguồn:",
    sources: [
      {
        id: "ev-security-advisory",
        label: "Báo cáo lỗ hổng riêng tư của GitHub",
      },
      { id: "ev-security-route", label: "Trang Bảo mật" },
    ],
    reviewed: "Đã xem xét",
    emailLabel: "Email",
  },
  zh: {
    title: "安全",
    lede: "请通过 GitHub 私下报告安全问题，不要提交公开 issue。",
    cta: "报告漏洞",
    note: "仅维护者可见。",
    offerLead: "我们不提供：",
    offerBody:
      "漏洞赏金、响应时限承诺或公开披露权。没有经核实的证据，我们不发布任何认证标识。",
    whyLabel: "为什么私下：",
    whyBody: "公开 issue 会在任何人查看之前就公布报告者和缺陷。",
    limitLabel: "限制：",
    limitBody: "本站没有自己的接收服务。报告提交到 GitHub，而不是本站。",
    sourcesLabel: "来源：",
    sources: [
      { id: "ev-security-advisory", label: "GitHub 私密漏洞报告" },
      { id: "ev-security-route", label: "安全页面" },
    ],
    reviewed: "审阅于",
    emailLabel: "Email",
  },
  "zh-hant": {
    title: "資訊安全",
    lede: "請透過 GitHub 私下通報資安問題，不要提交公開 issue。",
    cta: "通報漏洞",
    note: "僅維護者可見。",
    offerLead: "我們不提供：",
    offerBody:
      "漏洞賞金、回應時限承諾或公開揭露權。沒有經查證的證據，我們不發布任何認證標章。",
    whyLabel: "為什麼私下：",
    whyBody: "公開 issue 會在任何人檢視之前就公布通報者和缺陷。",
    limitLabel: "限制：",
    limitBody: "本站沒有自己的接收服務。通報提交到 GitHub，而不是本站。",
    sourcesLabel: "來源：",
    sources: [
      { id: "ev-security-advisory", label: "GitHub 私密漏洞通報" },
      { id: "ev-security-route", label: "資訊安全頁面" },
    ],
    reviewed: "審閱於",
    emailLabel: "Email",
  },
};

export interface PrivacyCopy {
  title: string;
  lede: string;
  collectedLead: string;
  collectedBody: string;
  limitsLead: string;
  limitsBody: string;
  deletion: string;
  contactLead: string;
  contactLink: string;
  sourcesLabel: string;
  sources: SourceRef[];
}

export const PRIVACY_COPY: PerLang<PrivacyCopy> = {
  en: {
    title: "Privacy",
    lede: "This site sets no cookies. It stores only the language and theme you choose, in your browser, with no tracking or profiling.",
    collectedLead: "What is collected.",
    collectedBody:
      "No accounts or forms. Server and CDN logs may record technical data such as your IP address, browser type and the page requested, for security, abuse prevention and reliable delivery, never advertising. Cloudflare Web Analytics measures page speed without cookies or storage, sending only load timings, page address, browser version, memory figures and a per-load random ID. Cloudflare keeps raw data 7 days, then about a 10% sample. No ad pixels or session recording.",
    limitsLead: "Limits.",
    limitsBody:
      "This does not mean no data is processed. Any website needs infrastructure that handles network data such as IP addresses and request headers.",
    deletion:
      "This site has no account to export or delete. This notice covers blueskyzlabs.com only; each public product has its own privacy notice.",
    contactLead: "Questions about this notice?",
    contactLink: "Contact BlueSkyz Labs",
    sourcesLabel: "Sources:",
    sources: [
      { id: "ev-privacy-route", label: "Privacy page" },
      { id: "ev-security-route", label: "Security page" },
    ],
  },
  vi: {
    title: "Quyền riêng tư",
    lede: "Trang web này không đặt cookie. Chỉ lưu ngôn ngữ và giao diện bạn chọn, trong trình duyệt của bạn; không theo dõi, không lập hồ sơ.",
    collectedLead: "Thu thập gì.",
    collectedBody:
      "Không có tài khoản hay biểu mẫu. Nhật ký máy chủ và CDN có thể ghi dữ liệu kỹ thuật như địa chỉ IP, loại trình duyệt và trang được yêu cầu, để bảo mật, chống lạm dụng và phân phối ổn định, không cho quảng cáo. Cloudflare Web Analytics đo tốc độ tải trang, không dùng cookie hay bộ nhớ, chỉ gửi thời gian tải, địa chỉ trang, phiên bản trình duyệt, bộ nhớ và mã ngẫu nhiên mỗi lượt tải. Cloudflare giữ dữ liệu gốc 7 ngày, sau đó giữ mẫu khoảng 10%. Không pixel quảng cáo, không ghi phiên.",
    limitsLead: "Giới hạn.",
    limitsBody:
      "Điều này không có nghĩa là không có dữ liệu nào được xử lý. Mọi trang web đều cần hạ tầng xử lý dữ liệu mạng như địa chỉ IP và header yêu cầu (thông tin kỹ thuật trình duyệt tự gửi kèm).",
    deletion:
      "Trang web này không có tài khoản để xuất hoặc xoá. Thông báo này chỉ áp dụng cho blueskyzlabs.com; mỗi sản phẩm công khai có thông báo quyền riêng tư riêng.",
    contactLead: "Có câu hỏi về thông báo này?",
    contactLink: "Liên hệ BlueSkyz Labs",
    sourcesLabel: "Nguồn:",
    sources: [
      { id: "ev-privacy-route", label: "Trang Quyền riêng tư" },
      { id: "ev-security-route", label: "Trang Bảo mật" },
    ],
  },
  zh: {
    title: "隐私",
    lede: "本站不设置 Cookie，只在你的浏览器中保存你选择的语言和主题，不跟踪、不做用户画像。",
    collectedLead: "收集什么。",
    collectedBody:
      "没有账号或表单。服务器和 CDN 日志可能记录技术数据，如 IP 地址、浏览器类型和所访问的页面，用于安全、防滥用和稳定交付，而非广告。页面加载速度通过 Cloudflare Web Analytics 测量：不使用 Cookie 或浏览器本地存储。每次浏览页面时会发送加载耗时、页面地址、浏览器名称和版本、浏览器内存数据，以及仅用于该次页面加载的随机 ID（不会在页面之间关联）；Cloudflare 保留原始数据 7 天，之后仅保留约 10% 的样本。本站不使用广告像素或会话录制。",
    limitsLead: "限制。",
    limitsBody:
      "这不代表完全不处理任何数据。任何网站都需要基础设施处理 IP 地址、请求标头等网络数据。",
    deletion:
      "本站没有可导出或删除的账号。本通知仅适用于 blueskyzlabs.com；每款公开产品均有自己的隐私通知。",
    contactLead: "如对本通知有疑问，请",
    contactLink: "联系 BlueSkyz Labs",
    sourcesLabel: "来源：",
    sources: [
      { id: "ev-privacy-route", label: "隐私页面" },
      { id: "ev-security-route", label: "安全页面" },
    ],
  },
  "zh-hant": {
    title: "隱私權",
    lede: "本站不設定 Cookie，只在你的瀏覽器中儲存你選擇的語言與主題，不追蹤、不剖析。",
    collectedLead: "蒐集什麼。",
    collectedBody:
      "沒有帳號或表單。伺服器與 CDN 記錄檔可能記錄技術資料，如 IP 位址、瀏覽器類型和所瀏覽的頁面，用於安全、防濫用和穩定傳送，而非廣告。頁面載入速度透過 Cloudflare Web Analytics 量測：不使用 Cookie 或瀏覽器本機儲存空間。每次瀏覽頁面時會傳送載入耗時、頁面網址、瀏覽器名稱與版本、瀏覽器記憶體資料，以及僅用於該次頁面載入的隨機 ID（不會在頁面之間關聯）；Cloudflare 保留原始資料 7 天，之後僅保留約 10% 的樣本。本站不使用廣告像素或工作階段側錄。",
    limitsLead: "限制。",
    limitsBody:
      "這不代表完全不處理任何資料。任何網站都需要基礎設施處理 IP 位址、請求標頭等網路資料。",
    deletion:
      "本站沒有可匯出或刪除的帳號。本通知僅適用於 blueskyzlabs.com；每項公開產品均有自己的隱私權通知。",
    contactLead: "如對本通知有疑問，請",
    contactLink: "聯絡 BlueSkyz Labs",
    sourcesLabel: "來源：",
    sources: [
      { id: "ev-privacy-route", label: "隱私權頁面" },
      { id: "ev-security-route", label: "資訊安全頁面" },
    ],
  },
};
