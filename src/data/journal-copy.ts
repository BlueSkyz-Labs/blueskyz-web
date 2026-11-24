import type { Language } from "@/data/site";

/**
 * v11 Journal index copy. Descriptive UI text only; it makes no product claim.
 * The "every post lists its sources" line was removed (Owner, 2026-10-25);
 * the schema still requires sources on every post. zh / zh-Hant are machine-assisted (O-10.6) and say that
 * posts are published in Vietnamese and English.
 */
export const JOURNAL_COPY: Record<
  Language,
  {
    title: string;
    lede: string;
    news: string;
    product: string;
    empty: string;
    languageNote?: string;
  }
> = {
  en: {
    title: "Journey",
    lede: "News and product updates from BlueSkyz Labs.",
    news: "News and updates",
    product: "Product updates",
    empty: "No posts yet.",
  },
  vi: {
    title: "Hành trình",
    lede: "Tin tức và cập nhật sản phẩm từ BlueSkyz Labs.",
    news: "Tin tức và cập nhật",
    product: "Cập nhật sản phẩm",
    empty: "Chưa có bài viết nào.",
  },
  zh: {
    title: "日志",
    lede: "BlueSkyz Labs 的新闻与产品更新。",
    news: "新闻与动态",
    product: "产品更新",
    empty: "暂无文章。",
    languageNote: "文章以越南语和英语发布。",
  },
  // zh-Hant copy: machine-assisted (OpenCC s2twp), pending native review.
  "zh-hant": {
    title: "日誌",
    lede: "BlueSkyz Labs 的新聞與產品更新。",
    news: "新聞與動態",
    product: "產品更新",
    empty: "暫無文章。",
    languageNote: "文章以越南語和英語發布。",
  },
};

/**
 * Post-page UI strings (Journey P1-A). Only vi and en have post pages: posts
 * are published as VI + EN pairs (design D-3), so zh / zh-Hant have no entry.
 * Owner-directed copy; descriptive labels only, no product claim.
 */
export interface JournalPostCopy {
  published: string;
  updated: string;
  sources: string;
  /** Credit under every journal figure (press standard R1, R3). */
  figureCredit: string;
  /** Heading of the end-of-article summary infographic (press standard R1). */
  summary: string;
  /** Closing rights line; `{year}` is the post's publication year. */
  copyright: string;
  aboutAuthor: string;
  backToJournal: string;
  rss: string;
}

export const JOURNAL_POST_COPY: Record<"vi" | "en", JournalPostCopy> = {
  vi: {
    published: "Đăng ngày",
    updated: "Cập nhật",
    sources: "Nguồn",
    figureCredit: "Hình ảnh: BlueSkyz Labs",
    summary: "Tóm tắt",
    copyright: "© {year} BlueSkyz Labs. Bảo lưu mọi quyền.",
    aboutAuthor: "Về tác giả",
    backToJournal: "Tất cả bài viết",
    rss: "RSS",
  },
  en: {
    published: "Published",
    updated: "Updated",
    sources: "Sources",
    figureCredit: "Image: BlueSkyz Labs",
    summary: "In brief",
    copyright: "© {year} BlueSkyz Labs. All rights reserved.",
    aboutAuthor: "About the author",
    backToJournal: "All posts",
    rss: "RSS",
  },
};

/**
 * Journey card rail (Owner 2026-11-24): control labels for the swipeable
 * card row and its preview dialog. Only vi and en list posts, so zh / zh-Hant
 * never render the rail. Descriptive UI labels only, no product claim.
 */
export interface JournalRailCopy {
  /** Accessible name of the "scroll back" control. */
  previous: string;
  /** Accessible name of the "scroll on" control. */
  next: string;
  /** Accessible name of the preview dialog's close control. */
  close: string;
  /** Link from the preview to the full post. */
  read: string;
}

export const JOURNAL_RAIL_COPY: Record<"vi" | "en", JournalRailCopy> = {
  vi: {
    previous: "Xem bài trước",
    next: "Xem bài sau",
    close: "Đóng",
    read: "Đọc bài viết",
  },
  en: {
    previous: "Previous posts",
    next: "More posts",
    close: "Close",
    read: "Read the post",
  },
};
