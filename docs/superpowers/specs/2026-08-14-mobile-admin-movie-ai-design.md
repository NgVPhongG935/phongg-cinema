# Mobile admin: form phim đầy đủ + AI Soạn Nội Dung

Ngày: 2026-08-14  
Phạm vi: `mobile/app/admin/movies/[id].tsx` + `mobile/services/aiService.ts`

## Mục tiêu
Màn Thêm/Sửa phim trên app khớp web: đủ field và nút **AI Soạn Nội Dung** gọi `POST /api/v1/ai/generate-movie-info`.

## Fields
tenPhim, thoiLuong, theLoai, dienVien, daoDien, ngonNgu, gioiHanTuoi (P/T13/T16/T18), trangThai, anhPoster (+ preview), duongDanTrailer, moTa.

## AI
Nhập tên → bấm AI → điền form từ response; loading + thông báo thành công/cảnh báo/lỗi như web.

## Không làm
AI xếp lịch suất chiếu; đổi API backend.
