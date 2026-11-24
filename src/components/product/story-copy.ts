import type { Language } from "@/lib/i18n";

/**
 * v12 S1 Feature Story chrome strings. Chapter headings and lines are not
 * here: they come from the showcase record (screen title and caption) and the
 * product record (job or capability), through `resolveFeatureStory`.
 * zh and zh-hant: NOT VERIFIED (native review pending).
 *
 * `title`, `lead` and `desktop` frame a landlord's month, which is Sổ Trọ's
 * story only. Every other product gets the neutral `NEUTRAL_STORY_COPY`
 * through `storyFrame`, so a learner's or a writer's app is never headed
 * "A landlord's month".
 */
export const STORY_COPY = {
  en: {
    title: (name: string) => `A landlord’s month in ${name}`,
    lead: "Follow a landlord through one month, from today’s list on the phone to the owner’s computer.",
    desktop: "On the owner’s computer",
    inspect: "View larger image (sample data)",
    inspectOpens: "opens the image in a new tab",
    viewerClose: "Close",
  },
  vi: {
    title: (name: string) => `Một tháng của chủ nhà cùng ${name}`,
    lead: "Theo chân chủ nhà suốt một tháng: từ việc cần làm hôm nay trên điện thoại đến máy tính.",
    desktop: "Trên máy tính của chủ nhà",
    inspect: "Xem ảnh lớn (dữ liệu mẫu)",
    inspectOpens: "mở ảnh trong thẻ mới",
    viewerClose: "Đóng",
  },
  zh: {
    title: (name: string) => `房东的一个月，在 ${name} 里`,
    lead: "跟着房东走过一个月，从手机上今天的待办，到房东的电脑。",
    desktop: "房东电脑",
    inspect: "查看大图（示例数据）",
    inspectOpens: "在新标签页打开图片",
    viewerClose: "关闭",
  },
  "zh-hant": {
    title: (name: string) => `房東的一個月，在 ${name} 裡`,
    lead: "跟著房東走過一個月，從手機上今天的待辦，到房東的電腦。",
    desktop: "房東電腦",
    inspect: "查看大圖（範例資料）",
    inspectOpens: "在新分頁開啟圖片",
    viewerClose: "關閉",
  },
} as const satisfies Record<
  Language,
  {
    title: (name: string) => string;
    lead: string;
    desktop: string;
    inspect: string;
    inspectOpens: string;
    viewerClose: string;
  }
>;

/** Story framing for products whose story is not a landlord's month. */
export const NEUTRAL_STORY_COPY = {
  en: {
    title: (name: string) => `${name}, screen by screen`,
    lead: "Screens from the development build, shown with sample data.",
    desktop: "On a computer",
  },
  vi: {
    title: (name: string) => `${name} qua từng màn hình`,
    lead: "Các màn hình của bản đang phát triển, hiển thị với dữ liệu mẫu.",
    desktop: "Trên máy tính",
  },
  zh: {
    title: (name: string) => `${name} 逐屏一览`,
    lead: "开发版本的各个界面，使用示例数据展示。",
    desktop: "电脑端",
  },
  "zh-hant": {
    title: (name: string) => `${name} 逐屏一覽`,
    lead: "開發版本的各個畫面，使用範例資料展示。",
    desktop: "電腦端",
  },
} as const satisfies Record<
  Language,
  { title: (name: string) => string; lead: string; desktop: string }
>;

/** Sổ Trọ is the one product whose screens tell a landlord's month. */
export const isLandlordStory = (product: string) => product === "sotro";

/** Title, lead and desktop kicker for one product's story. */
export const storyFrame = (lang: Language, product: string) =>
  isLandlordStory(product) ? STORY_COPY[lang] : NEUTRAL_STORY_COPY[lang];

/** The phone derivative next to each master (`<name>-480.webp`). */
export const phoneSmallSrc = (src: string) =>
  src.replace(/\.webp$/, "-480.webp");
/** The desktop derivative next to each master (`<name>-768.webp`). */
export const desktopSmallSrc = (src: string) =>
  src.replace(/\.webp$/, "-768.webp");
