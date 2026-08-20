# Thiết kế: Quản lý giá vé theo suất chiếu + % phụ thu theo rạp

**Ngày:** 2026-08-08  
**Trạng thái:** Đã duyệt thiết kế (chờ review spec)  
**Dự án:** QLBVXP — PhongG Cinema

---

## 1. Mục tiêu

Thống nhất hệ thống giá vé hiện đang **tách đôi**:

| Hiện tại | Vấn đề |
|----------|--------|
| `Showtime.giaVeTu` (69k–75k) | Chỉ hiển thị lịch, không dùng tính tiền |
| `GIA_CO_BAN = 90.000` cứng trong code | Không liên quan `giaVeTu` admin nhập |
| Phụ thu VIP/Couple cố định (+20k / +80k) | Không linh hoạt theo rạp |

**Mục tiêu sau khi triển khai:**

1. Admin **tự đặt giá ghế thường** khi tạo/sửa suất chiếu (`giaVeTu`).
2. Mỗi **rạp** cấu hình **% phụ thu VIP** và **% phụ thu Ghế đôi**; giá VIP/Couple tự tính từ giá thường.
3. Web, mobile và backend dùng **cùng một công thức**; backend **validate** số tiền client gửi.

---

## 2. Quyết định thiết kế (đã chốt với user)

| Câu hỏi | Lựa chọn |
|---------|----------|
| Giá nền quyết định bởi | **Suất chiếu** — admin nhập `giaVeTu` = giá ghế STANDARD |
| VIP / Couple | **Nhân %** lên giá thường (không cộng cố định 20k/80k) |
| % phụ thu cấu hình ở | **Theo rạp** (`Cinema`) — mỗi cụm rạp có % riêng |

---

## 3. Mô hình dữ liệu

### 3.1 Cinema — thêm field

```java
// document/Cinema.java
private Integer phanTramGheVip;      // VD: 25  → +25% so với ghế thường
private Integer phanTramGheCouple;   // VD: 80  → +80% so với ghế thường
```

| Field | Kiểu | Mặc định | Ràng buộc |
|-------|------|----------|-----------|
| `phanTramGheVip` | `Integer` | `25` | 0–200 |
| `phanTramGheCouple` | `Integer` | `80` | 0–300 |

Đồng bộ `CinemaDto`, form admin quản lý rạp.

### 3.2 Showtime — giữ nguyên schema, đổi ý nghĩa

```java
// document/Showtime.java (không đổi cấu trúc)
private BigDecimal giaVeTu;          // Giá ghế STANDARD (nguồn sự thật)
// SeatStatus.phuThu — snapshot phụ thu tại thời điểm tạo/cập nhật suất
```

**Công thức tính giá một ghế:**

```
lamTron(n) = round(n / 1000) * 1000

giaThuong  = giaVeTu
giaVip     = lamTron(giaVeTu × (1 + phanTramGheVip / 100))
giaCouple  = lamTron(giaVeTu × (1 + phanTramGheCouple / 100))

phuThu(STANDARD) = 0
phuThu(VIP)      = giaVip − giaVeTu
phuThu(COUPLE)   = giaCouple − giaVeTu

giaGhe = giaVeTu + phuThu
```

**Ví dụ:** Rạp A (VIP +25%, Couple +80%), `giaVeTu = 80.000`

| Loại ghế | Giá |
|----------|-----|
| STANDARD | 80.000 |
| VIP | 100.000 |
| COUPLE | 144.000 |

### 3.3 Ticket — không đổi schema

`Ticket.tienGhe` vẫn lưu tổng đã validate; không thêm field mới.

---

## 4. Service tính giá (backend)

Tạo utility/service tập trung, thay `ShowtimeSeatMapper.tinhPhuThu()` cố định:

**`TinhGiaVeUtil` (hoặc `PricingService`)**

```java
int tinhPhuThu(BigDecimal giaVeTu, String loaiGhe, Cinema rap);
BigDecimal tinhGiaGhe(BigDecimal giaVeTu, String loaiGhe, Cinema rap);
BigDecimal tinhTienGhe(Showtime suat, Cinema rap, List<String> danhSachSoGhe);
```

- Gọi khi **tạo/cập nhật suất** → gán `phuThu` cho từng ghế trong `trangThaiGhe`.
- Gọi khi **create-ticket** → tính `tienGhe` kỳ vọng, so sánh với request.

**Rạp thiếu %:** dùng mặc định `25` / `80`.

---

## 5. Luồng Admin

### 5.1 Quản lý rạp (`ManageCinemasPage`)

- Thêm 2 input số: `% phụ thu VIP`, `% phụ thu Ghế đôi`.
- Lưu qua `PUT/POST /cinemas/admin`.
- Hiển thị gợi ý: "Ghế VIP = giá thường × (1 + %/100)".

### 5.2 Quản lý suất chiếu (`ManageShowtimesPage`)

- Ô **Giá vé từ** = giá ghế **thường** (giữ label, có thể đổi tooltip).
- Khi chọn rạp → hiển thị preview:
  - "VIP: ~Xđ · Couple: ~Yđ" (tính từ `giaVeTu` + % rạp).
- Tạo hàng loạt / AI / auto-seed: `giaVeTuNgay` / `giaVeTuToi` vẫn là giá thường.

### 5.3 Không đổi

- Form phim (`Movie`) — không có giá.
- Sơ đồ ghế phòng — chỉ `loaiGhe`; không nhập giá từng ghế thủ công.

---

## 6. Luồng đặt vé (web + mobile)

### 6.1 Hiển thị & chọn ghế

```
GET /showtimes/{id} hoặc API ghế suất
  → trả giaVeTu + trangThaiGhe[].phuThu

Giá ghế hiển thị = giaVeTu + phuThu
tienGhe = Σ giá các ghế đã chọn
```

**Xóa** hằng `GIA_CO_BAN = 90000` tại:

- `frontend/src/pages/SeatBookingPage.jsx`
- `frontend/src/utils/soDoGhe.js` (nếu có)
- `mobile/app/booking/[id]/index.tsx`

Dùng `giaVeTu + phuThu` từ API.

### 6.2 Thanh toán

Client gửi `CreateTicketRequest` như hiện tại (`tienGhe`, `tienBapNuoc`, `tongTien`).

### 6.3 Validate backend (`BookingServiceImpl`)

```
1. Load Showtime + Cinema (theo maRap)
2. tienGheKyVong = tinhTienGhe(suat, rap, danhSachGhe)
3. if (tienGheKyVong != request.tienGhe) → 400 "Giá vé không khớp, vui lòng tải lại trang"
4. Tiếp tục voucher / lưu ticket với tienGhe đã kiểm tra
```

Voucher vẫn áp trên `tienGhe + tienBapNuoc` như hiện tại.

---

## 7. Migration dữ liệu cũ

Chạy một lần trong `DataInitializer` hoặc migration script:

1. **Cinema:** set `phanTramGheVip = 25`, `phanTramGheCouple = 80` nếu null.
2. **Showtime:** với mỗi suất có `giaVeTu` + `maRap`:
   - Load Cinema tương ứng.
   - Tính lại `phuThu` cho mọi ghế trong `trangThaiGhe`.
3. **Suất `giaVeTu` null:** giữ logic seed hiện tại (69k ngày / 75k tối) rồi tính `phuThu`.

**Lưu ý:** Sau migration, giá thực có thể **khác 90k** nếu `giaVeTu` suất đang là 69k/75k. Admin có thể cập nhật `giaVeTu` lên 90k nếu muốn giữ mức cũ.

---

## 8. API thay đổi

| Endpoint | Thay đổi |
|----------|----------|
| `GET/POST/PUT /cinemas/admin` | Response/request thêm `phanTramGheVip`, `phanTramGheCouple` |
| `POST /showtimes/admin` | Tính `phuThu` theo % rạp khi tạo |
| `PUT /showtimes/admin/{id}` | Tính lại `phuThu` khi `giaVeTu` hoặc ghế đổi |
| `POST /bookings/create-ticket` | Validate `tienGhe` server-side |

Không breaking change URL; chỉ mở rộng payload Cinema.

---

## 9. Xử lý lỗi

| Tình huống | HTTP | Thông báo |
|------------|------|-----------|
| `tienGhe` client ≠ server | 400 | Giá vé không khớp, vui lòng tải lại trang |
| `giaVeTu` null hoặc ≤ 0 | 400 | Giá vé suất chiếu không hợp lệ |
| % VIP/Couple null trên rạp | — | Dùng mặc định 25 / 80 |
| % âm hoặc quá lớn | 400 | Phần trăm phụ thu không hợp lệ |

---

## 10. Phạm vi KHÔNG làm (giai đoạn 1)

- Giá theo phim (`Movie`)
- % phụ thu theo phòng (`Room.loaiPhong`)
- Hệ số theo `dinhDang` (2D/3D/IMAX)
- Chỉnh giá từng ghế riêng trên sơ đồ (`Cinema.Seat.giaVe`)
- Lịch sử giá / audit log thay đổi giá

---

## 11. Kiểm thử

| # | Kịch bản | Kỳ vọng |
|---|----------|---------|
| 1 | Tạo rạp VIP +30%, Couple +100%; suất `giaVeTu=100k` | VIP 130k, Couple 200k |
| 2 | Đặt 2 ghế STANDARD + 1 VIP | `tienGhe` = 100k×2 + 130k |
| 3 | Client gửi `tienGhe` sai | 400 |
| 4 | Sửa `giaVeTu` suất → `phuThu` cập nhật | Giá ghế đổi theo |
| 5 | Sửa % rạp → suất **cũ** giữ `phuThu` snapshot | Giá suất cũ không đổi |
| 6 | Mobile đặt vé | Cùng số tiền với web |

---

## 12. Thứ tự triển khai đề xuất

1. Backend: `TinhGiaVeUtil` + field Cinema + tính `phuThu` khi tạo/sửa suất  
2. Backend: validate `tienGhe` trong `BookingServiceImpl`  
3. Migration dữ liệu cũ  
4. Frontend admin: form % rạp + preview suất chiếu  
5. Frontend web: bỏ `GIA_CO_BAN`, dùng API  
6. Mobile: đồng bộ công thức  

Mỗi bước test độc lập trước khi sang bước sau.

---

## 13. Tệp chính cần sửa

**Backend**

- `document/Cinema.java`, `dto/CinemaDto.java`
- `util/TinhGiaVeUtil.java` (mới)
- `util/ShowtimeSeatMapper.java` — bỏ `tinhPhuThu` cố định
- `service/ShowtimeServiceImpl.java`
- `service/BookingServiceImpl.java`
- `service/CinemaServiceImpl.java`
- `config/DataInitializer.java` (migration)

**Frontend**

- `pages/admin/ManageCinemasPage.jsx`
- `pages/admin/ManageShowtimesPage.jsx`
- `pages/SeatBookingPage.jsx`
- `utils/soDoGhe.js`

**Mobile**

- `app/booking/[id]/index.tsx`
