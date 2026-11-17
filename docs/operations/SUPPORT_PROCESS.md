# Hộp thư hỗ trợ và quy trình trả lời / Support mailbox and reply process

Soạn 2026-11-17. Miễn phí: Cloudflare Email Routing, chưa cần helpdesk. Một người vận hành (Chủ sở hữu) cộng AI soạn nháp; AI không tự gửi.

## 1. Địa chỉ (đúng danh sách `src/lib/public-mailbox.ts`)

| Địa chỉ                     | Dùng cho                                                   | Chuyển tới                |
| --------------------------- | ---------------------------------------------------------- | ------------------------- |
| `support@blueskyzlabs.com`  | Khách hỏi về ứng dụng, thanh toán, hoàn tiền               | Hộp thư của Chủ sở hữu    |
| `privacy@blueskyzlabs.com`  | Xuất/xóa dữ liệu, câu hỏi quyền riêng tư                   | cùng hộp thư, nhãn riêng  |
| `security@blueskyzlabs.com` | Báo lỗ hổng (đã có kênh GitHub riêng tư trên `/security/`) | cùng hộp thư, ưu tiên cao |
| `hello@blueskyzlabs.com`    | Hợp tác, câu hỏi chung                                     | cùng hộp thư              |

## 2. Cài đặt (Chủ sở hữu, khoảng 5 phút, điện thoại làm được)

1. Cloudflare → `blueskyzlabs.com` → Email → Email Routing → bật (thêm MX/TXT tự động). Miễn phí.
2. Custom addresses: tạo 4 địa chỉ ở bảng trên, đích là hộp thư đã xác minh của anh.
3. Đã có `SITE.supportEmail`? Trang `/support/` tự đổi nút chính sang `mailto:` khi build var công khai `PUBLIC_SUPPORT_EMAIL` có giá trị `support@blueskyzlabs.com` (xem `src/data/site.ts`). Đây là biến công khai, không phải secret.
4. Để trả lời từ chính địa chỉ `support@`: Gmail → Cài đặt → Tài khoản → "Gửi thư dưới tên" (SMTP của Gmail, hoặc dùng Cloudflare Email Sending khi có). Chưa thiết lập thì trả lời từ hộp thư thường và ghi rõ "BlueSkyz Labs Support".
5. Tạo nhãn Gmail: `support`, `privacy`, `security`, `đã xong`. Bộ lọc tự gắn nhãn theo địa chỉ nhận.

## 3. Cam kết trả lời (đừng hứa quá khả năng của một người)

| Loại                              | Phản hồi đầu          | Giải quyết                |
| --------------------------------- | --------------------- | ------------------------- |
| Thanh toán lỗi, tính tiền hai lần | trong 1 ngày làm việc | 3 ngày làm việc           |
| Hoàn tiền                         | trong 2 ngày làm việc | theo Terms mục 7          |
| Quyền dữ liệu (xuất/xóa)          | trong 2 ngày làm việc | luật định, tối đa 30 ngày |
| Bảo mật                           | trong 1 ngày làm việc | theo `SECURITY.md`        |
| Câu hỏi thường                    | trong 3 ngày làm việc | 7 ngày                    |

Giờ làm việc ghi theo GMT+7. Ngoài giờ, trang `/support/` ghi rõ thời gian phản hồi dự kiến.

## 4. Quy trình mỗi thư (5 bước)

1. **Nhận.** Bộ lọc gắn nhãn. Tránh yêu cầu khách gửi CCCD, mật khẩu hoặc ảnh thẻ; nếu khách lỡ gửi, xóa khỏi thư và dặn họ đừng gửi lại.
2. **Phân loại.** Thanh toán / dữ liệu / lỗi / bảo mật / khác.
3. **AI soạn nháp** (lane free hoặc Claude, theo FinOps). Chỉ đưa vào nội dung đã bỏ thông tin cá nhân. Nháp luôn do con người đọc và gửi. Không có "gửi tự động".
4. **Trả lời** bằng ngôn ngữ của khách, giọng ấm, ngắn, nói rõ bước tiếp theo.
5. **Đóng.** Gắn `đã xong`. Mỗi tuần xem lại thư mở quá hạn; lỗi lặp lại ba lần thì mở issue trong repo sản phẩm.

## 5. Mẫu trả lời (VI / EN)

**Đã nhận**

> Chào bạn, BlueSkyz Labs đã nhận thư của bạn. Mình sẽ phản hồi trong [[số]] ngày làm việc. Nếu việc gấp (tính tiền sai, không vào được tài khoản), bạn trả lời thư này và ghi "GẤP" ở đầu.
>
> Hello, BlueSkyz Labs has your message and will reply within [[n]] working days. If it is urgent (a wrong charge, locked out), reply and put "URGENT" first.

**Hoàn tiền được chấp nhận**

> Chào bạn, mình đã duyệt hoàn tiền cho đơn [[mã]]. Số tiền sẽ về phương thức bạn đã dùng, thường trong [[7–14]] ngày làm việc tùy ngân hàng. Cảm ơn bạn đã thử, và nếu có điều gì chưa vừa ý, mình rất muốn nghe.
>
> Hi, your refund for order [[code]] is approved. It returns to the payment method you used, usually within [[7–14]] working days depending on your bank. Thank you for trying us; if something fell short, we would like to hear it.

**Mua qua Apple/Google**

> Chào bạn, khoản này bạn mua qua [[Apple/Google]], nên cửa hàng xử lý hoàn tiền. Bạn vào [[reportaproblem.apple.com / Google Play → Lịch sử đặt hàng]] và gửi yêu cầu. Cần mình hỗ trợ gì thêm, cứ trả lời thư này.

**Yêu cầu xóa dữ liệu**

> Chào bạn, mình đã nhận yêu cầu xóa dữ liệu. Để chắc đúng người, bạn xác nhận giúp mình bằng cách trả lời từ email đã đăng ký. Sau khi xác nhận, mình xử lý trong [[số]] ngày và báo lại bạn.

## 6. Đo và cải thiện

Mỗi tháng đếm ba số: thư nhận, thời gian phản hồi đầu trung bình, thư mở quá hạn. Ghi vào `docs/operations/` hoặc Zenith (FinOps/CX), không ghi nội dung thư.
