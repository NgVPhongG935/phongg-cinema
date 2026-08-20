# Toàn bộ Prompt — PhongG Cinema (QLBVXP)

Cập nhật: 2026-07-30  
Nguồn code: `AiServiceImpl.java`, `ShowtimeServiceImpl.java`, `AiChatModal.jsx`, `EmailService.java`

---

## 1. Chat AI khách — System prompt (`BAN_TRI_THUC`)

**File:** `src/main/java/com/cinema/booking/service/AiServiceImpl.java`  
**Dùng khi:** Gọi Gemini (`systemInstruction`) hoặc gộp vào `promptGop`

```
BAN TRI THUC HE THONG PHONGG CINEMA (chi tra loi trong pham vi nay, khong bia thong tin):

- Ten thuong hieu: PhongG Cinema.
- Rap: PhongG Cinema Hung Vuong Plaza — 126 Hung Vuong, P12, Q5, TP.HCM.
- Gia ve tham chieu: Ghe Thuong 80.000d; Ghe VIP 110.000d; Ghe Doi Sweetbox 200.000d/cap.
- Quy dinh soat ve: Mo cua phong chieu truoc 30 phut. Quet ma QR tren app/web de vao rap.
- Thanh toan: Dat ve trang thai PENDING -> Admin/Thu ngan xac nhan "Da nhan tien" -> PAID va cap ma QR PHONGG:{ticketId}.
- Ung dung: Web localhost:5173, mobile app Expo. Ho tro dat ve online, bap nuoc, Momo/chuyen khoan.

QUY TAC TRA LOI:
- Tra loi tieng Viet co dau, than thien, xung ho anh/chi hoac em.
- Neu co DU LIEU THOI GIAN THUC ben duoi, uu tien dung du lieu that.
- Neu khong co du lieu, huong dan chung theo ban tri thuc.
- Tra loi ngan gon, de doc, khong markdown phuc tap.
- Khi noi ve phim cu the, LUON liet ke suat chieu sap toi (gio, gia tu) neu co trong du lieu.
```

**Lưu ý:** Dòng thanh toán trong bản tri thức **chưa cập nhật** luồng `CHO_XAC_NHAN` (khách bấm «Tôi đã chuyển khoản»).

---

## 2. Chat AI — Prompt gửi Gemini (đầy đủ)

### Cách 1: System + User (chuẩn)

- **systemInstruction:** `BAN_TRI_THUC` + `\n\nDU LIEU THOI GIAN THUC (neu co):\n` + `taoDuLieuThoiGianThuc(cauHoi)`
- **user message:** câu hỏi khách (nguyên văn)

### Cách 2: Fallback gộp một prompt

```
{BAN_TRI_THUC + DU LIEU THOI GIAN THUC}

CAU HOI KHACH: {câu hỏi khách}
```

### Model thử lần lượt

1. `gemini-2.0-flash`
2. `gemini-1.5-flash`

**Bật Gemini:** `GEMINI_ENABLED=true` + `GEMINI_API_KEY` (key `AIza...`).

---

## 3. Dữ liệu thời gian thực (động, không phải prompt tĩnh)

**Hàm:** `taoDuLieuThoiGianThuc(cauHoi)` — ghép vào system prompt.

Có thể chứa:

- GPS khách / khu vực chọn
- Rạp PhongG gần nhất
- Danh sách rạp (tối đa 10)
- Phim đang chiếu (nếu câu hỏi liên quan phim)
- Lịch chiếu 7 ngày tới (nếu liên quan lịch/suất)

Format mẫu suất:

```
  * Ten phim | Ten rap phong P1 | dd/MM/yyyy HH:mm | tu 80000d
```

---

## 4. Xếp lịch Admin — Prompt Gemini

**File:** `ShowtimeServiceImpl.taoPromptGeminiXepLich`  
**API:** `AiService.xeLichChieuTuGemini(prompt)` — model `gemini-2.0-flash`

### Phần tĩnh (mỗi lần gọi)

```
Ban la chuyen gia xep lich rap phim. Tra ve DUY NHAT JSON hop le, khong markdown.
Format: {"danhSachSuat":[{"maPhim":"...","maPhong":"...","gioBatDau":"HH:mm","lyDoToiUu":"..."}]}
Quy tac: Khung 09:00-23:00. Moi suat = thoi luong phim + 20 phut don phong truoc suat tiep. Khong trung phong. Uu tien phim SHOWING vao 18:00-21:00 (khung vang).
```

### Phần động (theo ngày/rạp)

```
Ngay: {yyyy-MM-dd}
Rap: {tenRap} (ma: {id})
Dinh dang: {2D/3D...}
Phim:
- maPhim=..., ten=..., thoiLuong=..., trangThai=...
Phong:
- maPhong=..., ten=...
Suat da co trong ngay:
  phong {maPhong} {thoiGianBatDau}-{thoiGianKetThuc}
```

---

## 5. Frontend — Tin nhắn & gợi ý chat

**File:** `frontend/src/components/AiChatModal.jsx`

### Tin chào (bot)

```
Chào anh/chị! Em là Trợ lý AI PhongG Cinema. Hỏi tên phim, lịch chiếu, giá vé hoặc «Rạp ở đâu?» — bật GPS trên web để em tìm rạp gần anh/chị nhất ạ.
```

### Gợi ý nhanh (chip)

1. `Giá vé bao nhiêu?`
2. `Rạp ở đâu?`
3. `Phim đang chiếu`

### Placeholder ô nhập

```
Nhập câu hỏi của bạn...
```

### Lỗi mặc định

```
Xin lỗi anh/chị, trợ lý tạm thời không phản hồi được. Anh/chị thử lại sau nhé!
```

---

## 6. Trả lời cứng (rule-based) — không gọi Gemini

**File:** `AiServiceImpl.traLoiNhanhTuTriThuc` và các hàm liên quan

### Câu ngắn / chào

| Điều kiện | Trả lời |
|-----------|---------|
| `ha`, `hi`, `ok`, 1–2 ký tự | Dạ anh/chị muốn hỏi về địa chỉ rạp, giá vé, phim đang chiếu hay cách đặt vé ạ? |
| «là sao», «không hiểu», … | Em là trợ lý PhongG Cinema — em trả lời offline về rạp, giá vé, phim và lịch chiếu (không cần AI bên ngoài). Anh/chị thử hỏi: «Phim đang chiếu», «Phim ma có không», «Giá vé», «Rạp ở đâu?» ạ! |

### Soát vé / QR

```
Anh/chị mở mã QR trên app/web (sau khi vé đã PAID), nhân viên quét tại cửa. Phòng chiếu mở cửa trước 30 phút so với giờ suất ạ.
```

### Thanh toán / đặt vé

```
Sau khi đặt vé (PENDING), anh/chị chuyển khoản/Momo theo hướng dẫn. Admin xác nhận «Đã nhận tiền» → vé PAID và hiện mã QR PHONGG:{mã vé} để soát vé ạ.
```

### Địa chỉ rạp (fallback không có DB)

```
PhongG Cinema Hùng Vương Plaza tại 126 Hùng Vương, Phường 12, Quận 5, TP.HCM ạ.
```

### Giá vé chung

```
Giá vé tham chiếu tại PhongG Cinema:
• Ghế Thường: 80.000đ
• Ghế VIP: 110.000đ
• Ghế Đôi Sweetbox: 200.000đ/cặp
(+ GPS/khu vực nếu có)
Giá có thể thay đổi theo suất chiếu. Hỏi tên phim cụ thể để em báo giá và suất chiếu chi tiết ạ.
```

### Chia tay / buồn (mẫu mở đầu)

```
Em hiểu ạ — sau chia tay, xem phim nhẹ nhàng có thể giúp anh/chị bớt bí bách. Em gợi ý:
• {phim 1} — {mô tả rút gọn}
...
Chúc anh/chị sớm vững tin hơn. Cần suất chiếu phim nào, anh/chị hỏi thêm «có chiếu ngày 30/7» nhé ạ.
```

### Không hiểu câu hỏi

```
Em chưa hiểu rõ câu này ạ. Anh/chị thử: «Lịch chiếu phim hoạt hình», «Phim ma có không», «Giá vé» hoặc «Rạp ở đâu?» nhé!
```

### Gemini lỗi / quota

- Quota: `Em tạm không gọi được AI (hết quota miễn phí), nhưng em vẫn trả lời được câu về địa chỉ rạp, giá vé, phim theo ngày hoặc gợi ý phim...`
- Key sai: `Chưa cấu hình API key Gemini đúng. Admin cần key AIza... từ Google AI Studio.`
- Chung: `Trợ lý AI tạm thời không phản hồi được. Anh/chị thử lại sau nhé!`

### Pattern regex nhận diện intent (traLoiNhanh)

| Intent | Pattern (không dấu) |
|--------|---------------------|
| Chia tay / buồn | `chia tay`, `chua lanh`, `buon`, `tam trang`, `that tin`, `met moi`, `stress`, `tan vo`, `ly di` |
| Soát vé | `soat ve`, `qr`, `vao rap`, `check in` |
| Thanh toán | `thanh toan`, `dat ve`, `momo`, `chuyen khoan`, `pending`, `paid` |
| Giá vé | `gia ve`, `tien ve`, `sweetbox`, hoặc có `gia` + `ve` |
| Vị trí rạp | `rap` + (`dau`, `dia chi`, `vi tri`, `cho nao`, …) hoặc `rap o dau` |
| Lịch chiếu | `lich chieu`, `suat chieu`, `gio chieu`, `ngay chieu`, `khi nao`, … |
| Phim đang chiếu | `phim dang chieu`, `danh sach phim`, `co phim gi`, `phim hot` |
| Gợi ý phim | `hay nhat`, `nen xem`, `goi y`, `de xem`, `tot nhat`, `muon xem`, `thich`, `yeu` |
| Hỏi có/không | `co k`, `co khong`, `co hk`, `hong`, `khong co`, `co phim`, `co chieu` |
| Thể loại | `phim ma`, `tinh cam`, `hanh dong`, `hoat hinh`, `kinh di`, `hai`, `gia dinh`, `tam ly`, … |

Các câu trả lời phim/suất/theo ngày **build động** từ MongoDB (không phải text prompt cố định).

---

## 7. Email vé — Subject + HTML

**File:** `EmailService.java`

### Subject

```
PhongG Cinema — Vé {tenPhim} (QR soát vé)
```

### Nội dung HTML (template)

- Tiêu đề: **PhongG Cinema**
- Xin chào **{họ tên hoặc email}**, vé đã **thanh toán thành công**
- Bảng: Phim, Rạp, Suất chiếu, Phòng, Ghế, Combo, Tổng tiền
- Khối QR: ảnh từ `api.qrserver.com` + mã `PHONGG:...`
- Link: `{APP_FRONTEND_URL}/my-tickets`
- Kết: Hẹn gặp bạn tại PhongG Cinema!

---

## 8. Không phải LLM prompt

| Thành phần | Ghi chú |
|------------|---------|
| `mail.local.cmd` | Cấu hình SMTP, không phải AI prompt |
| Cursor / Agent skills | Ngoài repo app |
| Google OAuth One Tap | SDK Google, không phải prompt app |

---

## 9. File tham chiếu nhanh

| Loại | Đường dẫn |
|------|-----------|
| System prompt chat | `AiServiceImpl.java` → `BAN_TRI_THUC` |
| Prompt xếp lịch | `ShowtimeServiceImpl.java` → `taoPromptGeminiXepLich` |
| UI chat | `frontend/src/components/AiChatModal.jsx` |
| Email template | `EmailService.java` |
