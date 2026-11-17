# Chuẩn bị tài sản đăng cửa hàng / Store listing prep (Sổ Trọ, mobile)

Soạn 2026-11-17. Tình trạng: Apple Developer đã có; Google Play Console chưa kiểm tra người dự phòng và mã khôi phục. Pipeline build/submit/review đã có qua Expo. Mục này chuẩn bị ảnh và chữ. **Chưa nộp gì**; nộp bản là hành động của Chủ sở hữu sau khi Sổ Trọ qua cổng "paid ready".

## 1. Hồ sơ bắt buộc (không bịa, Chủ sở hữu hoặc sản phẩm cung cấp)

| Mục                            | Apple App Store                           | Google Play                | Nguồn                                                                                                           |
| ------------------------------ | ----------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Tên (≤30 ký tự)                | Sổ Trọ                                    | Sổ Trọ                     | thương hiệu                                                                                                     |
| Phụ đề / mô tả ngắn            | ≤30 ký tự                                 | ≤80 ký tự                  | viết bên dưới                                                                                                   |
| Mô tả đầy đủ                   | ≤4000                                     | ≤4000                      | viết bên dưới                                                                                                   |
| Từ khóa                        | ≤100 ký tự                                | không có                   | `[[chọn]]`                                                                                                      |
| URL quyền riêng tư             | bắt buộc                                  | bắt buộc                   | `https://blueskyzlabs.com/vi/privacy/` chỉ cho web; **cần trang quyền riêng tư riêng của Sổ Trọ** (chờ luật sư) |
| URL hỗ trợ                     | bắt buộc                                  | bắt buộc                   | `https://blueskyzlabs.com/vi/support/`                                                                          |
| Phân loại tuổi                 | bảng câu hỏi                              | bảng IARC                  | không nội dung nhạy cảm                                                                                         |
| Khai báo dữ liệu               | App Privacy                               | Data safety                | theo luồng dữ liệu thật; có CCCD → khai đúng                                                                    |
| Thông tin người bán            | tên + địa chỉ hiển thị công khai (DSA/VN) | tương tự                   | `docs/drafts/terms-of-use-draft.md` bảng người bán                                                              |
| Tài khoản demo cho người duyệt | bắt buộc nếu cần đăng nhập                | bắt buộc nếu cần đăng nhập | Chủ sở hữu tạo, không ghi vào repo                                                                              |

## 2. Ảnh (kích thước hiện hành, kiểm tra lại với tài liệu cửa hàng trước khi nộp)

- **iPhone 6.9"**: 1320×2868 (hoặc 1290×2796), 3–10 ảnh. **iPad 13"** nếu hỗ trợ iPad: 2064×2752.
- **Google Play**: ảnh điện thoại 2–8 (cạnh ngắn ≥320 px, tỷ lệ tối đa 2:1), **icon 512×512 PNG**, **feature graphic 1024×500**.
- Icon iOS 1024×1024 không alpha, không bo góc (cửa hàng tự bo).
- Dùng Brand Kit v5 trong `/mnt/project-files/brand-v5/kit/` (emblem, tokens, phông Noto Serif Display / Inter / IBM Plex Mono). Mỗi sản phẩm giữ logo riêng của mình. Ảnh màn hình phải là **ảnh thật từ build thật** (quy tắc: không bịa ảnh). Có thể chụp bằng Expo simulator (`simulator_start`, `automation_take_screenshot`) khi bản build ổn định.

## 3. Bộ ảnh đề xuất (kể một câu chuyện, mỗi ảnh một ý)

1. "Cả khu trọ trong một màn hình." (tổng quan phòng)
2. "Ghi điện nước trong 10 giây." (nhập chỉ số)
3. "Hóa đơn gửi đi, tiền về đúng chỗ." (thu tiền; chỉ khi tính năng thật sự có)
4. "Biết ai còn nợ, không cần đòi bằng lời." (công nợ)
5. "Dữ liệu của bạn, của riêng bạn." (quyền riêng tư)

Ý trên chỉ là khung kể chuyện. Mỗi câu chỉ dùng khi tính năng đó có thật trong bản phát hành; nếu chưa có, bỏ ảnh đó. Câu cuối cùng do người viết bản địa chỉnh trước khi nộp (quy tắc nội dung công khai).

## 4. Chữ nháp (VI)

**Phụ đề (≤30):** Sổ tay của chủ trọ
**Mô tả ngắn Play (≤80):** Quản lý phòng trọ, điện nước và tiền thuê gọn trong một ứng dụng.
**Mở đầu mô tả:**

> Làm chủ trọ đã đủ bận. Sổ Trọ gom phòng, người thuê, chỉ số điện nước và tiền thuê vào một chỗ, để cuối tháng bạn không phải lục lại từng tờ giấy.
>
> [[Liệt kê chỉ các tính năng có thật trong bản này.]]
> Giá và gói: [[điền từ bảng giá chính thức]]. Thanh toán qua Apple hoặc payOS tùy nơi bạn mua. Điều khoản: blueskyzlabs.com/terms. Quyền riêng tư: [[URL]].

(Bản EN do người rà. Viết lại nếu cần, giữ "kể chuyện, không khoe".)

## 5. Việc kỹ thuật còn lại

- [ ] Bản build release qua Expo (`build_run`, profile production) sau khi `PAID_ORDERS_ENABLED` được Chủ sở hữu bật.
- [ ] Biến môi trường hiển thị thanh toán đúng cửa hàng (Apple IAP cho iOS; payOS không được dùng để mở khóa nội dung số trên iOS, kiểm tra điều khoản Apple 3.1.1).
- [ ] TestFlight nội bộ → kiểm tra trên máy thật (Chủ sở hữu bấm cài, không cần làm gì thêm).
- [ ] Google Play: tài khoản dự phòng, mã khôi phục, kiểm tra thử nghiệm đóng 14 ngày với ≥12 người (quy định tài khoản cá nhân mới; kiểm tra lại, có thể áp dụng cho tài khoản tổ chức khác).

## 6. Lưu ý Apple (kiểm tra bản mới nhất trước khi nộp)

Điều 3.1.1: nội dung số bán trong app iOS phải qua In-App Purchase; payOS chỉ dùng cho nội dung không thuộc diện đó hoặc ngoài app theo quy định hiện hành. Quyết định mô hình thanh toán trên iOS thuộc luật sư và Chủ sở hữu, không phải agent.
