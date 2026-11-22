/**
 * Art for the 2026-11-22 YENLUME posts. The lead image composes real Sổ Trọ screenshots
 * already published on the product page (captured 2026-09-30 from a test build
 * with sample data, as the post says); the infographic restates the post body.
 */
import { readFileSync } from "node:fs";
import { COBALT, HATCH_DEFS, INK, TINT, page } from "../art-base.mjs";
import { stampHtml } from "../stamp.mjs";

const YEAR = 2026;
const SHOTS = new URL(
  "../../../public/products/sotro/showcase/",
  import.meta.url,
).href;
const MARK = readFileSync(
  new URL(
    "../../../public/brand/blueskyz/v4/products/sotro.svg",
    import.meta.url,
  ),
  "utf8",
).replace(/<svg /, '<svg class="ig__mark" ');

const POSTS = {
  "yenlume-so-tro-cho-chu-nha-tro": {
    vi: {
      heroTitle: "YENLUME trên điện thoại và máy tính",
      kicker: "Tóm tắt bài viết",
      title: "YENLUME: Sổ Trọ cho chủ nhà trọ",
      deck: "Sổ ghi tiền trọ chữ to cho chủ nhà trọ ở Việt Nam.",
      points: [
        [
          "Phiếu ghi từng khoản",
          "Tiền phòng, điện, nước, các khoản khác; có mã VietQR.",
        ],
        [
          "Chốt sổ cả dãy",
          "Nhập số từng phòng rồi chốt một lượt; gửi cả dãy từ gói Sân.",
        ],
        [
          "Xem lại trước khi lưu",
          "Màn hình xác nhận nhắc số tiền, phòng và cách thu.",
        ],
        ["Chữ to, nút lớn", "Chế độ sáng và tối; bốn ngôn ngữ."],
      ],
      statusHead: "Các gói",
      status: [
        ["Hiên", "Miễn phí đến 15 phòng."],
        [
          "Sân, Ngõ, Khu",
          "99.000đ, 199.000đ, 499.000đ mỗi tháng (giá sáng lập), đến 50, 200, 500 phòng.",
        ],
      ],
      footer:
        "Bản web đang xem trước, số lượng có hạn. Ảnh chụp từ bản chạy thử, dữ liệu mẫu.",
    },
    en: {
      heroTitle: "YENLUME on phone and desktop",
      kicker: "Article summary",
      title: "YENLUME: Sổ Trọ, a rent book",
      deck: "A large-text rent book for landlords in Vietnam.",
      points: [
        [
          "Itemised receipts",
          "Rent, electricity, water and other charges, with a VietQR code.",
        ],
        [
          "One close for the row",
          "Enter each room, then close once; whole-row sending from Sân.",
        ],
        [
          "Review before saving",
          "The confirmation screen repeats amount, room and method.",
        ],
        ["Large text, big buttons", "Light and dark mode; four languages."],
      ],
      statusHead: "Plans",
      status: [
        ["Hiên", "Free up to 15 rooms."],
        [
          "Sân, Ngõ, Khu",
          "99,000, 199,000 and 499,000 VND a month (founding price), up to 50, 200, 500 rooms.",
        ],
      ],
      footer:
        "The web version is in preview, in limited numbers. Screenshots are from a test build with sample data.",
    },
  },
  "mau-phieu-thu-tien-phong-tro": {
    vi: {
      heroTitle: "Phiếu thu trong YENLUME",
      kicker: "Tóm tắt bài viết",
      title: "Mẫu phiếu thu tiền phòng trọ",
      deck: "Một phiếu đủ dùng gồm bốn nhóm mục.",
      points: [
        [
          "Người thuê và kỳ thu",
          "Nhà trọ, số phòng, tên thường gọi, tháng và ngày chốt số.",
        ],
        [
          "Từng khoản",
          "Tiền phòng, điện, nước, rác, internet, giữ xe; ghi số cũ, số mới, đơn giá.",
        ],
        ["Tổng tiền", "Ghi bằng số, có đơn vị đồng."],
        [
          "Hạn và cách đóng",
          "Tiền mặt hoặc chuyển khoản, kèm mã QR; ghi nợ kỳ trước nếu có.",
        ],
      ],
      statusHead: "Lưu ý",
      status: [
        ["Đơn giá", "Theo hợp đồng thuê và quy định hiện hành."],
        [
          "Điều chỉnh",
          "Phiếu đã chốt thì ghi thêm dòng điều chỉnh, không sửa lặng lẽ.",
        ],
      ],
      footer: "Mẫu tham khảo, không phải tư vấn pháp lý hay thuế.",
    },
    en: {
      heroTitle: "A receipt in YENLUME",
      kicker: "Article summary",
      title: "A boarding-room rent receipt",
      deck: "A usable receipt has four groups of parts.",
      points: [
        [
          "Tenant and period",
          "House, room, a known name, month and the date of the readings.",
        ],
        [
          "Each charge",
          "Rent, electricity, water, rubbish, internet, parking; old and new readings, unit price.",
        ],
        ["Total", "In figures, with the currency."],
        [
          "Due date and payment",
          "Cash or transfer, with a QR code; any balance from the last period.",
        ],
      ],
      statusHead: "Notes",
      status: [
        ["Unit price", "Follows the tenancy agreement and the rules in force."],
        [
          "Corrections",
          "A closed receipt gets a correction line, not a quiet edit.",
        ],
      ],
      footer: "A reference template, not legal or tax advice.",
    },
  },
};

function hero() {
  const W = 1600,
    H = 900;
  const css = `
  .bg { position: absolute; inset: 0; }
  .desk { position: absolute; left: 90px; top: 120px; width: 940px; border-radius: 16px; overflow: hidden; background: #fff;
    border: 3px solid ${INK}; box-shadow: 18px 18px 0 rgba(11,16,32,0.10); }
  .desk__bar { height: 34px; display: flex; align-items: center; gap: 9px; padding: 0 14px; border-bottom: 2px solid ${INK}; background: ${TINT}; }
  .desk__bar i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid ${INK}; }
  .desk img { display: block; width: 100%; }
  .phone { position: absolute; width: 300px; padding: 12px; border-radius: 44px; background: ${INK}; box-shadow: 18px 18px 0 rgba(11,16,32,0.12); }
  .phone img { display: block; width: 100%; border-radius: 32px; }
  .p1 { left: 1000px; top: 150px; transform: rotate(-3deg); }
  .p2 { left: 1230px; top: 70px; transform: rotate(4deg); }
  `;
  const bg = `<svg class="bg" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>${HATCH_DEFS}</defs>
    <rect width="${W}" height="${H}" fill="${TINT}"/>
    <rect width="${W}" height="${H}" fill="url(#h-fine)" opacity="0.08"/>
    <circle cx="1180" cy="460" r="330" fill="none" stroke="${COBALT}" stroke-width="3" stroke-dasharray="2 12"/>
    <path d="M40 820H1560" stroke="${INK}" stroke-width="3"/><rect x="40" y="824" width="1520" height="40" fill="url(#h-diag)" opacity="0.3"/></svg>`;
  const body = `${bg}
  <div class="desk"><div class="desk__bar"><i></i><i></i><i></i></div><img src="${SHOTS}mgr-02-payments.webp" alt=""></div>
  <div class="phone p1"><img src="${SHOTS}op-01-home.webp" alt=""></div>
  <div class="phone p2"><img src="${SHOTS}op-02-payments.webp" alt=""></div>
  ${stampHtml({ year: YEAR, position: "left: 6%; bottom: 13%;" })}`;
  return page({ width: W, height: H, css, body });
}

function infographic(t) {
  const W = 1200,
    H = 1260;
  const css = `
  .ig { position: absolute; inset: 0; padding: 72px 80px 200px; display: flex; flex-direction: column; gap: 34px; }
  .ig__top { display: grid; grid-template-columns: auto 1fr; gap: 28px; align-items: center; }
  .ig__mark { width: 104px; height: 104px; display: block; border-radius: 24px; }
  .ig__kicker { font-size: 20px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: ${COBALT}; }
  .ig__title { font-size: 56px; font-weight: 750; letter-spacing: -0.025em; line-height: 1.08; margin-top: 8px; }
  .ig__deck { font-size: 26px; color: #334155; margin-top: 8px; }
  .ig__rule { height: 4px; background: ${INK}; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
  .pt { border: 2px solid ${INK}; border-radius: 18px; padding: 28px; background: #fff; display: grid; grid-template-columns: 56px 1fr; gap: 18px; }
  .pt__n { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; font-size: 26px; font-weight: 800; color: #fff; background: ${COBALT}; }
  .pt__h { font-size: 25px; font-weight: 750; line-height: 1.25; } .pt__t { font-size: 21px; line-height: 1.45; color: #334155; margin-top: 8px; }
  .st__h { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; margin-bottom: 14px; }
  .st { display: grid; gap: 14px; } .st__row { display: grid; grid-template-columns: 200px 1fr; gap: 20px; align-items: baseline; padding: 18px 0; border-top: 1px solid rgba(11,16,32,0.2); }
  .st__k { font-size: 24px; font-weight: 750; } .st__v { font-size: 22px; line-height: 1.45; color: #334155; }
  .ig__foot { margin-top: auto; font-size: 17px; line-height: 1.45; color: #475569; }
  `;
  const body = `<div class="ig">
    <div class="ig__top">${MARK}<div><p class="ig__kicker">${t.kicker}</p><h1 class="ig__title">${t.title}</h1><p class="ig__deck">${t.deck}</p></div></div>
    <div class="ig__rule"></div>
    <div class="grid">${t.points.map(([h, s], i) => `<div class="pt"><span class="pt__n">${i + 1}</span><div><p class="pt__h">${h}</p><p class="pt__t">${s}</p></div></div>`).join("")}</div>
    <div><p class="st__h">${t.statusHead}</p><div class="st">${t.status.map(([k, v]) => `<div class="st__row"><span class="st__k">${k}</span><span class="st__v">${v}</span></div>`).join("")}</div></div>
    <p class="ig__foot">${t.footer}</p>
  </div>${stampHtml({ year: YEAR, position: "left: 50%; bottom: 64px; transform: translateX(-50%);" })}`;
  return page({ width: W, height: H, css, body });
}

export const FIGURES = Object.entries(POSTS).flatMap(([post, T]) =>
  ["vi", "en"].flatMap((lang) => [
    {
      post,
      lang,
      name: "hero",
      width: 1600,
      height: 900,
      year: YEAR,
      title: T[lang].heroTitle,
      html: () => hero(),
    },
    {
      post,
      lang,
      name: "infographic",
      width: 1200,
      height: 1260,
      year: YEAR,
      title: T[lang].title,
      html: () => infographic(T[lang]),
    },
  ]),
);
