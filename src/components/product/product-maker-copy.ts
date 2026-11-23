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
        "Tối cuối tháng, ở nhiều nhà có phòng cho thuê, đèn bàn sáng lâu hơn thường lệ. Trên bàn là cuốn tập học trò đã quăn mép, chiếc máy tính bỏ túi và mấy tấm ảnh đồng hồ điện chụp vội. Chủ nhà cộng từng khoản cho từng phòng, rồi nhắn từng người thuê. Lệch một số điện là sáng mai có một cuộc gọi khó nói.",
        "YENLUME bắt đầu từ chiếc bàn ấy. Cuốn sổ vẫn còn đó, giờ nằm trong điện thoại: chữ to, nút lớn, mở ra là thấy ai đã đóng, ai chưa. Phép cộng để máy làm. Cha mẹ lớn tuổi tự mở, tự ghi được, không cần ai ngồi bên chỉ.",
        "Xong việc, đèn tắt sớm hơn một chút.",
      ],
      house: "YENLUME là một sản phẩm của BlueSkyz Labs",
    },
    en: {
      author: "tony-nguyen",
      heading: "Who makes it",
      story: [
        "On the last evenings of the month, in many homes with rooms to let, the desk lamp stays on later than usual. On the desk are a dog-eared exercise book, a pocket calculator and a few quick photos of the electricity meters. The landlord adds up each charge for each room, then messages each tenant. One wrong meter reading means an awkward phone call in the morning.",
        "YENLUME starts at that desk. The book is still there, now on a phone: large text, big buttons, and a first screen that shows who has paid and who has not. The app does the adding up. An older parent can open it and keep the book on their own, without someone sitting beside them to show how.",
        "With the work done, the lamp goes off a little earlier.",
      ],
      house: "YENLUME is a BlueSkyz Labs product",
    },
    zh: {
      author: "tony-nguyen",
      heading: "制作者",
      story: [
        "月底的晚上，许多有房出租的人家，台灯总比平时亮得久。桌上放着一本卷了边的练习本、一个小计算器，还有几张匆忙拍下的电表照片。房东一间一间、一项一项地算，再逐个给租客发消息。电表差了一度，第二天早上就多一通不好开口的电话。",
        "YENLUME 就是从这张桌子开始的。账本还在，只是搬进了手机：字大、按钮大，一打开就能看到谁交了、谁还没交。加法交给手机来做。上了年纪的父母自己就能打开、自己记账，不用旁人在身边教。",
        "事情做完，灯也能早一点关。",
      ],
      house: "YENLUME 是 BlueSkyz Labs 的产品",
    },
    "zh-hant": {
      author: "tony-nguyen",
      heading: "製作者",
      story: [
        "月底的晚上，許多有房出租的人家，檯燈總比平常亮得久。桌上放著一本捲了邊的作業簿、一台小計算機，還有幾張匆忙拍下的電表照片。房東一間一間、一筆一筆地算，再逐一傳訊息給房客。電表差了一度，隔天早上就多一通不好開口的電話。",
        "YENLUME 就是從這張桌子開始的。帳本還在，只是搬進了手機：字大、按鈕大，一打開就能看到誰繳了、誰還沒繳。加法交給手機來做。上了年紀的爸媽自己就能打開、自己記帳，不用旁人在身邊教。",
        "事情做完，燈也能早一點關。",
      ],
      house: "YENLUME 是 BlueSkyz Labs 的產品",
    },
  },
};
