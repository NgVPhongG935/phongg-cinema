# Thiết kế: VNPay/MoMo, đánh giá phim, email vé, cast mobile

**Ngày:** 2026-07-30  
**Trạng thái:** Đã implement (2026-07-30)  
**Dự án:** QLBVXP — PhongG Cinema

---

## 1. Mục tiêu

Bổ sung 4 tính năng cho hệ thống đặt vé hiện có:

| # | Tính năng | Mô tả ngắn |
|---|-----------|------------|
| 1 | Cast trên app mobile | Hiển thị Đạo diễn + Diễn viên như web |
| 2 | Email xác nhận vé | Gửi email khi vé chuyển sang PAID |
| 3 | Đánh giá / comment phim | Rating 1–5 + nội dung, hiển thị trên web + app |
| 4 | VNPay + MoMo sandbox | Thanh toán cổng thật, callback/IPN, tự động PAID |

**Quyết định thanh toán (user):** Đã có **cả VNPay và MoMo sandbox** (`TmnCode` / `partnerCode`).

### Chuyển khoản thủ công (đã cấu hình)

| Kênh | Chi tiết |
|------|----------|
| **MB Bank VietQR** | STK `2100609032005` · NGUYEN VU PHONG |
| **MoMo** | Mã nhận tiền (QR) · NGUYEN VU PHONG |

Ảnh QR: `frontend/public/payment/` (web), `mobile/assets/payment/` (app).


---

## 2. Thứ tự triển khai

1. **Cast mobile** — không phụ thuộc, rủi ro thấp  
2. **Email vé** — cần SMTP; không phụ thuộc gateway  
3. **Đánh giá phim** — độc lập  
4. **VNPay + MoMo** — phụ thuộc credential sandbox; kết nối email khi PAID qua gateway  

Mỗi bước merge được, test được riêng.

---

## 3. Cast trên app mobile

### Phạm vi

- File: `mobile/app/movie/[id]/index.tsx`
- Dữ liệu: `phim.daoDien`, `phim.dienVien[]` từ `GET /movies/{id}` (đã có)

### UI

- Block **Đạo diễn** (1 dòng)
- Block **Diễn viên** (badge/chip, giống web)
- Style: `theme.accent`, nền card tối — đồng bộ với app hiện tại

### Không làm

- Không đổi backend
- Không thêm tìm kiếm cast trên app (đã có API list phim)

---

## 4. Email xác nhận vé

### Khi gửi

Gửi **một lần** khi `Ticket.trangThai` chuyển sang `PAID`:

- Callback VNPay/MoMo thành công
- Admin `POST /tickets/admin/{id}/confirm-payment` (CK thủ công)

### Công nghệ

- `spring-boot-starter-mail`
- Cấu hình qua env / `application.properties`:
  - `spring.mail.host`, `port`, `username`, `password`
  - `app.mail.from=PhongG Cinema <noreply@...>`

### Nội dung email (HTML)

- Logo/tên PhongG Cinema
- Tên phim, rạp, phòng, ngày/giờ chiếu (join từ `Showtime` + `Cinema`)
- Ghế, combo (nếu có)
- Tổng tiền, mã giảm giá (nếu có)
- Mã vé, link «Xem vé» (`https://<frontend>/my-tickets`) hoặc mã QR text
- Lưu ý: mang QR khi vào rạp

### Kiến trúc

```
TicketService / PaymentCallback
  → capNhatTrangThaiPaid(ve)
  → EmailService.guiXacNhanVeAsync(veId)  // @Async, không block IPN
```

### Xử lý lỗi

- Gửi email fail → log WARN, **không** rollback PAID
- Trường tùy chọn `emailSentAt` trên `Ticket` (tránh gửi trùng)

### Không làm (v1)

- Email khi PENDING / USED
- Template đa ngôn ngữ

---

## 5. Đánh giá / comment phim

### Model `MovieReview` (collection `movie_reviews`)

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| id | String | Mongo ID |
| maPhim | String | |
| maNguoiDung | String | |
| hoTen | String | snapshot từ User |
| diem | int | 1–5 |
| noiDung | String | max 500 ký tự |
| ngayTao | LocalDateTime | |
| ngayCapNhat | LocalDateTime | optional |

**Ràng buộc:** 1 review / user / phim → `POST` upsert (sửa nếu đã có).

**Quyền review (v1):** Mọi CUSTOMER đã đăng nhập. *(Tùy chọn v2: chỉ user có vé PAID/USED cho phim đó.)*

### API

| Method | Path | Auth | Mô tả |
|--------|------|------|-------|
| GET | `/api/v1/movies/{id}/reviews` | Public | Phân trang, sort mới nhất |
| GET | `/api/v1/movies/{id}/reviews/summary` | Public | `diemTrungBinh`, `soLuong` |
| POST | `/api/v1/movies/{id}/reviews` | CUSTOMER | Body: `diem`, `noiDung` |
| DELETE | `/api/v1/movies/{id}/reviews/me` | CUSTOMER | Xóa review của mình |

### UI Web

- `MovieDetailPage.jsx`: section dưới mô tả
  - Điểm trung bình + số lượt
  - Form (nếu đã login): sao + textarea + Gửi
  - Danh sách comment

### UI App

- Cùng section trên `mobile/app/movie/[id]/index.tsx`

### Không làm (v1)

- Admin duyệt comment
- Reply thread
- Report / spam filter phức tạp

---

## 6. Thanh toán VNPay + MoMo (sandbox)

### Luồng chung

```
User chọn VNPay hoặc MoMo trên Payment
  → POST /bookings/create-ticket (PENDING) — giữ như hiện tại
  → POST /payments/vnpay/create { maVe, tongTien }
     hoặc POST /payments/momo/create { maVe, tongTien }
  → Response: { paymentUrl } hoặc { deeplink, qrCodeUrl }
  → Redirect / WebView / Linking.openURL
  → Cổng thanh toán
  → IPN/Callback server (verify signature)
  → Ticket PAID + ghi paymentRef + EmailService
  → Return URL → frontend /payment/result?status=success&maVe=...
```

### Enum `PaymentMethod` (mở rộng)

```java
CHUYEN_KHOAN_VCB,
CHUYEN_KHOAN_BIDV,
MOMO,              // CK thủ công SĐT — giữ
VNPAY,
MOMO_GATEWAY       // cổng MoMo thật
```

### VNPay

**Config (env):**

- `VNPAY_TMN_CODE`
- `VNPAY_HASH_SECRET`
- `VNPAY_URL` (sandbox: `https://sandbox.vnpay.vn/paymentv2/vpcpay.html`)
- `VNPAY_RETURN_URL` (frontend)
- `VNPAY_IPN_URL` (backend public URL)

**Tạo URL:** sort params, HMAC-SHA512, `vnp_TxnRef` = mã vé, `vnp_Amount` = tongTien × 100.

**IPN:** `GET /api/v1/payments/vnpay/ipn` — verify `vnp_SecureHash`, `RspCode=00` → PAID.

**Return:** `GET /api/v1/payments/vnpay/return` — redirect frontend với query status (không đổi PAID nếu IPN đã xử lý).

### MoMo

**Config (env):**

- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`
- `MOMO_ENDPOINT` (sandbox)
- `MOMO_RETURN_URL`, `MOMO_NOTIFY_URL`

**Tạo payment:** `POST` create với `orderId` = mã vé, `amount`, signature theo docs MoMo v2.

**IPN:** `POST /api/v1/payments/momo/ipn` — verify signature → PAID.

### Bảo mật

- Secret chỉ trong env, không commit
- IPN idempotent: nếu vé đã PAID → trả success, không gửi email lần 2
- Log mọi callback (mã vé, amount, signature ok/fail)
- So khớp `amount` với `ticket.tongTien`

### Frontend Web

- `PaymentPage.jsx`: thêm card VNPay, MoMo Gateway
- Sau `create-ticket`: nếu gateway → gọi create-url → `window.location.href = paymentUrl`
- Trang `/payment/result` (mới): hiển thị thành công / thất bại

### App mobile

- `booking/[id]/payment.tsx`: tương tự; MoMo/VNPay mở `Linking.openURL(paymentUrl)`
- Deep link return (tùy chọn v1): poll `GET /tickets/my-tickets` hoặc `GET /tickets/{id}`

### Giữ CK thủ công

- VCB, BIDV, MOMO (SĐT): flow cũ, admin confirm → PAID → email

---

## 7. File / module dự kiến

### Backend (mới / sửa)

| File | Việc |
|------|------|
| `document/MovieReview.java` | Model |
| `repository/MovieReviewRepository.java` | |
| `dto/ReviewDto.java` | |
| `service/MovieReviewService.java` | |
| `controller/MovieReviewController.java` | |
| `service/EmailService.java` | Gửi mail |
| `service/VnPayService.java` | Tạo URL + verify |
| `service/MoMoPaymentService.java` | Tạo + verify |
| `controller/PaymentController.java` | Mở rộng endpoints |
| `document/Ticket.java` | `emailSentAt`, `paymentGatewayRef` |
| `document/PaymentMethod.java` | VNPAY, MOMO_GATEWAY |
| `application.properties` | mail + gateway keys |
| `resources/templates/email-ticket-confirm.html` | Template |

### Frontend web

| File | Việc |
|------|------|
| `MovieDetailPage.jsx` | Reviews UI |
| `PaymentPage.jsx` | Gateway options + redirect |
| `pages/PaymentResultPage.jsx` | Mới |
| `services/reviewService.js` | Mới |
| `services/paymentService.js` | Mới |
| `utils/hinhThucThanhToan.js` | Thêm VNPay, MoMo GW |

### Mobile

| File | Việc |
|------|------|
| `movie/[id]/index.tsx` | Cast + reviews |
| `booking/[id]/payment.tsx` | Gateway |
| `services/reviewService.ts` | Mới |

---

## 8. Kiểm thử

| Tính năng | Cách test |
|-----------|-----------|
| Cast mobile | Mở Deadpool → thấy Shawn Levy, Ryan Reynolds |
| Email | Confirm PAID → nhận mail (hoặc Mailtrap) |
| Review | POST review → hiện list + điểm TB |
| VNPay sandbox | Thẻ test VNPay → IPN → PAID + email |
| MoMo sandbox | QR/redirect test → IPN → PAID + email |
| Idempotent IPN | Gọi IPN 2 lần → vẫn 1 email |

---

## 9. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|------------|
| IPN không tới (localhost) | Dùng ngrok / deploy staging cho IPN URL |
| MoMo/VNPay signature sai | Unit test verify với payload mẫu sandbox |
| Email spam / fail | Async + log; không block thanh toán |
| Review spam | Giới hạn 500 ký tự, 1 review/user/phim |

---

## 10. Phạm vi không làm (v1)

- Production keys / go-live checklist
- Push notification thay email
- Moderation queue cho review
- VNPay tokenization / recurring

---

## 11. Tiếp theo sau khi duyệt spec

1. User review file này  
2. Viết implementation plan: `docs/superpowers/plans/2026-07-30-phongg-features.md`  
3. Implement theo thứ tự §2
