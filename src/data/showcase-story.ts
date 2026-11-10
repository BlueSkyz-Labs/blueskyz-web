import type { Language } from "../lib/i18n.ts";

/**
 * Showcase story (Owner 2026-11-10): one page that tells the three products
 * as three short stories, with the newest screens of each.
 *
 * Truth rules (PUBLIC_CONTENT_STANDARD C3/C4, showcase truth rules):
 * - Every screen is a real capture of the running application, taken on
 *   2026-11-10 (GMT+7) from a local test build of the revision in `CAPTURE`,
 *   with synthetic demo data only: no real tenant, journal text or account.
 *   Phone screens are 390 CSS px wide at 2x; the unfolded-screen captures
 *   are 768 (Sổ Trọ, Vững Tay Lái) and 700 (Sổ Tâm) CSS px wide at 2x.
 * - The device frames (status strip, camera cut-out, hinge) are illustration
 *   drawn in CSS around the captures; they name no device maker or model.
 * - Each sentence describes only what its screen shows at that revision. The
 *   product stage shown beside each title comes from the product registry at
 *   render time, never from this file.
 * - The four languages say the same things. zh / zh-hant text is
 *   machine-assisted, pending native review.
 */
type Localized = Record<Language, string>;

export interface ShowcaseScreen {
  /** File stem under /showcase/2026-11/ (`<stem>.webp`, `<stem>-480.webp`). */
  file: string;
  width: number;
  height: number;
  title: Localized;
  body: Localized;
  alt: Localized;
}

export interface ShowcaseAct {
  /** Product slug in the registry; also the section anchor. */
  slug: "sotro" | "sotam" | "vungtaylai";
  title: Localized;
  intro: Localized;
  screens: ShowcaseScreen[];
}

export const CAPTURE = {
  date: "2026-11-10",
  revisions: {
    sotro: "0b9fc3e",
    sotam: "55ef986",
    vungtaylai: "920013c",
  },
} as const;

const PHONE_SHORT = { width: 780, height: 1440 } as const;
const PHONE_TALL = { width: 780, height: 1688 } as const;

export const SHOWCASE_META: Record<
  Language,
  { title: string; description: string }
> = {
  vi: {
    title: "Showcase: ba ứng dụng, ba việc đời thường",
    description:
      "Xem giao diện mới nhất của Sổ Trọ, Sổ Tâm và Vững Tay Lái qua ba câu chuyện ngắn. Ảnh chụp từ bản đang phát triển ngày 10/11/2026, dùng dữ liệu mẫu.",
  },
  en: {
    title: "Showcase: three apps for three everyday jobs",
    description:
      "See the newest screens of Sổ Trọ, Sổ Tâm and Vững Tay Lái in three short stories. Captured from development builds on 10 November 2026 with sample data.",
  },
  zh: {
    title: "展示：三款应用，三件日常事",
    description:
      "通过三个小故事查看 Sổ Trọ、Sổ Tâm 和 Vững Tay Lái 的最新界面。截图于 2026 年 11 月 10 日取自开发中的版本，使用示例数据。",
  },
  "zh-hant": {
    title: "展示：三款應用，三件日常事",
    description:
      "透過三個小故事檢視 Sổ Trọ、Sổ Tâm 和 Vững Tay Lái 的最新介面。截圖於 2026 年 11 月 10 日取自開發中的版本，使用範例資料。",
  },
};

export const SHOWCASE_COPY: Record<
  Language,
  {
    eyebrow: string;
    title: string;
    lede: string;
    note: string;
    jump: string;
    chapter: string;
    screenOf: string;
    ownerDeskLabel: string;
    foldLabel: string;
    frameNote: string;
    openProduct: string;
    closingTitle: string;
    closingLede: string;
    provenanceTitle: string;
    provenanceBody: string;
    revisionLabel: string;
    productsLink: string;
  }
> = {
  vi: {
    eyebrow: "Showcase · tháng 11, 2026",
    title: "Ba ứng dụng cho ba việc đời thường.",
    lede: "Thu tiền trọ đầu tháng. Viết vài dòng cho riêng mình. Ôn thi lý thuyết lái xe. Đây là giao diện mới nhất của ba ứng dụng chúng tôi đang làm, kể theo thứ tự một người dùng sẽ gặp.",
    note: "Ảnh chụp ngày 10 tháng 11, 2026 từ bản đang phát triển, dùng dữ liệu mẫu.",
    jump: "Đi tới từng câu chuyện",
    chapter: "Chương",
    screenOf: "Màn hình",
    ownerDeskLabel: "Trên máy tính của chủ trọ",
    foldLabel: "Trên màn hình gập mở",
    frameNote: "Khung máy quanh ảnh chỉ là hình minh họa.",
    openProduct: "Xem trang",
    closingTitle: "Xem kỹ từng ứng dụng",
    closingLede:
      "Mỗi trang sản phẩm nói rõ ứng dụng đang ở giai đoạn nào và có gì dùng được hôm nay.",
    provenanceTitle: "Về các ảnh trên trang này",
    provenanceBody:
      "Mọi ảnh là màn hình thật của ứng dụng đang chạy, chụp ngày 10 tháng 11, 2026 từ bản đang phát triển. Dữ liệu trong ảnh là dữ liệu mẫu: không có người thuê, bài viết hay tài khoản thật.",
    revisionLabel: "mã nguồn",
    productsLink: "Tất cả sản phẩm",
  },
  en: {
    eyebrow: "Showcase · November 2026",
    title: "Three apps for three everyday jobs.",
    lede: "Collecting rent at the start of the month. Writing a few lines for yourself. Studying for the driving theory test. These are the newest screens of the three apps we are building, in the order a person would meet them.",
    note: "Captured on 10 November 2026 from development builds, with sample data.",
    jump: "Go to each story",
    chapter: "Chapter",
    screenOf: "Screen",
    ownerDeskLabel: "On the owner's computer",
    foldLabel: "On an unfolded screen",
    frameNote: "The device frames around the screens are illustration only.",
    openProduct: "Open the page for",
    closingTitle: "Look closer at each app",
    closingLede:
      "Each product page says which stage the app is in and what you can use today.",
    provenanceTitle: "About the images on this page",
    provenanceBody:
      "Every image is a real screen of the running app, captured on 10 November 2026 from a development build. The data in the images is sample data: no real tenant, journal entry or account.",
    revisionLabel: "source",
    productsLink: "All products",
  },
  zh: {
    eyebrow: "展示 · 2026 年 11 月",
    title: "三款应用，三件日常事。",
    lede: "月初收房租。为自己写几行字。准备驾驶理论考试。以下是我们正在开发的三款应用的最新界面，按用户遇到它们的顺序讲述。",
    note: "截图于 2026 年 11 月 10 日取自开发中的版本，使用示例数据。",
    jump: "前往各个故事",
    chapter: "第",
    screenOf: "界面",
    ownerDeskLabel: "在房东的电脑上",
    foldLabel: "在展开的折叠屏上",
    frameNote: "截图外的设备边框仅为示意。",
    openProduct: "查看页面：",
    closingTitle: "仔细看看每款应用",
    closingLede: "每个产品页面都说明应用所处的阶段，以及今天可以使用的功能。",
    provenanceTitle: "关于本页的图片",
    provenanceBody:
      "每张图片都是应用运行时的真实界面，于 2026 年 11 月 10 日取自开发中的版本。图片中的数据是示例数据：没有真实的租客、日记或账号。",
    revisionLabel: "源代码",
    productsLink: "全部产品",
  },
  "zh-hant": {
    eyebrow: "展示 · 2026 年 11 月",
    title: "三款應用，三件日常事。",
    lede: "月初收房租。為自己寫幾行字。準備駕駛理論考試。以下是我們正在開發的三款應用的最新介面，依使用者遇到它們的順序講述。",
    note: "截圖於 2026 年 11 月 10 日取自開發中的版本，使用範例資料。",
    jump: "前往各個故事",
    chapter: "第",
    screenOf: "介面",
    ownerDeskLabel: "在房東的電腦上",
    foldLabel: "在展開的摺疊螢幕上",
    frameNote: "截圖外的裝置邊框僅為示意。",
    openProduct: "檢視頁面：",
    closingTitle: "仔細看看每款應用",
    closingLede: "每個產品頁面都說明應用所處的階段，以及今天可以使用的功能。",
    provenanceTitle: "關於本頁的圖片",
    provenanceBody:
      "每張圖片都是應用執行時的真實介面，於 2026 年 11 月 10 日取自開發中的版本。圖片中的資料是範例資料：沒有真實的租客、日記或帳號。",
    revisionLabel: "原始碼",
    productsLink: "全部產品",
  },
};

/** The owner's desktop view that closes the Sổ Trọ story (1440x900 CSS px). */
export const OWNER_DESK = {
  file: "sotro-owner-desk",
  width: 1920,
  height: 1200,
  body: {
    vi: "Cùng những con số đó hiện ở trang tổng quan của chủ trọ: còn phải thu bao nhiêu, và hôm nay nên làm việc nào trước.",
    en: "The same numbers appear on the owner's overview: how much is still to collect, and what to do first today.",
    zh: "同样的数字也显示在房东的总览页：还有多少待收，以及今天先做哪件事。",
    "zh-hant":
      "同樣的數字也顯示在房東的總覽頁：還有多少待收，以及今天先做哪件事。",
  },
  alt: {
    vi: "Trang “Tổng quan quản trị” của Sổ Trọ trên máy tính, với thẻ “Còn phải thu” 12.290.000 đ và danh sách “Hôm nay cần làm gì?”.",
    en: "Sổ Trọ owner overview “Tổng quan quản trị” on a computer, with a “Còn phải thu” card showing 12.290.000 đ and the list “Hôm nay cần làm gì?”.",
    zh: "电脑上的 Sổ Trọ 房东总览页“Tổng quan quản trị”，含“Còn phải thu”卡片（12.290.000 đ）和“Hôm nay cần làm gì?”列表。",
    "zh-hant":
      "電腦上的 Sổ Trọ 房東總覽頁「Tổng quan quản trị」，含「Còn phải thu」卡片（12.290.000 đ）和「Hôm nay cần làm gì?」清單。",
  },
} as const;

/**
 * One capture per story at an unfolded-screen width (same build, same data).
 * Shown in a book-style frame that opens as it scrolls into view.
 */
export const FOLD_SCREENS: Record<
  ShowcaseAct["slug"],
  {
    file: string;
    width: number;
    height: number;
    body: Localized;
    alt: Localized;
  }
> = {
  sotro: {
    file: "sotro-fold",
    width: 1200,
    height: 1396,
    body: {
      vi: "Khi màn hình rộng hơn, trang điện nước chia hai cột: danh sách phòng bên trái, lịch sử và đối soát bên phải.",
      en: "On a wider screen the meter page splits in two: rooms on the left, history and checks on the right.",
      zh: "屏幕更宽时，水电页面分成两栏：左边是房间列表，右边是历史与核对。",
      "zh-hant":
        "螢幕更寬時，水電頁面分成兩欄：左邊是房間清單，右邊是歷史與核對。",
    },
    alt: {
      vi: "Trang “Nhập điện nước” của Sổ Trọ ở chiều rộng 768 px, hai cột: danh sách phòng và ô “Lịch sử & Đối soát Điện Nước”.",
      en: "Sổ Trọ meter page “Nhập điện nước” at 768 px wide, in two columns: the room list and the panel “Lịch sử & Đối soát Điện Nước”.",
      zh: "768 像素宽的 Sổ Trọ 水电页面“Nhập điện nước”，分两栏：房间列表和“Lịch sử & Đối soát Điện Nước”面板。",
      "zh-hant":
        "768 像素寬的 Sổ Trọ 水電頁面「Nhập điện nước」，分兩欄：房間清單和「Lịch sử & Đối soát Điện Nước」面板。",
    },
  },
  sotam: {
    file: "sotam-fold",
    width: 1200,
    height: 1396,
    body: {
      vi: "Trên màn hình rộng hơn, trang hôm nay vẫn chỉ có một câu hỏi và nhiều khoảng trống.",
      en: "On a wider screen, today's page still holds one question and plenty of empty space.",
      zh: "在更宽的屏幕上，今天的页面依然只有一个问题和大片留白。",
      "zh-hant": "在更寬的螢幕上，今天的頁面依然只有一個問題和大片留白。",
    },
    alt: {
      vi: "Trang hôm nay của Sổ Tâm ở chiều rộng 700 px, với câu hỏi “Hôm nay, bạn có thể dành một hơi thở chỉ cho riêng mình không?”.",
      en: "Sổ Tâm today page at 700 px wide, with the prompt “Hôm nay, bạn có thể dành một hơi thở chỉ cho riêng mình không?”.",
      zh: "700 像素宽的 Sổ Tâm 今日页面，提示语为“Hôm nay, bạn có thể dành một hơi thở chỉ cho riêng mình không?”。",
      "zh-hant":
        "700 像素寬的 Sổ Tâm 今日頁面，提示語為「Hôm nay, bạn có thể dành một hơi thở chỉ cho riêng mình không?」。",
    },
  },
  vungtaylai: {
    file: "vungtaylai-fold",
    width: 1200,
    height: 1396,
    body: {
      vi: "Thẻ việc hôm nay và ba lối tắt Thi thử, Biển báo, Sa hình nằm gọn trên một màn hình.",
      en: "Today's task card and three shortcuts (mock test, road signs, driving course) fit on one screen.",
      zh: "今日任务卡片和三个快捷入口（模拟考试、交通标志、场地驾驶）都在一屏之内。",
      "zh-hant":
        "今日任務卡片和三個捷徑（模擬考試、交通標誌、場地駕駛）都在一個畫面之內。",
    },
    alt: {
      vi: "Trang “Việc hôm nay” của Vững Tay Lái ở chiều rộng 768 px, với thẻ “Học một chủ đề chính thức mới” và ba lối tắt “Thi thử”, “Biển báo”, “Sa hình”.",
      en: "Vững Tay Lái page “Việc hôm nay” at 768 px wide, with the card “Học một chủ đề chính thức mới” and three shortcuts “Thi thử”, “Biển báo”, “Sa hình”.",
      zh: "768 像素宽的 Vững Tay Lái 页面“Việc hôm nay”，含卡片“Học một chủ đề chính thức mới”和三个快捷入口“Thi thử”“Biển báo”“Sa hình”。",
      "zh-hant":
        "768 像素寬的 Vững Tay Lái 頁面「Việc hôm nay」，含卡片「Học một chủ đề chính thức mới」和三個捷徑「Thi thử」「Biển báo」「Sa hình」。",
    },
  },
};

export const SHOWCASE_ACTS: ShowcaseAct[] = [
  {
    slug: "sotro",
    title: {
      vi: "Đầu tháng của một chủ trọ.",
      en: "A landlord's start of the month.",
      zh: "房东的月初。",
      "zh-hant": "房東的月初。",
    },
    intro: {
      vi: "Trong dữ liệu mẫu, ba mẹ trông một dãy trọ 15 phòng. Sổ Trọ gom việc của cả tháng vào vài màn hình chữ to, nút lớn.",
      en: "In the sample data, a mother and father look after a building of 15 rooms. Sổ Trọ puts the month's work on a few screens with large text and big buttons.",
      zh: "在示例数据中，父母照看一栋 15 间房的出租屋。Sổ Trọ 把整个月的事情放进几个大字、大按钮的界面。",
      "zh-hant":
        "在範例資料中，父母照看一棟 15 間房的出租屋。Sổ Trọ 把整個月的事情放進幾個大字、大按鈕的介面。",
    },
    screens: [
      {
        file: "sotro-today",
        ...PHONE_SHORT,
        title: {
          vi: "Mở máy là biết việc hôm nay",
          en: "Open the app and see today's work",
          zh: "打开就知道今天的事",
          "zh-hant": "打開就知道今天的事",
        },
        body: {
          vi: "Màn hình chính chào theo buổi và xếp việc cần làm ngay lên đầu. Ở đây là bốn phòng còn nợ kỳ trước.",
          en: "The home screen greets you by time of day and puts urgent work first. Here it is four rooms that still owe from the previous period.",
          zh: "首页按时段问候，并把要马上做的事排在最前。这里是四间房还欠上一期的款。",
          "zh-hant":
            "首頁依時段問候，並把要馬上做的事排在最前。這裡是四間房還欠上一期的款。",
        },
        alt: {
          vi: "Màn hình chính Sổ Trọ trên điện thoại: “Hôm nay cần làm gì?”, mục “Việc cần làm ngay” với thẻ “4 phòng còn nợ kỳ trước”.",
          en: "Sổ Trọ phone home screen: “Hôm nay cần làm gì?”, with a “Việc cần làm ngay” section and the card “4 phòng còn nợ kỳ trước”.",
          zh: "Sổ Trọ 手机首页：“Hôm nay cần làm gì?”，“Việc cần làm ngay”栏目及“4 phòng còn nợ kỳ trước”卡片。",
          "zh-hant":
            "Sổ Trọ 手機首頁：「Hôm nay cần làm gì?」，「Việc cần làm ngay」欄目及「4 phòng còn nợ kỳ trước」卡片。",
        },
      },
      {
        file: "sotro-meters",
        ...PHONE_SHORT,
        title: {
          vi: "Ghi điện nước, hết phòng này sang phòng kế",
          en: "Meter readings, one room after another",
          zh: "抄水电表，一间接一间",
          "zh-hant": "抄水電表，一間接一間",
        },
        body: {
          vi: "Chọn phòng, nhập chỉ số của tháng, rồi bấm “Ghi phòng tiếp theo”. Phòng chưa ghi được đánh dấu rõ.",
          en: "Pick a room, enter this month's readings, then tap “Ghi phòng tiếp theo” (record the next room). Rooms without a reading are clearly marked.",
          zh: "选一间房，输入本月读数，再点“Ghi phòng tiếp theo”（记录下一间）。还没抄表的房间有明显标记。",
          "zh-hant":
            "選一間房，輸入本月度數，再點「Ghi phòng tiếp theo」（記錄下一間）。還沒抄表的房間有明顯標記。",
        },
        alt: {
          vi: "Màn hình “Nhập điện nước” của Sổ Trọ: nút “Ghi phòng tiếp theo” và phòng P01 có nhãn “Chưa ghi tháng 11/2026”.",
          en: "Sổ Trọ “Nhập điện nước” screen: a “Ghi phòng tiếp theo” button and room P01 labelled “Chưa ghi tháng 11/2026”.",
          zh: "Sổ Trọ“Nhập điện nước”界面：“Ghi phòng tiếp theo”按钮，P01 房间标有“Chưa ghi tháng 11/2026”。",
          "zh-hant":
            "Sổ Trọ「Nhập điện nước」介面：「Ghi phòng tiếp theo」按鈕，P01 房間標有「Chưa ghi tháng 11/2026」。",
        },
      },
      {
        file: "sotro-collect",
        ...PHONE_SHORT,
        title: {
          vi: "Thu tiền, có biên nhận",
          en: "Collect rent, with a receipt",
          zh: "收租，有收据",
          "zh-hant": "收租，有收據",
        },
        body: {
          vi: "Danh sách “Cần thu” xếp theo mức cần xử lý trước. Cũng từ màn hình này, in biên nhận hàng loạt hoặc bàn giao tiền mặt.",
          en: "The “Cần thu” (to collect) list is ordered by what needs attention first. From the same screen you can print receipts in a batch or hand over cash.",
          zh: "“Cần thu”（待收）列表按处理的先后排序。在同一界面还可以批量打印收据或交接现金。",
          "zh-hant":
            "「Cần thu」（待收）清單依處理的先後排序。在同一介面還可以批次列印收據或交接現金。",
        },
        alt: {
          vi: "Màn hình “Thu tiền” của Sổ Trọ: nút “In biên nhận loạt”, “Bàn giao tiền mặt” và danh sách “Cần thu”.",
          en: "Sổ Trọ “Thu tiền” screen: the buttons “In biên nhận loạt” and “Bàn giao tiền mặt”, and the “Cần thu” list.",
          zh: "Sổ Trọ“Thu tiền”界面：“In biên nhận loạt”和“Bàn giao tiền mặt”按钮，以及“Cần thu”列表。",
          "zh-hant":
            "Sổ Trọ「Thu tiền」介面：「In biên nhận loạt」和「Bàn giao tiền mặt」按鈕，以及「Cần thu」清單。",
        },
      },
      {
        file: "sotro-night",
        ...PHONE_SHORT,
        title: {
          vi: "Buổi tối, màn hình dịu lại",
          en: "In the evening, the screen softens",
          zh: "到了晚上，屏幕变柔和",
          "zh-hant": "到了晚上，螢幕變柔和",
        },
        body: {
          vi: "Màu ấm ban đêm là tùy chọn. Người dùng tự bật, hoặc đặt tự động từ 21:00.",
          en: "Warm night colours are optional. You turn them on yourself, or set them to start automatically at 9 pm.",
          zh: "夜间暖色是可选的。可以自己开启，也可以设为晚上 9 点起自动开启。",
          "zh-hant":
            "夜間暖色是可選的。可以自己開啟，也可以設為晚上 9 點起自動開啟。",
        },
        alt: {
          vi: "Màn hình chính Sổ Trọ ở chế độ màu ấm ban đêm: nền tối, chữ vàng ấm.",
          en: "Sổ Trọ home screen in warm night colours: a dark background with warm amber text.",
          zh: "夜间暖色下的 Sổ Trọ 首页：深色背景，暖黄色文字。",
          "zh-hant": "夜間暖色下的 Sổ Trọ 首頁：深色背景，暖黃色文字。",
        },
      },
    ],
  },
  {
    slug: "sotam",
    title: {
      vi: "Một trang cho riêng mình.",
      en: "A page of your own.",
      zh: "属于自己的一页。",
      "zh-hant": "屬於自己的一頁。",
    },
    intro: {
      vi: "Sổ Tâm là nhật ký riêng tư. Bản Web hiện lưu bài viết ngay trong trình duyệt, không cần tài khoản.",
      en: "Sổ Tâm is a private journal. The web version currently keeps what you write in the browser, with no account needed.",
      zh: "Sổ Tâm 是一本私密日记。网页版目前把你写的内容保存在浏览器里，无需账号。",
      "zh-hant":
        "Sổ Tâm 是一本私密日記。網頁版目前把你寫的內容儲存在瀏覽器裡，不需帳號。",
    },
    screens: [
      {
        file: "sotam-today",
        ...PHONE_TALL,
        title: {
          vi: "Một câu hỏi nhỏ để bắt đầu",
          en: "A small question to begin",
          zh: "从一个小问题开始",
          "zh-hant": "從一個小問題開始",
        },
        body: {
          vi: "Trang Hôm nay ghi ngày, tiết khí và gợi một câu hỏi. Không hợp thì đổi gợi ý khác, hoặc ẩn đi.",
          en: "The Today page shows the date and the solar term, and offers one question. If it does not suit you, ask for another or hide it.",
          zh: "“今天”页显示日期和节气，并给出一个问题。不合适可以换一个，或者隐藏。",
          "zh-hant":
            "「今天」頁顯示日期和節氣，並給出一個問題。不合適可以換一個，或者隱藏。",
        },
        alt: {
          vi: "Trang Hôm nay của Sổ Tâm: “Thứ Ba, 10 tháng 11”, dòng “Tiết Lập Đông” và câu gợi ý “Ngay lúc này, điều gì đang ở gần bạn nhất?”.",
          en: "Sổ Tâm Today page: “Thứ Ba, 10 tháng 11”, the line “Tiết Lập Đông” and the prompt “Ngay lúc này, điều gì đang ở gần bạn nhất?”.",
          zh: "Sổ Tâm“今天”页：“Thứ Ba, 10 tháng 11”、“Tiết Lập Đông”一行，以及提示“Ngay lúc này, điều gì đang ở gần bạn nhất?”。",
          "zh-hant":
            "Sổ Tâm「今天」頁：「Thứ Ba, 10 tháng 11」、「Tiết Lập Đông」一行，以及提示「Ngay lúc này, điều gì đang ở gần bạn nhất?」。",
        },
      },
      {
        file: "sotam-write",
        ...PHONE_TALL,
        title: {
          vi: "Viết, và biết bài đã được lưu",
          en: "Write, and know it is saved",
          zh: "写下来，并知道已保存",
          "zh-hant": "寫下來，並知道已儲存",
        },
        body: {
          vi: "Gõ vài dòng. Nhãn “Đã lưu trên thiết bị” và số từ hiện ngay bên dưới.",
          en: "Type a few lines. The label “Đã lưu trên thiết bị” (saved on this device) and the word count appear just below.",
          zh: "写几行字。下方随即显示“Đã lưu trên thiết bị”（已保存在此设备）标签和字数。",
          "zh-hant":
            "寫幾行字。下方隨即顯示「Đã lưu trên thiết bị」（已儲存在此裝置）標籤和字數。",
        },
        alt: {
          vi: "Trang Hôm nay của Sổ Tâm với một dòng viết mẫu, nhãn “Đã lưu trên thiết bị” và “11 từ”.",
          en: "Sổ Tâm Today page with one sample line of writing, the label “Đã lưu trên thiết bị” and “11 từ”.",
          zh: "Sổ Tâm“今天”页，有一行示例文字、“Đã lưu trên thiết bị”标签和“11 từ”。",
          "zh-hant":
            "Sổ Tâm「今天」頁，有一行範例文字、「Đã lưu trên thiết bị」標籤和「11 từ」。",
        },
      },
      {
        file: "sotam-mood",
        ...PHONE_TALL,
        title: {
          vi: "Gọi tên tâm trạng, nếu muốn",
          en: "Name the mood, if you want to",
          zh: "愿意的话，给心情起个名字",
          "zh-hant": "願意的話，給心情起個名字",
        },
        body: {
          vi: "Phần tâm trạng không bắt buộc. Chọn một từ như “Nhẹ lòng”, thêm một điểm chạm như “Tri ân”.",
          en: "The mood section is optional. Choose a word such as “Nhẹ lòng” (light-hearted) and add a touchpoint such as “Tri ân” (gratitude).",
          zh: "心情部分不是必填。选一个词，例如“Nhẹ lòng”（轻松），再加一个触点，例如“Tri ân”（感恩）。",
          "zh-hant":
            "心情部分不是必填。選一個詞，例如「Nhẹ lòng」（輕鬆），再加一個觸點，例如「Tri ân」（感恩）。",
        },
        alt: {
          vi: "Sổ Tâm: hàng từ tâm trạng với “Nhẹ lòng” đang chọn và nhóm “Điểm chạm” với “Tri ân” đang chọn.",
          en: "Sổ Tâm: a row of mood words with “Nhẹ lòng” selected and a “Điểm chạm” group with “Tri ân” selected.",
          zh: "Sổ Tâm：一行心情词语，已选“Nhẹ lòng”；“Điểm chạm”一组，已选“Tri ân”。",
          "zh-hant":
            "Sổ Tâm：一行心情詞語，已選「Nhẹ lòng」；「Điểm chạm」一組，已選「Tri ân」。",
        },
      },
      {
        file: "sotam-memories",
        ...PHONE_TALL,
        title: {
          vi: "Nhìn lại theo thời gian",
          en: "Look back over time",
          zh: "按时间回看",
          "zh-hant": "依時間回看",
        },
        body: {
          vi: "Tab Ký ức xếp các trang đã hoàn tất theo năm và tháng, chỉ trên thiết bị này. Tab này đang ở trạng thái xem trước.",
          en: "The Memories tab arranges finished pages by year and month, on this device only. This tab is still a preview.",
          zh: "“记忆”页签按年和月排列已完成的页面，只在这台设备上。该页签仍是预览状态。",
          "zh-hant":
            "「記憶」頁籤依年和月排列已完成的頁面，只在這台裝置上。該頁籤仍是預覽狀態。",
        },
        alt: {
          vi: "Tab “Ký ức” của Sổ Tâm với mục “Cây thời gian”, năm 2026, tháng 11 năm 2026 và “0 trang”.",
          en: "Sổ Tâm “Ký ức” tab with the “Cây thời gian” section, the year 2026, “tháng 11 năm 2026” and “0 trang”.",
          zh: "Sổ Tâm“Ký ức”页签，含“Cây thời gian”栏目、2026 年、“tháng 11 năm 2026”和“0 trang”。",
          "zh-hant":
            "Sổ Tâm「Ký ức」頁籤，含「Cây thời gian」欄目、2026 年、「tháng 11 năm 2026」和「0 trang」。",
        },
      },
    ],
  },
  {
    slug: "vungtaylai",
    title: {
      vi: "Từ câu hỏi đầu tiên đến ngày thi.",
      en: "From the first question to test day.",
      zh: "从第一道题到考试那天。",
      "zh-hant": "從第一道題到考試那天。",
    },
    intro: {
      vi: "Vững Tay Lái giúp ôn lý thuyết lái xe hạng B. Nội dung học do ứng dụng biên soạn và ghi rõ nguồn. Đây không phải ứng dụng của cơ quan nhà nước.",
      en: "Vững Tay Lái helps you study class-B driving theory. The learning content is written by the app and names its sources. It is not a government app.",
      zh: "Vững Tay Lái 帮你复习 B 类驾驶理论。学习内容由应用编写并注明来源。它不是政府机构的应用。",
      "zh-hant":
        "Vững Tay Lái 幫你複習 B 類駕駛理論。學習內容由應用編寫並註明來源。它不是政府機關的應用。",
    },
    screens: [
      {
        file: "vungtaylai-today",
        ...PHONE_TALL,
        title: {
          vi: "Mỗi ngày một việc vừa sức",
          en: "One manageable task each day",
          zh: "每天一件力所能及的事",
          "zh-hant": "每天一件力所能及的事",
        },
        body: {
          vi: "Sau khi chọn giai đoạn, trang Hôm nay đưa ra một việc. Ở đây là học một chủ đề mới: khoảng 5 phút, 5 câu.",
          en: "After you choose your stage, the Today page gives you one task. Here it is a new topic: about 5 minutes, 5 questions.",
          zh: "选好阶段后，“今天”页给出一件事。这里是学习一个新主题：大约 5 分钟，5 道题。",
          "zh-hant":
            "選好階段後，「今天」頁給出一件事。這裡是學習一個新主題：大約 5 分鐘，5 道題。",
        },
        alt: {
          vi: "Trang “Việc hôm nay” của Vững Tay Lái: giai đoạn 3/6, thẻ “Học một chủ đề chính thức mới”, khoảng 5 phút, 5 câu, và lối tắt Thi thử, Biển báo, Sa hình.",
          en: "Vững Tay Lái “Việc hôm nay” page: stage 3 of 6, the card “Học một chủ đề chính thức mới”, about 5 minutes and 5 questions, and shortcuts to Thi thử, Biển báo and Sa hình.",
          zh: "Vững Tay Lái“Việc hôm nay”页：阶段 3/6，“Học một chủ đề chính thức mới”卡片，约 5 分钟、5 道题，以及 Thi thử、Biển báo、Sa hình 快捷入口。",
          "zh-hant":
            "Vững Tay Lái「Việc hôm nay」頁：階段 3/6，「Học một chủ đề chính thức mới」卡片，約 5 分鐘、5 道題，以及 Thi thử、Biển báo、Sa hình 捷徑。",
        },
      },
      {
        file: "vungtaylai-question",
        ...PHONE_TALL,
        title: {
          vi: "Câu điểm liệt có nhãn riêng",
          en: "Critical questions carry their own label",
          zh: "否决题有专门的标签",
          "zh-hant": "否決題有專門的標籤",
        },
        body: {
          vi: "Mỗi câu hiện rõ đề bài và các đáp án. Câu điểm liệt được gắn nhãn để người học chú ý.",
          en: "Each question shows the situation and its answers clearly. A critical question (“câu điểm liệt”) is labelled so the learner takes care.",
          zh: "每道题都清楚显示题目和选项。否决题（“câu điểm liệt”）会带标签提醒学习者注意。",
          "zh-hant":
            "每道題都清楚顯示題目和選項。否決題（「câu điểm liệt」）會帶標籤提醒學習者注意。",
        },
        alt: {
          vi: "Màn hình “Luyện tập” của Vững Tay Lái, câu 1/5 có nhãn “Câu điểm liệt” về đồ uống có cồn, với ba đáp án A, B, C.",
          en: "Vững Tay Lái “Luyện tập” screen, question 1 of 5 labelled “Câu điểm liệt”, about alcohol and getting home, with answers A, B and C.",
          zh: "Vững Tay Lái“Luyện tập”界面，第 1/5 题带“Câu điểm liệt”标签，内容是饮酒后如何回家，有 A、B、C 三个选项。",
          "zh-hant":
            "Vững Tay Lái「Luyện tập」介面，第 1/5 題帶「Câu điểm liệt」標籤，內容是飲酒後如何回家，有 A、B、C 三個選項。",
        },
      },
      {
        file: "vungtaylai-feedback",
        ...PHONE_TALL,
        title: {
          vi: "Trả lời xong mới thấy đáp án",
          en: "The answer appears after you commit",
          zh: "答完才看到答案",
          "zh-hant": "答完才看到答案",
        },
        body: {
          vi: "Người học chọn đáp án, ghi mức tự tin, rồi mới xem kết quả. Phần “Hiểu nhanh” ghi rõ là do Vững Tay Lái biên soạn, kèm nguồn tham chiếu.",
          en: "The learner picks an answer, records how sure they are, and only then sees the result. The “Hiểu nhanh” (quick understanding) note says it is written by Vững Tay Lái, and lists its reference sources.",
          zh: "学习者先选答案、记下把握程度，然后才看到结果。“Hiểu nhanh”（快速理解）说明注明由 Vững Tay Lái 编写，并附参考来源。",
          "zh-hant":
            "學習者先選答案、記下把握程度，然後才看到結果。「Hiểu nhanh」（快速理解）說明註明由 Vững Tay Lái 編寫，並附參考來源。",
        },
        alt: {
          vi: "Vững Tay Lái sau khi trả lời: kết quả “Chính xác”, “Đáp án đúng: B”, phần “Hiểu nhanh” và mục “Nguồn tham chiếu (3)”.",
          en: "Vững Tay Lái after answering: the result “Chính xác”, “Đáp án đúng: B”, the “Hiểu nhanh” note and “Nguồn tham chiếu (3)”.",
          zh: "Vững Tay Lái 作答后：结果“Chính xác”、“Đáp án đúng: B”、“Hiểu nhanh”说明和“Nguồn tham chiếu (3)”。",
          "zh-hant":
            "Vững Tay Lái 作答後：結果「Chính xác」、「Đáp án đúng: B」、「Hiểu nhanh」說明和「Nguồn tham chiếu (3)」。",
        },
      },
      {
        file: "vungtaylai-journey",
        ...PHONE_TALL,
        title: {
          vi: "Biết mình đang ở đâu",
          en: "Know where you are",
          zh: "知道自己走到哪一步",
          "zh-hant": "知道自己走到哪一步",
        },
        body: {
          vi: "Trang Hành trình vẽ sáu giai đoạn, từ lúc tìm hiểu đến khi đã có bằng, và đánh dấu giai đoạn hiện tại.",
          en: "The Journey page draws six stages, from first looking into it to already holding a licence, and marks the stage you are in.",
          zh: "“旅程”页画出六个阶段，从开始了解到已经拿到驾照，并标出当前阶段。",
          "zh-hant":
            "「旅程」頁畫出六個階段，從開始了解到已經拿到駕照，並標出目前階段。",
        },
        alt: {
          vi: "Trang “Hành trình” của Vững Tay Lái: nhãn “Bạn đang ở: Học & luyện tập” và đường sáu giai đoạn, giai đoạn 3 được đánh dấu.",
          en: "Vững Tay Lái “Hành trình” page: the label “Bạn đang ở: Học & luyện tập” and a path of six stages with stage 3 marked.",
          zh: "Vững Tay Lái“Hành trình”页：“Bạn đang ở: Học & luyện tập”标签，以及六个阶段的路线，其中第 3 阶段被标出。",
          "zh-hant":
            "Vững Tay Lái「Hành trình」頁：「Bạn đang ở: Học & luyện tập」標籤，以及六個階段的路線，其中第 3 階段被標出。",
        },
      },
    ],
  },
];
