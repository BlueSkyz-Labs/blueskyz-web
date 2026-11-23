import type { Language } from "../lib/i18n.ts";
import { SITE } from "./site.ts";

// Support descriptions follow the published support mailbox, like the page.
const hasSupportEmail = Boolean(SITE.supportEmail);

/**
 * Search/social metadata for the pages whose copy is owned here (Copy/SEO
 * Phase 2). Titles are descriptors only: `BaseLayout` appends
 * ` | BlueSkyz Labs` (single separator, brand last) unless the descriptor
 * already names the brand (home). Every sentence restates what the page or the
 * product registry already says; nothing here is a new product fact, and
 * every product description states that product's current stage ("in
 * development", or "in preview" once its web app is open) so a description
 * never implies more availability than the registry records.
 */
export interface PageMeta {
  title: string;
  description: string;
}

export type StaticPageKey =
  | "home"
  | "about"
  | "contact"
  | "privacy"
  | "support"
  | "products"
  | "verify"
  | "decisionRoom"
  | "editions"
  | "dossier"
  | "dossierPrint";

export const PAGE_META: Record<Language, Record<StaticPageKey, PageMeta>> = {
  vi: {
    home: {
      title: "BlueSkyz Labs | YENLUME đã mở, Sổ Tâm đang phát triển",
      description:
        "YENLUME, sổ thu tiền cho người có nhà cho thuê ở Việt Nam, đã mở cho mọi người. Sổ Tâm, nhật ký riêng tư lưu trên máy, đang phát triển.",
    },
    about: {
      title: "Về BlueSkyz",
      description:
        "BlueSkyz Labs đang làm YENLUME và Sổ Tâm. Tìm hiểu cách chúng tôi làm việc và tự kiểm chứng từng điều chúng tôi nói qua nguồn công khai.",
    },
    contact: {
      title: "Liên hệ: hợp tác và câu hỏi chung",
      description:
        "Liên hệ BlueSkyz Labs về hợp tác và câu hỏi chung qua email được công bố trên trang. Báo cáo lỗ hổng bảo mật qua kênh riêng tư trên GitHub.",
    },
    privacy: {
      title: "Quyền riêng tư: không dùng cookie",
      description:
        "Trang web này không đặt cookie và chỉ lưu ngôn ngữ, giao diện do bạn chọn trong trình duyệt. Xem chúng tôi thu thập gì và không thu thập gì.",
    },
    support: {
      title: "Hỗ trợ: cách được trợ giúp",
      description: hasSupportEmail
        ? "Cách nhận trợ giúp cho YENLUME và Sổ Tâm: gửi email đến hộp thư hỗ trợ. Kênh báo cáo bảo mật riêng tư chỉ dành cho lỗ hổng bảo mật."
        : "Cách nhận trợ giúp cho YENLUME và Sổ Tâm. Hiện chưa có hộp thư hỗ trợ chung; kênh báo cáo bảo mật riêng tư chỉ dành cho lỗ hổng bảo mật.",
    },
    products: {
      title: "Sản phẩm: YENLUME và Sổ Tâm",
      description:
        "YENLUME và Sổ Tâm giúp bạn việc gì: sổ thu tiền cho người có nhà cho thuê, đã mở cho mọi người, và nhật ký riêng tư lưu trên máy, đang phát triển.",
    },
    verify: {
      title: "Kiểm chứng: tự đối chiếu điều chúng tôi nói",
      description:
        "Tự kiểm chứng những gì BlueSkyz Labs công bố: từng tuyên bố công khai, bằng chứng và nguồn đằng sau, cùng các cách để bạn tự kiểm tra.",
    },
    decisionRoom: {
      title: "So sánh tuyên bố",
      description:
        "So sánh tối đa 4 tuyên bố công khai của BlueSkyz Labs cạnh nhau, kèm bằng chứng và nguồn của từng tuyên bố. Trang chỉ đặt cạnh nhau, không kết luận.",
    },
    editions: {
      title: "Tuyển tập",
      description:
        "Tuyển tập gom các tuyên bố BlueSkyz Labs đã đăng trên trang web này, mỗi tuyên bố đều dẫn tới nguồn để bạn tự kiểm chứng.",
    },
    dossier: {
      title: "Bản tóm tắt để in",
      description:
        "Chọn các tuyên bố đã công bố của BlueSkyz Labs cùng nguồn, rồi in hoặc trình bày thành một bản tóm tắt. Những gì bạn chọn không được gửi đi hay lưu lại.",
    },
    dossierPrint: {
      title: "Bản tóm tắt để in: trang in",
      description:
        "Bản in những gì BlueSkyz Labs đã công bố trên trang web này, ghi đầy đủ mọi liên kết nguồn và mọi ranh giới để bạn tự đối chiếu.",
    },
  },
  en: {
    home: {
      title: "BlueSkyz Labs | YENLUME is open, Sổ Tâm in development",
      description:
        "YENLUME, a rent ledger for landlords in Vietnam, is open to everyone. Sổ Tâm, a private journal kept on your phone, is in development.",
    },
    about: {
      title: "About us",
      description:
        "BlueSkyz Labs builds software products. See what we are building now and the public evidence behind what we say, so you can check it yourself.",
    },
    contact: {
      title: "Contact: business and general inquiries",
      description:
        "Contact BlueSkyz Labs about business and general questions. Report security vulnerabilities through the private GitHub channel.",
    },
    privacy: {
      title: "Privacy: no cookies, only language and theme",
      description:
        "This site sets no cookies and stores only the language and theme you choose, in your browser. See what we collect and what we do not.",
    },
    support: {
      title: "Support: how to get help",
      description: hasSupportEmail
        ? "How to get help with YENLUME and Sổ Tâm: email our support mailbox. Private security reporting is for vulnerabilities only."
        : "How to get help with YENLUME and Sổ Tâm. No general support mailbox has been published yet; private security reporting is for vulnerabilities only.",
    },
    products: {
      title: "Products: YENLUME and Sổ Tâm",
      description:
        "What YENLUME and Sổ Tâm do for you: a rent ledger for landlords in Vietnam, open to everyone, and a private journal kept on your phone, in development.",
    },
    verify: {
      title: "Verify our claims: trust routes and evidence",
      description:
        "Check what BlueSkyz Labs says for yourself: each public claim, the evidence and sources behind it, and the routes to verify it on your own.",
    },
    decisionRoom: {
      title: "Compare claims",
      description:
        "Compare up to four public BlueSkyz Labs claims side by side, with the evidence and source for each. The page lines them up; it gives no verdicts.",
    },
    editions: {
      title: "Collections",
      description:
        "Collections gather statements BlueSkyz Labs has already published on this site, each one linked to its sources so you can check it yourself.",
    },
    dossier: {
      title: "Printable summary",
      description:
        "Pick published BlueSkyz Labs claims and their sources, then print or present them as one summary. Nothing you select is transmitted or stored.",
    },
    dossierPrint: {
      title: "Printable summary: print view",
      description:
        "A print-ready view of what BlueSkyz Labs has already published on this site, with every source link and every boundary stated in full.",
    },
  },
  // zh: NOT VERIFIED (native review pending).
  zh: {
    home: {
      title: "BlueSkyz Labs | YENLUME 已开放，Sổ Tâm 开发中",
      description:
        "BlueSkyz Labs 的两款产品：给越南房东的收租账本 YENLUME 现已开放给所有人；保存在手机上的私密日记 Sổ Tâm 仍在开发中。",
    },
    about: {
      title: "关于我们",
      description:
        "BlueSkyz Labs 打造软件产品。了解我们目前在做什么，以及我们所说内容背后的公开依据，方便你自行核实。",
    },
    contact: {
      title: "联系我们：商务与一般咨询",
      description:
        "联系 BlueSkyz Labs，咨询商务及一般问题。请通过 GitHub 私密渠道报告安全漏洞。",
    },
    privacy: {
      title: "隐私：不设置 Cookie，仅保存语言与主题",
      description:
        "本站不设置 Cookie，仅在你的浏览器中保存你主动选择的语言与主题。了解我们收集什么、不收集什么。",
    },
    support: {
      title: "帮助与支持：如何获得帮助",
      description: hasSupportEmail
        ? "如何获得 YENLUME 与 Sổ Tâm 的帮助：请发邮件至支持邮箱。安全漏洞请走私密报告通道，而非支持渠道。"
        : "如何获得 YENLUME 与 Sổ Tâm 的帮助：目前尚未公布通用支持邮箱。安全漏洞请走私密报告通道，而非支持渠道。",
    },
    products: {
      title: "产品：YENLUME 已开放，Sổ Tâm 开发中",
      description:
        "看看 YENLUME 与 Sổ Tâm 能为你做什么：给越南房东的收租账本，现已开放使用；以及保存在手机上的私密日记，仍在开发中。",
    },
    verify: {
      title: "核验我们的声明：信任通道与证据",
      description:
        "自行核验 BlueSkyz Labs 的说法：每项公开声明、其背后的证据与来源，以及你可以自己动手核查的途径。",
    },
    decisionRoom: {
      title: "比较声明",
      description:
        "并排比较最多四条 BlueSkyz Labs 公开声明，并查看每条声明的证据与来源。本页只做并列，不下结论。",
    },
    editions: {
      title: "声明合集",
      description:
        "合集汇总了 BlueSkyz Labs 已在本站发布的声明，每条声明都链接到其来源，方便你自行核实。",
    },
    dossier: {
      title: "可打印摘要",
      description:
        "挑选 BlueSkyz Labs 已发布的声明及其来源，打印或展示为一份摘要。你的选择不会被传输或保存。",
    },
    dossierPrint: {
      title: "可打印摘要：打印视图",
      description:
        "BlueSkyz Labs 已在本站发布内容的打印视图，完整列出所有来源链接与边界说明。",
    },
  },
  // zh-hant: NOT VERIFIED (native review pending).
  "zh-hant": {
    home: {
      title: "BlueSkyz Labs | YENLUME 已開放，Sổ Tâm 開發中",
      description:
        "BlueSkyz Labs 的兩款產品：給越南房東的收租帳本 YENLUME 現已開放給所有人；儲存在手機裡的私密日記 Sổ Tâm 仍在開發中。",
    },
    about: {
      title: "關於我們",
      description:
        "BlueSkyz Labs 打造軟體產品。了解我們目前在做什麼，以及我們所說內容背後的公開依據，方便你自行查證。",
    },
    contact: {
      title: "聯絡我們：商務與一般洽詢",
      description:
        "聯絡 BlueSkyz Labs，洽詢商務與一般問題。請透過 GitHub 私密管道通報資安漏洞。",
    },
    privacy: {
      title: "隱私權：不設定 Cookie，只儲存語言與主題",
      description:
        "本站不設定 Cookie，只在你的瀏覽器中儲存你主動選擇的語言與主題。了解我們蒐集什麼、不蒐集什麼。",
    },
    support: {
      title: "協助與支援：如何取得協助",
      description: hasSupportEmail
        ? "如何取得 YENLUME 與 Sổ Tâm 的協助：請來信至支援信箱。資安漏洞請走私密通報管道，而非支援管道。"
        : "如何取得 YENLUME 與 Sổ Tâm 的協助：目前尚未公布通用支援信箱。資安漏洞請走私密通報管道，而非支援管道。",
    },
    products: {
      title: "產品：YENLUME 已開放，Sổ Tâm 開發中",
      description:
        "看看 YENLUME 與 Sổ Tâm 能為你做什麼：給越南房東的收租帳本，現已開放使用；以及儲存在手機裡的私密日記，仍在開發中。",
    },
    verify: {
      title: "核驗我們的聲明：信任通道與證據",
      description:
        "自行核驗 BlueSkyz Labs 的說法：每項公開聲明、其背後的證據與來源，以及你可以自己動手核查的途徑。",
    },
    decisionRoom: {
      title: "比較聲明",
      description:
        "並排比較最多四則 BlueSkyz Labs 公開聲明，並查看每則聲明的證據與來源。本頁只做並列，不下結論。",
    },
    editions: {
      title: "聲明合集",
      description:
        "合集彙整了 BlueSkyz Labs 已在本站發布的聲明，每則聲明都連結到其來源，方便你自行查證。",
    },
    dossier: {
      title: "可列印摘要",
      description:
        "挑選 BlueSkyz Labs 已發布的聲明及其來源，列印或簡報成一份摘要。你的選擇不會被傳輸或儲存。",
    },
    dossierPrint: {
      title: "可列印摘要：列印檢視",
      description:
        "BlueSkyz Labs 已在本站發布內容的列印檢視，完整列出所有來源連結與邊界說明。",
    },
  },
};

/** Product profile pages, keyed by registry slug then locale. */
export const PRODUCT_META: Record<string, Record<Language, PageMeta>> = {
  sotro: {
    vi: {
      title: "YENLUME: sổ thu tiền nhà cho thuê",
      description:
        "YENLUME giúp chủ nhà biết khoản nào chưa thu, thu và xác nhận mỗi khoản đúng một lần, có biên nhận gửi Zalo. Ảnh chụp từ bản thử, dữ liệu mẫu.",
    },
    en: {
      title: "YENLUME: a rent ledger for landlords",
      description:
        "For landlords in Vietnam: see who still owes, collect rent and confirm each payment once, with a receipt ready for Zalo. Screenshots use sample data.",
    },
    zh: {
      title: "YENLUME：房东的收租账本",
      description:
        "YENLUME 是给越南房东的收租账本：一眼看出谁还没交租，收租后每笔款项只需确认一次，收据可直接发到 Zalo。截图使用示例数据。",
    },
    "zh-hant": {
      title: "YENLUME：房東的收租帳本",
      description:
        "YENLUME 是給越南房東的收租帳本：一眼看出誰還沒繳租，收租後每筆款項只需確認一次，收據可直接傳到 Zalo。畫面使用範例資料。",
    },
  },
  sotam: {
    vi: {
      title: "Sổ Tâm – nhật ký riêng tư",
      description:
        "Sổ Tâm là cuốn nhật ký ưu tiên lưu trên máy, để bạn ghi lại suy nghĩ riêng tư và giữ kỷ niệm. Bạn có thể tự xuất bài viết ra máy. Đang phát triển.",
    },
    en: {
      title: "Sổ Tâm: a private, local-first journal",
      description:
        "Sổ Tâm is a local-first journal for writing private reflections and keeping personal memories, with local export you control. In development.",
    },
    zh: {
      title: "Sổ Tâm：本地优先的私密日记",
      description:
        "Sổ Tâm 是本地优先的日记，用来写下私密的所思所想、留住个人回忆，并可自行导出到本地。目前在开发中。",
    },
    "zh-hant": {
      title: "Sổ Tâm：本機優先的私密日記",
      description:
        "Sổ Tâm 是本機優先的日記，用來寫下私密的所思所想、留住個人回憶，並可自行匯出到本機。目前仍在開發中。",
    },
  },
};

/** YENLUME getting-started guide, keyed by registry slug then locale. */
export const GUIDE_META: Record<string, Record<Language, PageMeta>> = {
  sotro: {
    vi: {
      title: "Bắt đầu với YENLUME",
      description:
        "Hướng dẫn từng bước cho YENLUME: tạo nhà cho thuê, ghép điện thoại cho người nhà, ghi điện nước và thu tiền. Các bước có thể thay đổi.",
    },
    en: {
      title: "YENLUME getting-started guide",
      description:
        "Step-by-step guide to YENLUME: set up a building, pair family phones, record meter readings and collect rent. Steps may change.",
    },
    zh: {
      title: "YENLUME 入门指南",
      description:
        "YENLUME 分步指南：创建楼栋、为家人配对手机、记录水电表读数并收租。步骤可能调整。",
    },
    "zh-hant": {
      title: "YENLUME 入門指南",
      description:
        "YENLUME 的逐步指南：建立樓棟、為家人配對手機、記錄水電表度數並收租。步驟可能調整。",
    },
  },
};

export function productMeta(
  slug: string,
  lang: Language,
  fallback: PageMeta,
): PageMeta {
  return PRODUCT_META[slug]?.[lang] ?? fallback;
}

export function guideMeta(
  slug: string,
  lang: Language,
  fallback: PageMeta,
): PageMeta {
  return GUIDE_META[slug]?.[lang] ?? fallback;
}
