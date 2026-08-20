# Thiết kế app Android PhongG Cinema

**Ngày:** 2026-07-25  
**Trạng thái:** Đã duyệt  
**Dự án:** QLBVXP — hệ thống đặt vé rạp chiếu phim

---

## 1. Mục tiêu

Xây dựng **app Android thật** (không phải PWA hay web bọc) chạy song song với web React hiện tại, dùng chung backend Spring Boot + MongoDB. Phạm vi tính năng **gần giống web** cho người dùng cuối: xem phim, tìm rạp/lịch chiếu, đặt ghế, combo, thanh toán, xem vé QR, profile.

**Không nằm trong phạm vi:** toàn bộ khu vực admin/staff (giữ trên web).

---

## 2. Quyết định đã chốt

| Câu hỏi | Lựa chọn |
|---------|----------|
| Loại app | App mobile thật (React Native / Expo) |
| Nền tảng | Chỉ Android |
| Phạm vi | Gần giống web (customer-facing) |
| Công nghệ | **Expo** (khuyến nghị, đã duyệt) |

### Các hướng đã xem xét

1. **Expo (React Native)** — chọn: UI native, dev nhanh với Expo Go, phù hợp đồ án.
2. **Capacitor** — loại: bọc web, ít “app thật”, sơ đồ ghế có thể kém mượt.
3. **React Native CLI** — loại: setup phức tạp, không cần thiết cho dự án này.

---

## 3. Kiến trúc

```
QLBVXP/
├── src/                    # Backend Spring Boot (port 8080) — giữ nguyên
├── frontend/               # Web React + Vite (port 5173) — giữ nguyên
└── mobile/                 # MỚI — Expo app Android
    ├── app/                # Màn hình (Expo Router, file-based routing)
    ├── components/         # UI tái sử dụng
    ├── context/            # AuthContext, ViTriRapContext
    ├── services/           # Gọi API (mirror frontend/src/services)
    ├── constants/          # API URL, theme
    └── utils/              # formatters, combo, hinhThucThanhToan
```

### Luồng dữ liệu

- App gọi REST API tại `http://<IP-LAN-PC>:8080/api/v1`
- JWT lưu trong **AsyncStorage** (tương đương `localStorage` trên web)
- Header: `Authorization: Bearer <token>`
- App native **không bị CORS**; chỉ cần PC và điện thoại **cùng WiFi**

### Backend — thay đổi tối thiểu

- Không bắt buộc sửa CORS cho mobile (request native không qua browser CORS)
- (Tùy chọn P2) Thêm `application.properties`: `server.address=0.0.0.0` để bind LAN nếu điện thoại không kết nối được
- Không thêm endpoint mới cho MVP; tái sử dụng API hiện có

---

## 4. API tái sử dụng

| Nhóm | Endpoint chính | File web tham chiếu |
|------|----------------|---------------------|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` | `authService.js` |
| Phim | `GET /movies`, `GET /movies/{id}` | `movieService.js` |
| Rạp | `GET /cinemas`, `GET /cinemas/{id}` | `cinemaService.js` |
| Khu vực | `GET /regions` | `regionService.js` |
| Suất chiếu | `GET /showtimes`, `GET /showtimes/cinema-day`, `GET /showtimes/{id}/seats`, `POST /showtimes/{id}/hold-seats` | `showtimeService.js` |
| Vé | `POST /bookings/create-ticket`, `GET /tickets/my-tickets` | `ticketService.js` |
| AI (tùy chọn P3) | `POST /ai/chat` | `aiService.js` |

### Payload đặt vé (`CreateTicketRequest`)

```json
{
  "maSuatChieu": "<showtimeId>",
  "danhSachGhe": ["A1", "A2"],
  "maNguoiDung": "<userId>",
  "tongTien": 250000,
  "tienGhe": 200000,
  "tienBapNuoc": 50000,
  "danhSachCombo": [{ "maCombo": "...", "soLuong": 1 }],
  "hinhThucThanhToan": "CHUYEN_KHOAN_VCB"
}
```

Hình thức thanh toán: `CHUYEN_KHOAN_VCB`, `CHUYEN_KHOAN_BIDV`, `MOMO`. Vé tạo ra ở trạng thái `PENDING`; admin xác nhận trên web.

---

## 5. Điều hướng & màn hình

### Bottom tabs (4 tab)

| Tab | Route | Mô tả |
|-----|-------|-------|
| Trang chủ | `/(tabs)/index` | Banner, lọc phim, lưới poster |
| Rạp & lịch | `/(tabs)/cinemas` | Chọn khu vực → rạp → lịch theo ngày |
| Vé của tôi | `/(tabs)/tickets` | Danh sách vé + QR (cần đăng nhập) |
| Tài khoản | `/(tabs)/account` | Đăng nhập/đăng ký, profile |

### Stack (luồng đặt vé)

```
/movie/[id]              Chi tiết phim
/movie/[id]/schedule     Lịch chiếu (chọn ngày, rạp)
/booking/[id]            Chọn ghế + giữ ghế
/booking/[id]/combo      Combo bắp nước
/booking/[id]/payment    Chọn VCB/BIDV/MoMo → tạo vé PENDING
/ticket/[id]             Chi tiết vé + QR fullscreen
/login                   Đăng nhập (modal hoặc màn riêng)
/register                Đăng ký
```

### Mapping với web

| Web route | Mobile route |
|-----------|--------------|
| `/` | `/(tabs)/index` |
| `/movies/:id` | `/movie/[id]` |
| `/movies/:id/schedule` | `/movie/[id]/schedule` |
| `/booking/:id` | `/booking/[id]` |
| `/booking/:id/combo` | `/booking/[id]/combo` |
| `/booking/:id/payment` | `/booking/[id]/payment` |
| `/my-tickets` | `/(tabs)/tickets` |
| `/profile` | `/(tabs)/account` |

---

## 6. UI & UX

- **Ngôn ngữ hiển thị:** tiếng Việt có dấu (giống web)
- **Code/comment:** camelCase không dấu (giống quy tắc dự án)
- **Theme:** tối (dark), accent fuchsia/purple — đồng bộ tinh thần web (`NenDong`, poster cards)
- **Thư viện UI:** React Native core + `expo-linear-gradient`, `react-native-qrcode-svg`
- **Navigation:** Expo Router + bottom tabs + native stack
- **State:** React Context cho auth và vị trí rạp (mirror `AuthContext`, `ViTriRapContext`)

### Hành vi quan trọng (mirror web)

- Chọn ghế → `hold-seats` → đếm ngược giữ ghế trên màn thanh toán
- Hết giờ giữ ghế → quay lại chọn ghế + thông báo
- Thanh toán → tạo vé `PENDING` → hiển thị STK + nội dung CK + hướng dẫn chờ admin
- Vé đã `PAID` → hiển thị QR từ `maQrCode` của vé

---

## 7. Cấu hình môi trường

File `mobile/constants/api.js`:

```javascript
// Đổi IP này thành IP LAN của PC khi dev trên điện thoại thật
export const API_BASE_URL = 'http://192.168.x.x:8080/api/v1'
```

File `mobile/.env` (Expo):

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8080/api/v1
```

Ghi chú trong `NOTE` (mục 4): hướng dẫn tìm IP (`ipconfig`), chạy Expo, cài Expo Go.

---

## 8. Dev workflow — chạy đồng thời

| Terminal | Lệnh | Kết quả |
|----------|------|---------|
| 1 | `.\start-backend.cmd` | API `:8080` |
| 2 | `.\start-frontend.cmd` | Web `localhost:5173` trên PC |
| 3 | `cd mobile && npx expo start` | Metro bundler; quét QR bằng Expo Go (Android) |

Sửa backend → cả web và app nhận. Sửa `mobile/` → Fast Refresh trên điện thoại.

---

## 9. Giai đoạn triển khai

### Phase 1 — Nền tảng (P1)

- Scaffold Expo trong `mobile/`
- `apiClient` + AsyncStorage token
- Auth (login/register/logout)
- Trang chủ: danh sách phim + chi tiết phim
- Tab navigation cơ bản

### Phase 2 — Đặt vé (P2)

- Lịch chiếu theo phim/ngày/rạp
- Sơ đồ ghế + giữ ghế
- Combo bắp nước
- Thanh toán (3 hình thức) + vé PENDING
- Vé của tôi + QR

### Phase 3 — Hoàn thiện (P3)

- Tab Rạp & lịch (widget khu vực/rạp)
- Profile (thông tin cá nhân)
- Polish UI, loading/error states
- (Tùy chọn) AI chat floating button
- Cập nhật `NOTE` + `start-mobile.cmd`

---

## 10. Xử lý lỗi

| Tình huống | Hành vi app |
|------------|-------------|
| 401 Unauthorized | Xóa token, chuyển về đăng nhập |
| Mất mạng / không kết nối API | Toast/banner: "Không kết nối được máy chủ. Kiểm tra WiFi và IP backend." |
| Ghế đã được giữ/bán | Hiển thị lỗi API, refresh sơ đồ ghế |
| Hết thời gian giữ ghế | Redirect về chọn ghế |

---

## 11. Kiểm thử chấp nhận

- [ ] Đăng ký + đăng nhập trên điện thoại Android (Expo Go)
- [ ] Xem danh sách phim và chi tiết phim
- [ ] Chọn suất chiếu → ghế → combo → thanh toán VCB
- [ ] Vé xuất hiện ở "Vé của tôi" với trạng thái "Chờ xác nhận"
- [ ] Admin xác nhận trên web → app refresh thấy "Đã thanh toán" + QR
- [ ] Web (`localhost:5173`) và app chạy đồng thời, cùng backend

---

## 12. Rủi ro & giảm thiểu

| Rủi ro | Giảm thiểu |
|--------|-------------|
| Điện thoại không gọi được `localhost` | Dùng IP LAN trong `EXPO_PUBLIC_API_BASE_URL` |
| Windows Firewall chặn port 8080 | Mở rule inbound TCP 8080 hoặc tắt firewall tạm khi dev |
| Expo Go không hỗ trợ một số native module | Chỉ dùng package tương thích Expo SDK |
| Sơ đồ ghế phức tạp trên màn nhỏ | ScrollView + zoom pinch (P2), layout grid giống web |

---

## 13. Phụ thuộc chính (mobile)

- `expo` (~SDK 52)
- `expo-router`
- `expo-secure-store` hoặc `@react-native-async-storage/async-storage`
- `axios`
- `react-native-qrcode-svg`
- `expo-linear-gradient`
- `expo-clipboard` (sao chép STK/nội dung CK)
