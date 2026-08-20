# Android App PhongG Cinema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạo app Android Expo trong `mobile/` gọi chung backend QLBVXP, gần giống web về luồng đặt vé khách hàng.

**Architecture:** Expo Router (file-based), React Context cho auth/vị trí rạp, `axios` client mirror `frontend/src/services/*`, JWT trong AsyncStorage. Backend giữ nguyên; dev dùng IP LAN thay `localhost`.

**Tech Stack:** Expo SDK 52, Expo Router, React Native, axios, AsyncStorage, react-native-qrcode-svg

## Global Constraints

- UI hiển thị: tiếng Việt có dấu
- Code/comment/biến: camelCase không dấu
- Chỉ Android (Expo Go khi dev)
- Không implement admin/staff trên mobile
- API base: `http://<IP-LAN>:8080/api/v1` (không dùng `localhost` trên điện thoại)
- Tái sử dụng contract API hiện có; không đổi schema backend trừ khi bắt buộc
- Theme tối, accent fuchsia/purple đồng bộ web

---

## File Structure (tổng quan)

```
mobile/
├── app/
│   ├── _layout.tsx                 # Root layout + AuthProvider
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Bottom tabs
│   │   ├── index.tsx               # Trang chủ
│   │   ├── cinemas.tsx             # Rạp & lịch
│   │   ├── tickets.tsx             # Vé của tôi
│   │   └── account.tsx             # Tài khoản
│   ├── movie/[id].tsx
│   ├── movie/[id]/schedule.tsx
│   ├── booking/[id].tsx
│   ├── booking/[id]/combo.tsx
│   ├── booking/[id]/payment.tsx
│   ├── ticket/[id].tsx
│   ├── login.tsx
│   └── register.tsx
├── components/
│   ├── TheBaiPhim.tsx
│   ├── DanhSachPhim.tsx
│   ├── SoDoGhe.tsx
│   ├── BoDemGiuGhe.tsx
│   └── TheVeQr.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ViTriRapContext.tsx
├── services/
│   ├── apiClient.ts
│   ├── authService.ts
│   ├── movieService.ts
│   ├── cinemaService.ts
│   ├── regionService.ts
│   ├── showtimeService.ts
│   └── ticketService.ts
├── constants/
│   ├── api.ts
│   └── theme.ts
├── utils/
│   ├── formatters.ts
│   ├── comboFood.ts
│   ├── hinhThucThanhToan.ts
│   └── layThongBaoLoiApi.ts
├── app.json
├── package.json
└── .env.example
```

**Backend (tùy chọn P1):**
- Modify: `src/main/resources/application.properties` — thêm `server.address=0.0.0.0`
- Modify: `NOTE` — mục 4 hướng dẫn mobile
- Create: `start-mobile.cmd`

---

### Task 1: Scaffold Expo project

**Files:**
- Create: `mobile/` (toàn bộ scaffold qua `create-expo-app`)
- Create: `mobile/.env.example`
- Create: `mobile/constants/api.ts`

**Interfaces:**
- Produces: `API_BASE_URL` export từ `constants/api.ts`

- [ ] **Step 1: Tạo project Expo**

```bash
cd d:\QLBVXP
npx create-expo-app@latest mobile --template tabs
```

Chọn TypeScript nếu được hỏi. Sau khi tạo xong, xóa nội dung mẫu trong `mobile/app/(tabs)/` không cần thiết (giữ `_layout.tsx`).

- [ ] **Step 2: Cài dependencies**

```bash
cd d:\QLBVXP\mobile
npx expo install axios @react-native-async-storage/async-storage expo-linear-gradient expo-clipboard react-native-svg
npm install react-native-qrcode-svg
```

- [ ] **Step 3: Tạo `mobile/constants/api.ts`**

```typescript
const raw = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.1.100:8080/api/v1'
export const API_BASE_URL = raw.replace(/\/$/, '')
```

- [ ] **Step 4: Tạo `mobile/.env.example`**

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8080/api/v1
```

Copy thành `mobile/.env` và đổi IP thật của PC.

- [ ] **Step 5: Cấu hình `app.json`**

```json
{
  "expo": {
    "name": "PhongG Cinema",
    "slug": "phongg-cinema",
    "scheme": "phonggcinema",
    "android": {
      "package": "com.phongg.cinema"
    }
  }
}
```

- [ ] **Step 6: Verify scaffold**

```bash
cd d:\QLBVXP\mobile
npx expo start --offline
```

Expected: Metro bundler khởi động, không lỗi dependency.

---

### Task 2: API client + services layer

**Files:**
- Create: `mobile/services/apiClient.ts`
- Create: `mobile/services/authService.ts`
- Create: `mobile/utils/layThongBaoLoiApi.ts`
- Create: `mobile/constants/theme.ts`

**Interfaces:**
- Consumes: `API_BASE_URL` từ `constants/api.ts`
- Produces:
  - `default apiClient` (axios instance)
  - `dangNhap(duLieu)`, `dangKy(duLieu)`, `dangXuat()`, `layThongTinCaNhan()` từ `authService.ts`

- [ ] **Step 1: Viết `apiClient.ts`**

```typescript
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../constants/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(async (cauHinh) => {
  const maTruyCap = await AsyncStorage.getItem('token')
  if (maTruyCap) cauHinh.headers.Authorization = `Bearer ${maTruyCap}`
  return cauHinh
})

apiClient.interceptors.response.use(
  (phanHoi) => phanHoi,
  async (loi) => {
    if (loi.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'role', 'hoTen'])
    }
    return Promise.reject(loi)
  },
)

export default apiClient
```

- [ ] **Step 2: Viết `authService.ts`** (mirror `frontend/src/services/authService.js`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient from './apiClient'

const luuPhienDangNhap = async (duLieu: { token: string; email: string; role: string; hoTen: string; id: string }) => {
  await AsyncStorage.multiSet([
    ['token', duLieu.token],
    ['user', JSON.stringify(duLieu)],
    ['role', duLieu.role],
    ['hoTen', duLieu.hoTen],
  ])
  return duLieu
}

export const dangNhap = (duLieu: { email: string; matKhau: string }) =>
  apiClient.post('/auth/login', duLieu).then((r) => luuPhienDangNhap(r.data))

export const dangKy = (duLieu: { email: string; matKhau: string; hoTen: string }) =>
  apiClient.post('/auth/register', duLieu).then((r) => luuPhienDangNhap(r.data))

export const dangXuat = () => AsyncStorage.multiRemove(['token', 'user', 'role', 'hoTen'])

export const layThongTinCaNhan = async () => {
  const email = (await AsyncStorage.getItem('user')) ? JSON.parse((await AsyncStorage.getItem('user'))!).email : null
  if (!email) throw new Error('Chua dang nhap')
  return apiClient.get('/auth/me', { params: { email } }).then((r) => r.data)
}
```

- [ ] **Step 3: Viết `layThongBaoLoiApi.ts`**

```typescript
export const layThongBaoLoiApi = (loi: unknown): string => {
  const err = loi as { response?: { data?: { message?: string } }; message?: string }
  return err.response?.data?.message || err.message || 'Co loi xay ra'
}
```

- [ ] **Step 4: Verify**

Chạy backend (`.\start-backend.cmd`), mở app Expo Go, tạm gọi `dangNhap` từ màn login (Task 3) — expected: token lưu AsyncStorage.

---

### Task 3: AuthContext + màn đăng nhập/đăng ký

**Files:**
- Create: `mobile/context/AuthContext.tsx`
- Modify: `mobile/app/_layout.tsx`
- Create: `mobile/app/login.tsx`
- Create: `mobile/app/register.tsx`
- Create: `mobile/app/(tabs)/account.tsx`

**Interfaces:**
- Consumes: `authService` functions
- Produces: `useAuth()` → `{ nguoiDung, capNhatNguoiDung, thoatTaiKhoan, dangTai }`

- [ ] **Step 1: AuthContext**

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { dangXuat, layThongTinCaNhan } from '../services/authService'

type NguoiDung = { id: string; email: string; hoTen: string; role: string } | null

const AuthContext = createContext<{
  nguoiDung: NguoiDung
  dangTai: boolean
  capNhatNguoiDung: (d: NguoiDung) => void
  thoatTaiKhoan: () => Promise<void>
} | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [nguoiDung, datNguoiDung] = useState<NguoiDung>(null)
  const [dangTai, datDangTai] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem('user')
        if (raw) datNguoiDung(JSON.parse(raw))
        const token = await AsyncStorage.getItem('token')
        if (token && !raw) {
          const info = await layThongTinCaNhan()
          datNguoiDung(info)
          await AsyncStorage.setItem('user', JSON.stringify(info))
        }
      } catch {
        await dangXuat()
        datNguoiDung(null)
      } finally {
        datDangTai(false)
      }
    })()
  }, [])

  const capNhatNguoiDung = async (d: NguoiDung) => {
    if (d) await AsyncStorage.setItem('user', JSON.stringify(d))
    datNguoiDung(d)
  }

  const thoatTaiKhoan = async () => {
    await dangXuat()
    datNguoiDung(null)
  }

  return (
    <AuthContext.Provider value={{ nguoiDung, dangTai, capNhatNguoiDung, thoatTaiKhoan }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phai nam trong AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Wrap root `_layout.tsx` với `AuthProvider` + `Stack`**

- [ ] **Step 3: Màn `login.tsx` và `register.tsx`**

Form: email, mật khẩu (+ họ tên khi đăng ký). Nút submit gọi `dangNhap`/`dangKy`, `capNhatNguoiDung`, `router.replace('/(tabs)')`.

- [ ] **Step 4: Tab `account.tsx`**

Hiển thị họ tên/email nếu đã login; nút Đăng xuất; link Đăng nhập/Đăng ký nếu chưa login.

- [ ] **Step 5: Verify**

Đăng ký tài khoản mới trên điện thoại → tab Tài khoản hiện tên → đăng xuất → đăng nhập lại.

---

### Task 4: Trang chủ — danh sách phim

**Files:**
- Create: `mobile/services/movieService.ts`
- Create: `mobile/components/TheBaiPhim.tsx`
- Create: `mobile/components/DanhSachPhim.tsx`
- Modify: `mobile/app/(tabs)/index.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

**Interfaces:**
- Produces: `layDanhSachPhim()`, `layChiTietPhim(id)`; component `DanhSachPhim`

- [ ] **Step 1: `movieService.ts`**

```typescript
import apiClient from './apiClient'
export const layDanhSachPhim = (thamSo = {}) =>
  apiClient.get('/movies', { params: thamSo }).then((r) => r.data)
export const layChiTietPhim = (id: string) =>
  apiClient.get(`/movies/${id}`).then((r) => r.data)
```

- [ ] **Step 2: Component `TheBaiPhim`**

Poster `Image`, tên phim, thể loại, rating. `onPress` → `router.push(`/movie/${phim.id}`)`.

- [ ] **Step 3: `index.tsx`**

`FlatList` 2 cột, pull-to-refresh, loading indicator. Filter đơn giản: tab "Đang chiếu" / "Sắp chiếu" (param `trangThai` nếu API hỗ trợ, hoặc filter client).

- [ ] **Step 4: Bottom tabs `_layout.tsx`**

4 tab: Trang chủ, Rạp & lịch, Vé của tôi, Tài khoản — icon + label tiếng Việt.

- [ ] **Step 5: Verify**

Mở app → thấy poster phim từ backend → tap vào 1 phim (Task 5).

---

### Task 5: Chi tiết phim + lịch chiếu

**Files:**
- Create: `mobile/app/movie/[id].tsx`
- Create: `mobile/app/movie/[id]/schedule.tsx`
- Create: `mobile/services/showtimeService.ts` (phần read)
- Create: `mobile/services/cinemaService.ts`
- Create: `mobile/services/regionService.ts`

**Interfaces:**
- Produces:
  - `layLichChieu(maPhim, ngayChieu, maRap?)`
  - `layDanhSachRap(khuVuc?)`
  - `layDanhSachKhuVuc()`

- [ ] **Step 1: Services** (copy chữ ký từ `frontend/src/services/showtimeService.js`, `cinemaService.js`, `regionService.js`)

- [ ] **Step 2: `movie/[id].tsx`**

Banner poster, mô tả, thời lượng, nút "Đặt vé" → `/movie/[id]/schedule`.

- [ ] **Step 3: `movie/[id]/schedule.tsx`**

Chọn ngày (7 ngày tới), chọn rạp (dropdown hoặc horizontal scroll), hiển thị suất chiếu dạng chip. Tap suất → `/booking/[showtimeId]` với params `phim`.

- [ ] **Step 4: Verify**

Chọn phim → lịch chiếu → thấy suất theo ngày/rạp → tap suất mở màn ghế.

---

### Task 6: Chọn ghế + giữ ghế

**Files:**
- Create: `mobile/components/SoDoGhe.tsx`
- Create: `mobile/app/booking/[id].tsx`
- Extend: `mobile/services/showtimeService.ts` — `laySoDoGhe`, `giuGheTamThoi`

**Interfaces:**
- Produces: `SoDoGhe` nhận `danhSachGhe`, `gheChon`, `onChonGhe`

- [ ] **Step 1: `laySoDoGhe(id)` và `giuGheTamThoi(maSuatChieu, danhSachGheChon, maNguoiDung)`**

- [ ] **Step 2: `SoDoGhe.tsx`**

Grid ghế: màu theo trạng thái (trống/đã bán/đang giữ/đã chọn). Hàng A–Z, cột số. `ScrollView` horizontal nếu nhiều cột.

- [ ] **Step 3: `booking/[id].tsx`**

- Yêu cầu login (`router.push('/login')` nếu chưa)
- Chọn ghế → tính `tienGhe`
- Nút "Tiếp tục" → gọi `giuGheTamThoi` → navigate `/booking/[id]/combo` với state: `gheChon`, `tienGhe`, `phim`, `giayConLai`

- [ ] **Step 4: Verify**

Chọn 2 ghế → giữ ghế thành công → sang combo.

---

### Task 7: Combo bắp nước

**Files:**
- Create: `mobile/utils/comboFood.ts` (copy từ `frontend/src/utils/comboFood.js`)
- Create: `mobile/utils/formatters.ts` (copy `dinhDangTien`)
- Create: `mobile/app/booking/[id]/combo.tsx`

**Interfaces:**
- Produces: `taoDanhSachComboDat(soLuongCombo)`, `dinhDangTien`

- [ ] **Step 1: Port `comboFood.ts` và `formatters.ts` từ web**

- [ ] **Step 2: `combo.tsx`**

Danh sách combo (+/−), tổng tiền bắp nước, nút "Thanh toán" → `/booking/[id]/payment` kèm state đầy đủ.

- [ ] **Step 3: Verify**

Chọn combo → tổng tiền cập nhật → sang payment.

---

### Task 8: Thanh toán + tạo vé PENDING

**Files:**
- Create: `mobile/utils/hinhThucThanhToan.ts` (copy từ web)
- Create: `mobile/services/ticketService.ts`
- Create: `mobile/components/BoDemGiuGhe.tsx`
- Create: `mobile/app/booking/[id]/payment.tsx`

**Interfaces:**
- Produces: `taoVeMoi(duLieu)`, `DANH_SACH_HINH_THUC`, `taoNoiDungChuyenKhoan`

- [ ] **Step 1: Port `hinhThucThanhToan.ts`**

- [ ] **Step 2: `ticketService.ts`**

```typescript
import apiClient from './apiClient'
export const taoVeMoi = (duLieu: object) =>
  apiClient.post('/bookings/create-ticket', duLieu).then((r) => r.data)
export const layDanhSachVeCuaToi = (maNguoiDung: string, tuKhoa = '') =>
  apiClient.get('/tickets/my-tickets', { params: { maNguoiDung, ...(tuKhoa ? { tuKhoa } : {}) } }).then((r) => r.data)
```

- [ ] **Step 3: `BoDemGiuGhe.tsx`**

Đếm ngược MM:SS; hết giờ → `Alert` + `router.replace` về booking.

- [ ] **Step 4: `payment.tsx`** (logic mirror `PaymentPage.jsx`)

- Chọn VCB/BIDV/MoMo
- `xacNhanDatVe` gọi `taoVeMoi` với payload đầy đủ
- Sau tạo vé: hiện STK, nội dung CK (`taoNoiDungChuyenKhoan`), nút sao chép (`expo-clipboard`)
- Nút "Xem vé của tôi"

- [ ] **Step 5: Verify**

Tạo vé PENDING → hiện thông tin CK → admin xác nhận trên web → vé chuyển PAID.

---

### Task 9: Vé của tôi + QR

**Files:**
- Create: `mobile/components/TheVeQr.tsx`
- Modify: `mobile/app/(tabs)/tickets.tsx`
- Create: `mobile/app/ticket/[id].tsx`

**Interfaces:**
- Produces: `TheVeQr` render QR từ `maQrCode`

- [ ] **Step 1: `tickets.tsx`**

`useAuth` — nếu chưa login redirect login. `layDanhSachVeCuaToi(nguoiDung.id)`. FlatList thẻ vé: tên phim, suất, ghế, trạng thái (`tenTrangThaiVe`).

- [ ] **Step 2: `TheVeQr.tsx`**

```typescript
import QRCode from 'react-native-qrcode-svg'
// <QRCode value={maQrCode} size={200} />
```

- [ ] **Step 3: `ticket/[id].tsx`**

Chi tiết vé + QR lớn (chỉ hiện QR khi `trangThai === 'PAID'`).

- [ ] **Step 4: Verify**

Sau admin confirm → pull refresh → thấy "Đã thanh toán" + QR quét được.

---

### Task 10: Tab Rạp & lịch + ViTriRapContext

**Files:**
- Create: `mobile/context/ViTriRapContext.tsx`
- Modify: `mobile/app/(tabs)/cinemas.tsx`
- Modify: `mobile/app/_layout.tsx` — wrap `ViTriRapProvider`

**Interfaces:**
- Produces: `useViTriRap()` → `{ khuVucChon, datKhuVucChon, rapChon, datRapChon }`

- [ ] **Step 1: ViTriRapContext** (mirror web `ViTriRapContext`)

Lưu khu vực/rạp đã chọn vào AsyncStorage.

- [ ] **Step 2: `cinemas.tsx`**

Picker khu vực → danh sách rạp → chọn ngày → `layLichChieuHomNayTheoRap(maRap, ngayChieu)` → tap suất → booking flow.

- [ ] **Step 3: Verify**

Chọn rạp từ tab Rạp → xem lịch hôm nay → đặt vé end-to-end.

---

### Task 11: Backend LAN bind + script dev

**Files:**
- Modify: `src/main/resources/application.properties`
- Create: `start-mobile.cmd`
- Modify: `NOTE`

- [ ] **Step 1: `application.properties`**

```properties
server.address=0.0.0.0
```

(Giữ các dòng hiện có, chỉ thêm dòng này.)

- [ ] **Step 2: `start-mobile.cmd`**

```bat
@echo off
cd /d %~dp0mobile
if not exist .env copy .env.example .env
echo Hay sua EXPO_PUBLIC_API_BASE_URL trong mobile\.env thanh IP LAN cua may tinh.
npx expo start
```

- [ ] **Step 3: Cập nhật `NOTE` — mục 4 MOBILE**

Hướng dẫn: tìm IP (`ipconfig`), sửa `.env`, chạy 3 terminal (backend, frontend, mobile), cài Expo Go Android, quét QR.

- [ ] **Step 4: Verify end-to-end**

| Terminal | Lệnh |
|----------|------|
| 1 | `.\start-backend.cmd` |
| 2 | `.\start-frontend.cmd` |
| 3 | `.\start-mobile.cmd` |

Web mở trên PC, app chạy Expo Go, cùng đặt vé thành công.

---

## Self-Review Checklist

| Spec requirement | Task |
|------------------|------|
| Expo Android app | Task 1 |
| Auth login/register | Task 2–3 |
| Home + movie list | Task 4 |
| Movie detail + schedule | Task 5 |
| Seat booking + hold | Task 6 |
| Combo | Task 7 |
| Payment 3 methods + PENDING | Task 8 |
| My tickets + QR | Task 9 |
| Cinema widget tab | Task 10 |
| Dev workflow + NOTE | Task 11 |
| No admin on mobile | (excluded by design) |
| Vietnamese UI | All UI tasks |
| camelCase code | All code tasks |

---

## Execution Handoff

Plan complete. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch fresh subagent per task, review between tasks

**2. Inline Execution** — implement tasks in this session with checkpoints

Which approach?
