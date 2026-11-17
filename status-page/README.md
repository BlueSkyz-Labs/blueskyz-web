# status.blueskyzlabs.com

Trang tĩnh hai ngôn ngữ, không build, không secret. Kiểm tra từng dịch vụ bằng `fetch(no-cors)` từ trình duyệt khách (phản hồi mờ vẫn chứng tỏ máy chủ trả lời). Giám sát độc lập 24/7 làm bằng UptimeRobot gói miễn phí; trang công khai của UptimeRobot nối qua `monitor_url`.

## Triển khai (Chủ sở hữu, điện thoại làm được)

1. UptimeRobot (miễn phí, 50 monitor, mỗi 5 phút): tạo monitor HTTP cho `https://blueskyzlabs.com/` và từng API sản phẩm khi golive; bật Status Page công khai, copy link vào `monitor_url`. Cho phép gửi cảnh báo qua email.
2. Cloudflare → Workers & Pages → tạo project từ repo `blueskyz-web`, thư mục gốc `status-page`, không build command, static assets. Gắn domain `status.blueskyzlabs.com`. Hạ tầng đi qua Workers Builds như phần còn lại (miễn phí trong gói hiện có).
3. Không đặt trang này sau Cloudflare Access, vì khách cần xem được khi dịch vụ gặp sự cố.

## Vận hành

- Thêm dịch vụ: thêm một dòng vào `components.json` (chỉ URL công khai).
- Ghi sự cố: thêm phần tử vào `incidents` (giờ GMT+7), mở PR như mọi thay đổi khác; sửa khi đã giải quyết.
- Đây là bản cho giai đoạn đầu. Nếu khách tăng và cần thông báo cho người đăng ký, mới tính tới dịch vụ trả phí.

## Cấu hình triển khai

`wrangler.toml` và `.assetsignore` trong thư mục này sẵn sàng cho Workers Builds (root directory `status-page`, deploy command `npx wrangler deploy`). Domain `status.blueskyzlabs.com` được gắn tự động theo `[[routes]]`. Agent không triển khai trực tiếp từ phiên làm việc; Chủ sở hữu tạo project Workers Builds một lần.
