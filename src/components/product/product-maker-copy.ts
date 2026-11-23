import type { AuthorId } from "../../data/authors";

/**
 * Copy for the "maker" section of a product profile (Owner decision
 * 2026-11-23: named, no photograph, told from an everyday scene, closing with
 * whose product it is).
 *
 * The scene is the illustrative one already published in the launch post
 * (`yenlume-so-tro-cho-chu-nha-tro`): it describes a common situation, not a
 * specific customer and not an event in the founder's life. Nothing here is a
 * price, a plan or a product claim beyond the profile's own capabilities.
 *
 * The name and role are not written here: the component reads them from the
 * author registry, the only place such a literal may live.
 * No `@/` imports: the Node-run architecture tests load this module.
 */
export type MakerLanguage = "en" | "vi" | "zh" | "zh-hant";

export interface ProductMakerCopy {
  author: AuthorId;
  heading: string;
  story: string[];
  house: string;
}

export const PRODUCT_MAKER_COPY: Record<
  string,
  Record<MakerLanguage, ProductMakerCopy>
> = {
  sotro: {
    vi: {
      author: "tony-nguyen",
      heading: "Người làm ra YENLUME",
      story: [
        "Ý tưởng đến từ một cảnh quen ở nhiều nhà có phòng cho thuê. Cuối tháng, chủ nhà ngồi với cuốn tập, chiếc máy tính bỏ túi và mấy tấm ảnh đồng hồ điện, cộng từng khoản rồi nhắn từng người thuê.",
        "YENLUME được làm để cha mẹ lớn tuổi tự mở, tự ghi được mà không cần ai ngồi bên chỉ. Vì vậy chữ to, nút lớn, và mở ra là thấy ai đã đóng, ai chưa.",
      ],
      house: "YENLUME là một sản phẩm của BlueSkyz Labs",
    },
    en: {
      author: "tony-nguyen",
      heading: "Who makes it",
      story: [
        "The idea comes from a scene many families with rooms to let will know. At the end of the month the landlord sits down with an exercise book, a pocket calculator and a few photos of the electricity meters, adds up each charge and messages each tenant.",
        "YENLUME is built so an older parent can open it and keep the book on their own, without someone sitting beside them to show how. So the text is large, the buttons are big, and the first screen shows who has paid and who has not.",
      ],
      house: "YENLUME is a BlueSkyz Labs product",
    },
    zh: {
      author: "tony-nguyen",
      heading: "制作者",
      story: [
        "想法来自许多有房出租的家庭都熟悉的一幕。月底，房东拿着练习本、小计算器和几张电表照片，一项一项地算，再逐个给租客发消息。",
        "YENLUME 要让上了年纪的父母自己就能打开、自己记账，不用旁人在身边教。所以字大、按钮大，一打开就能看到谁交了、谁还没交。",
      ],
      house: "YENLUME 是 BlueSkyz Labs 的产品",
    },
    "zh-hant": {
      author: "tony-nguyen",
      heading: "製作者",
      story: [
        "想法來自許多有房出租的家庭都熟悉的一幕。月底，房東拿著筆記本、小計算機和幾張電表照片，一筆一筆地算，再逐一傳訊息給房客。",
        "YENLUME 要讓上了年紀的爸媽自己就能打開、自己記帳，不用旁人在身邊教。所以字大、按鈕大，一打開就能看到誰繳了、誰還沒繳。",
      ],
      house: "YENLUME 是 BlueSkyz Labs 的產品",
    },
  },
};
