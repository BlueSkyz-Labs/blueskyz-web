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
    title: "Showcase: chuyện thường ngày, kể bằng ba ứng dụng",
    description:
      "Đi qua giao diện mới nhất của Sổ Trọ, Sổ Tâm và Vững Tay Lái trong ba câu chuyện ngắn. Ảnh chụp từ bản đang phát triển ngày 10/11/2026, dùng dữ liệu mẫu.",
  },
  en: {
    title: "Showcase: three everyday stories, told in three apps",
    description:
      "Walk through the newest screens of Sổ Trọ, Sổ Tâm and Vững Tay Lái in three short stories. Captured from development builds on 10 November 2026 with sample data.",
  },
  zh: {
    title: "展示：三款应用，讲三个日常故事",
    description:
      "通过三个小故事查看 Sổ Trọ、Sổ Tâm 和 Vững Tay Lái 的最新界面。截图于 2026 年 11 月 10 日取自开发中的版本，使用示例数据。",
  },
  "zh-hant": {
    title: "展示：三款應用，講三個日常故事",
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
    title: "Chuyện thường ngày, kể bằng ba ứng dụng.",
    lede: "Một chủ trọ đi thu tiền đầu tháng. Một người ngồi lại viết vài dòng cho mình. Một người sắp thi bằng lái. Mời bạn đi cùng họ qua những màn hình mới nhất của ba ứng dụng chúng tôi đang làm.",
    note: "Ảnh chụp ngày 10 tháng 11, 2026 từ bản đang phát triển. Dữ liệu trong ảnh là dữ liệu mẫu.",
    jump: "Đi tới từng câu chuyện",
    chapter: "Chương",
    screenOf: "Màn hình",
    ownerDeskLabel: "Trên máy tính của chủ trọ",
    foldLabel: "Trên màn hình gập mở",
    frameNote: "Khung máy quanh ảnh chỉ là hình minh họa.",
    openProduct: "Xem trang",
    closingTitle: "Muốn xem kỹ hơn?",
    closingLede:
      "Trang riêng của mỗi ứng dụng nói rõ nó đang ở giai đoạn nào, và hôm nay bạn dùng được những gì.",
    provenanceTitle: "Về các ảnh trên trang này",
    provenanceBody:
      "Mọi ảnh là màn hình thật của ứng dụng đang chạy, chụp ngày 10 tháng 11, 2026 từ bản đang phát triển. Dữ liệu trong ảnh là dữ liệu mẫu: không có người thuê, bài viết hay tài khoản thật.",
    revisionLabel: "mã nguồn",
    productsLink: "Tất cả sản phẩm",
  },
  en: {
    eyebrow: "Showcase · November 2026",
    title: "Three everyday stories, told in three apps.",
    lede: "A landlord doing the rounds at the start of the month. Someone sitting down to write a few lines for themselves. Someone with a driving test coming up. Walk with them through the newest screens of the three apps we are building.",
    note: "Captured on 10 November 2026 from development builds. The data in the images is sample data.",
    jump: "Go to each story",
    chapter: "Chapter",
    screenOf: "Screen",
    ownerDeskLabel: "On the owner's computer",
    foldLabel: "On an unfolded screen",
    frameNote: "The device frames around the screens are illustration only.",
    openProduct: "Open the page for",
    closingTitle: "Want a closer look?",
    closingLede:
      "Each app's own page says which stage it is in and what you can use today.",
    provenanceTitle: "About the images on this page",
    provenanceBody:
      "Every image is a real screen of the running app, captured on 10 November 2026 from a development build. The data in the images is sample data: no real tenant, journal entry or account.",
    revisionLabel: "source",
    productsLink: "All products",
  },
  zh: {
    eyebrow: "展示 · 2026 年 11 月",
    title: "三个日常故事，由三款应用来讲。",
    lede: "一位房东在月初挨间收租。一个人坐下来，为自己写几行字。一个人快要考驾照了。请跟着他们，看看我们正在开发的三款应用的最新界面。",
    note: "截图于 2026 年 11 月 10 日取自开发中的版本。图中的数据是示例数据。",
    jump: "前往各个故事",
    chapter: "第",
    screenOf: "界面",
    ownerDeskLabel: "在房东的电脑上",
    foldLabel: "在展开的折叠屏上",
    frameNote: "截图外的设备边框仅为示意。",
    openProduct: "查看页面：",
    closingTitle: "想看得更仔细？",
    closingLede:
      "每款应用自己的页面都写明它处于哪个阶段，以及你今天能用到什么。",
    provenanceTitle: "关于本页的图片",
    provenanceBody:
      "每张图片都是应用运行时的真实界面，于 2026 年 11 月 10 日取自开发中的版本。图片中的数据是示例数据：没有真实的租客、日记或账号。",
    revisionLabel: "源代码",
    productsLink: "全部产品",
  },
  "zh-hant": {
    eyebrow: "展示 · 2026 年 11 月",
    title: "三個日常故事，由三款應用來講。",
    lede: "一位房東在月初挨間收租。一個人坐下來，為自己寫幾行字。一個人快要考駕照了。請跟著他們，看看我們正在開發的三款應用的最新介面。",
    note: "截圖於 2026 年 11 月 10 日取自開發中的版本。圖中的資料是範例資料。",
    jump: "前往各個故事",
    chapter: "第",
    screenOf: "介面",
    ownerDeskLabel: "在房東的電腦上",
    foldLabel: "在展開的摺疊螢幕上",
    frameNote: "截圖外的裝置邊框僅為示意。",
    openProduct: "檢視頁面：",
    closingTitle: "想看得更仔細？",
    closingLede:
      "每款應用自己的頁面都寫明它處於哪個階段，以及你今天能用到什麼。",
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
    vi: "Về đến bàn, chủ trọ gặp lại đúng những con số ấy trên trang tổng quan: còn phải thu bao nhiêu, hôm nay làm gì trước.",
    en: "Back at the desk, the same numbers are waiting on the owner's overview: how much is still to collect, and what to do first today.",
    zh: "回到桌前，同样的数字已经在房东的总览页上等着：还有多少待收，今天先做哪件事。",
    "zh-hant":
      "回到桌前，同樣的數字已經在房東的總覽頁上等著：還有多少待收，今天先做哪件事。",
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
      vi: "Mở rộng màn hình, trang điện nước tách làm hai: bên trái là danh sách phòng, bên phải là lịch sử và đối soát.",
      en: "Given more room, the meter page splits in two: the room list on the left, history and checks on the right.",
      zh: "屏幕一展开，水电页面就分成两半：左边是房间列表，右边是历史与核对。",
      "zh-hant":
        "螢幕一展開，水電頁面就分成兩半：左邊是房間清單，右邊是歷史與核對。",
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
      vi: "Màn hình rộng hơn, trang vẫn vậy: một câu hỏi, và thật nhiều khoảng trống.",
      en: "On a wider screen the page stays the same: one question, and plenty of empty space.",
      zh: "屏幕更宽了，页面还是那样：一个问题，和大片留白。",
      "zh-hant": "螢幕更寬了，頁面還是那樣：一個問題，和大片留白。",
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
      vi: "Một màn hình là đủ: thẻ việc hôm nay, cùng ba lối tắt Thi thử, Biển báo, Sa hình.",
      en: "One screen holds it all: today's task card and three shortcuts, to the mock test, road signs and the driving course.",
      zh: "一屏就够了：今日任务卡片，加上模拟考试、交通标志、场地驾驶三个快捷入口。",
      "zh-hant":
        "一個畫面就夠了：今日任務卡片，加上模擬考試、交通標誌、場地駕駛三個捷徑。",
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
      vi: "Đầu tháng, ở một dãy trọ.",
      en: "The start of the month, in a house of rented rooms.",
      zh: "月初，在一栋出租屋里。",
      "zh-hant": "月初，在一棟出租屋裡。",
    },
    intro: {
      vi: "Dãy trọ trong dữ liệu mẫu có 15 phòng, do ba mẹ trông nom. Việc của cả tháng nằm gọn trong vài màn hình, chữ to, nút lớn.",
      en: "The building in the sample data has 15 rooms, looked after by Mum and Dad. A month of work sits on a few screens, with large type and big buttons.",
      zh: "示例数据里的出租屋有 15 间房，由爸妈照看。一整个月的事，都收在几个大字、大按钮的界面里。",
      "zh-hant":
        "範例資料裡的出租屋有 15 間房，由爸媽照看。一整個月的事，都收在幾個大字、大按鈕的介面裡。",
    },
    screens: [
      {
        file: "sotro-today",
        ...PHONE_SHORT,
        title: {
          vi: "Mở máy, việc đã xếp sẵn",
          en: "Open it, and the day is already sorted",
          zh: "一打开，事情已经排好",
          "zh-hant": "一打開，事情已經排好",
        },
        body: {
          vi: "Sổ Trọ chào theo buổi, rồi đưa việc cần làm ngay lên đầu. Hôm nay là bốn phòng còn nợ kỳ trước.",
          en: "Sổ Trọ greets you by the time of day, then puts what cannot wait at the top. Today that is four rooms still owing from the previous period.",
          zh: "Sổ Trọ 按时段问候，再把不能等的事放到最上面。今天是四间房还欠着上一期的款。",
          "zh-hant":
            "Sổ Trọ 依時段問候，再把不能等的事放到最上面。今天是四間房還欠著上一期的款。",
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
          vi: "Ghi điện nước, phòng này nối phòng kia",
          en: "Meter readings, one door after the next",
          zh: "抄水电表，一间接着一间",
          "zh-hant": "抄水電表，一間接著一間",
        },
        body: {
          vi: "Chọn phòng, nhập chỉ số tháng này, bấm “Ghi phòng tiếp theo”. Phòng nào chưa ghi, nhãn màu vàng nhắc ngay trên thẻ.",
          en: "Pick a room, enter this month's reading, tap “Ghi phòng tiếp theo” (record the next room). Any room not yet read carries an amber label on its card.",
          zh: "选一间房，输入本月读数，点“Ghi phòng tiếp theo”（记录下一间）。还没抄的房间，卡片上有一枚黄色标签提醒。",
          "zh-hant":
            "選一間房，輸入本月度數，點「Ghi phòng tiếp theo」（記錄下一間）。還沒抄的房間，卡片上有一枚黃色標籤提醒。",
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
          vi: "Thu tiền, đưa biên nhận",
          en: "Collect the rent, hand over a receipt",
          zh: "收租，递上收据",
          "zh-hant": "收租，遞上收據",
        },
        body: {
          vi: "Danh sách “Cần thu” đưa phòng cần xử lý trước lên đầu. Ngay tại đây có nút in biên nhận hàng loạt và nút bàn giao tiền mặt.",
          en: "The “Cần thu” (to collect) list puts the rooms that need attention first. Right here are the buttons to print receipts in a batch and to hand over cash.",
          zh: "“Cần thu”（待收）列表把最该先处理的房间排在前面。批量打印收据和交接现金的按钮也在这里。",
          "zh-hant":
            "「Cần thu」（待收）清單把最該先處理的房間排在前面。批次列印收據和交接現金的按鈕也在這裡。",
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
          vi: "Tối đến, màn hình dịu lại",
          en: "Come evening, the screen softens",
          zh: "到了晚上，屏幕柔和下来",
          "zh-hant": "到了晚上，螢幕柔和下來",
        },
        body: {
          vi: "Màu ấm ban đêm là tùy chọn: tự bật khi muốn, hoặc hẹn giờ từ 21:00.",
          en: "Warm night colours are optional: switch them on when you like, or schedule them from 9 pm.",
          zh: "夜间暖色是可选的：想用时自己打开，或者设定从晚上 9 点开始。",
          "zh-hant":
            "夜間暖色是可選的：想用時自己開啟，或者設定從晚上 9 點開始。",
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
      vi: "Một trang giấy cho riêng mình.",
      en: "A page that is only yours.",
      zh: "只属于自己的一页。",
      "zh-hant": "只屬於自己的一頁。",
    },
    intro: {
      vi: "Sổ Tâm là cuốn nhật ký riêng tư. Ở bản Web hiện nay, điều bạn viết nằm lại ngay trong trình duyệt, không cần tài khoản.",
      en: "Sổ Tâm is a private journal. In today's web version, what you write stays in your browser, and no account is needed.",
      zh: "Sổ Tâm 是一本私密日记。在目前的网页版里，你写下的内容就留在浏览器中，不需要账号。",
      "zh-hant":
        "Sổ Tâm 是一本私密日記。在目前的網頁版裡，你寫下的內容就留在瀏覽器中，不需要帳號。",
    },
    screens: [
      {
        file: "sotam-today",
        ...PHONE_TALL,
        title: {
          vi: "Bắt đầu từ một câu hỏi nhỏ",
          en: "It starts with a small question",
          zh: "从一个小问题开始",
          "zh-hant": "從一個小問題開始",
        },
        body: {
          vi: "Trang Hôm nay ghi ngày, ghi tiết khí, rồi khẽ hỏi một câu. Chưa hợp thì đổi câu khác, hoặc ẩn đi.",
          en: "The Today page gives the date and the solar term, then asks one quiet question. If it does not fit, ask for another, or hide it.",
          zh: "“今天”页写着日期和节气，然后轻轻问一个问题。不合适，就换一个，或者把它隐藏。",
          "zh-hant":
            "「今天」頁寫著日期和節氣，然後輕輕問一個問題。不合適，就換一個，或者把它隱藏。",
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
          vi: "Viết xuống, và thấy bài đã được lưu",
          en: "Write it down, and see that it is kept",
          zh: "写下来，并看到它已保存",
          "zh-hant": "寫下來，並看到它已儲存",
        },
        body: {
          vi: "Gõ vài dòng. Ngay bên dưới hiện nhãn “Đã lưu trên thiết bị” cùng số từ bạn vừa viết.",
          en: "Type a few lines. Just below, the label “Đã lưu trên thiết bị” (saved on this device) appears with your word count.",
          zh: "写几行字。下方随即出现“Đã lưu trên thiết bị”（已保存在此设备）标签和你刚写的字数。",
          "zh-hant":
            "寫幾行字。下方隨即出現「Đã lưu trên thiết bị」（已儲存在此裝置）標籤和你剛寫的字數。",
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
          vi: "Gọi tên tâm trạng, khi bạn muốn",
          en: "Name the mood, when you want to",
          zh: "想说的时候，给心情起个名字",
          "zh-hant": "想說的時候，給心情起個名字",
        },
        body: {
          vi: "Phần này không bắt buộc. Chọn một từ, như “Nhẹ lòng”. Thêm một điểm chạm, như “Tri ân”.",
          en: "This part is optional. Choose a word, such as “Nhẹ lòng” (light-hearted). Add a touchpoint, such as “Tri ân” (gratitude).",
          zh: "这一部分不是必填。选一个词，比如“Nhẹ lòng”（轻松）。再加一个触点，比如“Tri ân”（感恩）。",
          "zh-hant":
            "這一部分不是必填。選一個詞，比如「Nhẹ lòng」（輕鬆）。再加一個觸點，比如「Tri ân」（感恩）。",
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
          vi: "Rồi một ngày, lật lại",
          en: "And one day, turn back the pages",
          zh: "有一天，再翻回来看",
          "zh-hant": "有一天，再翻回來看",
        },
        body: {
          vi: "Tab Ký ức xếp những trang đã hoàn tất theo năm và tháng, chỉ trên thiết bị này. Tab hiện ở trạng thái xem trước.",
          en: "The Memories tab arranges finished pages by year and month, on this device only. The tab is still a preview.",
          zh: "“记忆”标签页按年和月排列已完成的页面，只在这台设备上。该标签页目前仍是预览状态。",
          "zh-hant":
            "「記憶」頁籤依年和月排列已完成的頁面，只在這台裝置上。該頁籤目前仍是預覽狀態。",
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
      vi: "Vững Tay Lái dành cho người đang ôn lý thuyết lái xe hạng B. Nội dung do ứng dụng tự biên soạn, có ghi nguồn. Đây không phải ứng dụng của cơ quan nhà nước.",
      en: "Vững Tay Lái is for people studying class-B driving theory. The app writes its own learning content and names its sources. It is not a government app.",
      zh: "Vững Tay Lái 为正在复习 B 类驾驶理论的人而做。学习内容由应用自行编写，并注明来源。它不是政府机关的应用。",
      "zh-hant":
        "Vững Tay Lái 為正在複習 B 類駕駛理論的人而做。學習內容由應用自行編寫，並註明來源。它不是政府機關的應用。",
    },
    screens: [
      {
        file: "vungtaylai-today",
        ...PHONE_TALL,
        title: {
          vi: "Mỗi ngày, một việc vừa sức",
          en: "Each day, one task you can manage",
          zh: "每天，一件力所能及的事",
          "zh-hant": "每天，一件力所能及的事",
        },
        body: {
          vi: "Chọn xong giai đoạn, trang Hôm nay chỉ giao một việc. Lần này là một chủ đề mới: chừng 5 phút, 5 câu.",
          en: "Once you choose your stage, the Today page hands you a single task. This time it is a new topic: about 5 minutes, 5 questions.",
          zh: "选好阶段后，“今天”页只交给你一件事。这一次是一个新主题：大约 5 分钟，5 道题。",
          "zh-hant":
            "選好階段後，「今天」頁只交給你一件事。這一次是一個新主題：大約 5 分鐘，5 道題。",
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
          vi: "Câu điểm liệt, nhìn là nhận ra",
          en: "A critical question is plain to see",
          zh: "否决题，一眼就能认出",
          "zh-hant": "否決題，一眼就能認出",
        },
        body: {
          vi: "Đề bài và đáp án bày rõ ràng. Câu điểm liệt mang nhãn riêng, để người học chậm lại một nhịp.",
          en: "The situation and the answers are laid out clearly. A critical question (“câu điểm liệt”) carries its own label, so the learner slows down for it.",
          zh: "题目和选项摆得清清楚楚。否决题（“câu điểm liệt”）带有专门的标签，提醒学习者放慢一步。",
          "zh-hant":
            "題目和選項擺得清清楚楚。否決題（「câu điểm liệt」）帶有專門的標籤，提醒學習者放慢一步。",
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
          vi: "Chọn trước, đáp án sau",
          en: "Answer first, result after",
          zh: "先作答，后看答案",
          "zh-hant": "先作答，後看答案",
        },
        body: {
          vi: "Người học chọn đáp án, tự chấm mức tự tin, rồi mới thấy kết quả. Phần “Hiểu nhanh” ghi rõ do Vững Tay Lái biên soạn, kèm nguồn tham chiếu.",
          en: "The learner picks an answer, rates how sure they are, and only then sees the result. The “Hiểu nhanh” (quick understanding) note says it is written by Vững Tay Lái and lists its reference sources.",
          zh: "学习者先选答案，给自己的把握程度打分，然后才看到结果。“Hiểu nhanh”（快速理解）注明由 Vững Tay Lái 编写，并附参考来源。",
          "zh-hant":
            "學習者先選答案，給自己的把握程度打分，然後才看到結果。「Hiểu nhanh」（快速理解）註明由 Vững Tay Lái 編寫，並附參考來源。",
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
          vi: "Luôn biết mình đang ở đâu",
          en: "Always know where you are",
          zh: "随时知道自己走到哪一步",
          "zh-hant": "隨時知道自己走到哪一步",
        },
        body: {
          vi: "Trang Hành trình vẽ sáu chặng, từ lúc mới tìm hiểu đến khi cầm bằng, và đánh dấu chặng bạn đang đi.",
          en: "The Journey page draws six stages, from first finding out to holding the licence, and marks the one you are on.",
          zh: "“旅程”页画出六段路，从刚开始了解到拿到驾照，并标出你正在走的那一段。",
          "zh-hant":
            "「旅程」頁畫出六段路，從剛開始了解到拿到駕照，並標出你正在走的那一段。",
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
