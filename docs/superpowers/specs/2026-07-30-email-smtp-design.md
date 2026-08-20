# Thiết kế: Bật email vé qua SMTP

**Ngày:** 2026-07-30  
**Trạng thái:** Đã triển khai cấu hình  
**Dự án:** QLBVXP — PhongG Cinema

---

## 1. Mục tiêu

Gửi email HTML (vé + QR soát vé) tới **email tài khoản đăng nhập** khi vé chuyển `PAID`.

## 2. Khi gửi (đã có trong code)

| Luồng | Trigger |
|-------|---------|
| CK thủ công | Admin duyệt vé `CHO_XAC_NHAN` → `PUT /bookings/{id}/approve` |
| VNPay / MoMo | IPN/callback thành công → `TicketPaidService.danhDauThanhToanThanhCong` |

**Không gửi** khi khách chỉ bấm «Tôi đã chuyển khoản» (`CHO_XAC_NHAN`).

## 3. Cấu hình SMTP

Biến môi trường (file `mail.local.cmd`):

| Biến | Mô tả |
|------|--------|
| `MAIL_ENABLED` | `true` |
| `MAIL_HOST` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | Gmail |
| `MAIL_PASSWORD` | App Password 16 ký tự |
| `MAIL_FROM` | `PhongG Cinema <gmail@cùng username>` |
| `APP_FRONTEND_URL` | `http://localhost:5173` |

Gmail: bật 2FA → tạo App Password tại Google Account → Security.

## 4. Chống gửi trùng

- `Ticket.emailSentAt` — chỉ gửi một lần
- Gửi fail → log WARN, **không** rollback PAID

## 5. File thêm / sửa

| File | Việc |
|------|------|
| `mail.local.cmd.example` | Template cấu hình |
| `start-backend.cmd` | Nạp `mail.local.cmd` nếu có |
| `MailStartupLogger.java` | Log trạng thái mail khi boot |
| `.gitignore` | Bỏ qua `mail.local.cmd` |

## 6. Kiểm thử

1. Sao chép `mail.local.cmd.example` → `mail.local.cmd`, điền Gmail App Password  
2. `stop-backend.cmd` → `start-backend.cmd`  
3. Log: `EMAIL VE: BAT — ...`  
4. Khách CK → Admin duyệt → kiểm tra hộp thư (và Spam)

## 7. Phạm vi không làm

- Email «đã nhận CK, chờ duyệt» (option C)  
- Mailtrap profile riêng (user tự đổi HOST trong mail.local.cmd)
