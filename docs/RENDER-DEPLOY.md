# Triển khai Cinema trên Render

## Backend: Web Service dùng Docker

- Root Directory: để trống (gốc repository).
- Dockerfile Path: `./Dockerfile`.
- Health Check Path: `/api/v1/health`.
- `SPRING_PROFILES_ACTIVE=render` (đổi giá trị `atlas`/`local` cũ nếu đang có).
- `SPRING_DATA_MONGODB_URI`: URI MongoDB Atlas có tên database. Profile render cũng nhận `MONGODB_URI` nếu biến thứ nhất chưa được đặt.
- `APP_FRONTEND_URL`: URL frontend thực tế, không có dấu `/` cuối.
- `APP_BACKEND_URL`: URL backend thực tế; có thể bỏ qua nếu dùng URL Render mặc định vì ứng dụng đọc `RENDER_EXTERNAL_URL`.
- `TMDB_ENABLED=true` và `TMDB_API_KEY`: cần cho tính năng lấy thông tin phim từ TMDB.
- Nếu dùng Gemini: `GEMINI_ENABLED=true`, `GEMINI_API_KEY` và `GEMINI_MODEL` là model tài khoản đang hỗ trợ.

Không đưa mật khẩu/API key vào source. Profile render yêu cầu URI database qua Environment, không dùng tài khoản mặc định trong cấu hình cũ. Trong MongoDB Atlas, cho phép địa chỉ outbound của dịch vụ Render trong Network Access và kiểm tra quyền tài khoản database.

`PORT` được Render cấp tự động; ứng dụng lắng nghe trên `0.0.0.0`. Docker giới hạn heap 256 MB, chừa bộ nhớ cho phần còn lại của JVM. Connection pool MongoDB tối đa 10 kết nối.

Image Java không có Python/Scrapling hoặc SearXNG. Luồng lấy thông tin phim dùng TMDB, chỉ gọi Wikipedia khi thiếu mô tả; Gemini được dùng theo cấu hình. Chỉ đặt `SEARXNG_URL` nếu đã có một dịch vụ SearXNG truy cập được từ Render. Không đặt địa chỉ `127.0.0.1:8888` của máy cá nhân.

## Frontend: Static Site

- Root Directory: `frontend`.
- Build Command: `npm ci && npm run build`.
- Publish Directory: `dist`.
- `VITE_API_URL=https://<backend-cua-ban>.onrender.com/api/v1`.
- Rewrite: `/*` → `/index.html`, action `Rewrite` (để mở trực tiếp `/admin/movies` và các trang khác).

Biến `VITE_API_URL` được đóng vào JavaScript lúc build: sau khi đổi phải deploy lại frontend. URL backend trong repository chỉ là giá trị hiện có; cần đối chiếu với tên dịch vụ thật.

## Kiểm tra sau deploy

1. `GET <backend>/api/v1/health`: HTTP 200 và `{"status":"UP"}` khi ứng dụng đã sẵn sàng; HTTP 503 khi đang khởi động.
2. `GET <backend>/api/v1/health/database`: HTTP 200 khi ping database thành công, 503 khi kết nối lỗi. Endpoint này không trả thông tin đăng nhập hoặc chi tiết lỗi.
3. `GET <backend>/api/v1/movies?size=1`: kiểm tra API dữ liệu.
4. Mở frontend và xem Network: request phải đến đúng backend, không phải localhost. Kiểm tra trang chủ và quản trị phim.
5. Nếu backend khởi động thất bại, xem Logs: URI/Network Access Atlas, thiếu biến môi trường, hoặc lỗi index cần sửa theo thông báo cụ thể. Giữ cơ chế tạo index để không bỏ các ràng buộc dữ liệu.

## Tải chậm lần đầu

Render Free tạm dừng Web Service sau 15 phút không có truy cập, lần tiếp theo thường mất khoảng một phút để khởi động lại. Tối ưu source không loại bỏ được thời gian này. Nếu cần luôn phản hồi ngay, dùng instance không tự ngủ; Static Site cho frontend không cần chờ khởi động Java.

Frontend có timeout 90 giây cho API thường và 180 giây cho AI, không tự gửi lại thao tác ghi dữ liệu. Trang chủ có thông báo và nút thử lại khi tải dữ liệu thất bại.

Tham khảo: https://render.com/docs/free và https://render.com/docs/web-services
