# Analytics ẩn danh, tổng hợp / Anonymous aggregate analytics — kế hoạch

Soạn 2026-11-17. Phạm vi: chỉ kế hoạch và ràng buộc. Chưa bật gì mới ngoài những gì `/privacy/` đã công bố. Tính năng mới cần Chủ sở hữu duyệt (FPD-2026-011 đã hoãn phần đếm người dùng).

## Hiện có (đã công khai trong `/privacy/`)

- Cloudflare Web Analytics: không cookie, không lưu bộ nhớ, đo tốc độ tải trang; Cloudflare giữ dữ liệu gốc 7 ngày rồi mẫu 10%.
- Cloudflare Zone Analytics: lượt xem và băng thông theo vùng, không cá nhân hóa.
- `src/lib/analytics.ts`: phân loại sự kiện đã định nghĩa, **truyền đi đang TẮT** (không network, không storage). Giữ nguyên.

## Hỏi cần trả lời được ở golive (chỉ số tổng hợp)

1. Có bao nhiêu lượt xem trang công khai theo ngôn ngữ và theo trang? (Zone Analytics đủ)
2. Bao nhiêu người mở trang sản phẩm rồi bấm "Tải"/"Dùng thử"? (cần đếm sự kiện)
3. Trang nào khách rời đi sớm? (Web Analytics đủ ở mức trang)
4. Sổ Trọ: bao nhiêu tài khoản kích hoạt, bao nhiêu còn dùng sau 7/30 ngày? (phía sản phẩm, không nằm ở website)

## Thiết kế ràng buộc (an toàn mặc định)

- Không cookie, không ID cố định, không IP lưu, không dấu vân tay. Không đưa bên thứ ba vào trang.
- Đếm tại biên Cloudflare, chỉ ghi `{ngày, trang, ngôn ngữ, loại sự kiện}`, cộng dồn. Không lưu từng lượt truy cập.
- Phương án khuyến nghị cho (2): một Worker nhỏ `POST /e` nhận tên sự kiện thuộc danh sách trắng của `ANALYTICS_EVENTS`, tăng bộ đếm theo ngày bằng **Workers Analytics Engine** (miễn phí trong gói Workers hiện có, tổng hợp theo thiết kế). Không dùng D1/KV cho dữ liệu khách.
  - Cần **tài nguyên Cloudflare mới** và thay đổi `/privacy/` → là tính năng mới, **chờ Chủ sở hữu duyệt** trước khi viết code.
- Sổ Trọ (mục 4): đếm tài khoản bằng truy vấn tổng hợp phía máy chủ (COUNT theo ngày), không gửi nội dung. Sentry vẫn tắt vì dữ liệu CCCD.
- Hiển thị trong Zenith (đọc, qua PDC 1.0 kéo dữ liệu), không có nút sửa.

## Cổng duyệt trước khi bật

- [ ] Chủ sở hữu duyệt phương án Analytics Engine.
- [ ] `/privacy/` (4 ngôn ngữ) cập nhật cùng PR, luật sư rà.
- [ ] Test âm tính: gửi tên sự kiện ngoài danh sách, thuộc tính tự do, thuộc tính có email → bị từ chối.
- [ ] Đọc lại sau deploy bằng trình duyệt thật: không có cookie, không có yêu cầu tới bên thứ ba.

## Trạng thái triển khai (2026-11-17)

- **Đã có (PR này):** `workers/analytics/`, Worker `blueskyz-analytics` nhận `POST blueskyzlabs.com/_e`, kiểm tra danh sách trắng giống `src/lib/analytics.ts`, ghi một điểm dữ liệu tổng hợp vào Workers Analytics Engine (dataset `blueskyz_events`, index chỉ là ngày UTC). Không đọc IP, user agent, cookie, referrer. Có test âm tính (13 ca). Dùng đường dẫn cùng origin nên không cần sửa CSP.
- **Chưa bật:** client chưa gửi gì; `src/lib/analytics.ts` vẫn tắt truyền. Cần PR tiếp theo (client `sendBeacon` + cập nhật `/privacy/` 4 ngôn ngữ + test hiển thị), có thể chạm đường dẫn protected nên cần nhãn `owner-approved` của Chủ sở hữu.
- **Triển khai Worker:** Workers Builds, root `workers/analytics`, deploy `npx wrangler deploy`. Analytics Engine miễn phí trong gói Workers hiện có. Chưa deploy.
- Đọc số liệu: Cloudflare dashboard (Analytics Engine SQL API) → hiển thị trong Zenith sau.
