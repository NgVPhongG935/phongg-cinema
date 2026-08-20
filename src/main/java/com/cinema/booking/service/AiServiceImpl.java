package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.dto.NgauCanhChatAi;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {
    private static final DateTimeFormatter DINH_DANG_SUAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"));
    private static final DateTimeFormatter DINH_DANG_NGAY =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
    private static final int GIA_CO_BAN_THAM_CHIEU = 90000;
    private static final int PHU_THU_COUPLE = 80000;
    private static final int GIA_COUPLE_THAM_CHIEU = 200000;
    private static final int GIOI_HAN_SUAT_HIEN_THI = 15;

    private static final String BAN_TRI_THUC = """
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
            - Tra loi ngan gon, ro rang, de doc.

            QUY TAC DINH DANG (BAT BUOC):
            - Dung danh sach co dau gach dau dong "- " hoac danh so "1., 2." cho tung muc.
            - Moi ten phim, lich chieu, dia chi rap BAT BUOC nam tren MOT dong rieng biet.
            - De mot dong trong giua cac doan van de tao khoang tho.
            - KHONG gop nhieu muc tren cung mot dong bang dau cham tron hoac dau phay dai.
            - KHONG dung markdown phuc tap (khong # heading, khong link, khong in dam **).
            - Khi noi ve phim cu the, LUON liet ke suat chieu sap toi (gio, gia tu) neu co trong du lieu — moi suat mot dong.

            QUY TAC DU LIEU (BAT BUOC):
            - BAT BUOC goi tools searchMovie / getShowtimes / getCinemaLocation de tra cuu DB truoc khi tra loi ve phim, suat, rap.
            - KHONG bia ten phim, gia ve hay lich chieu. Chi dung ket qua tra ve tu tools.
            - Neu searchMovie tra ve found=false: tra loi thang than rang he thong chua co phim khach hoi, roi goi y phim dang chieu tu truong showingMovies.
            - PHAI dung DUNG ten phim khach hoi trong cau tra loi. KHONG tu y doi sang phim khac.

            QUY TAC GOI Y THEO TAM TRANG — EMOTION-BASED MOVIE RECOMMENDATION (BAT BUOC khi khach chia se cam xuc):

            BUOC 1 — NHAN DIEN TAM TRANG (Emotion Recognition):
            Doc cau noi cua khach de xac dinh 1 trong cac tam trang:
            - Met moi / Stress / Muon giai tri xả hoi
            - That tinh / Buon / Muon chua lanh
            - Chan chan / Nham chan
            - Vui ve / Hung phan / Di cung ban be
            Luon BAT DAU bang 1 cau ngan gon chia se/dong cam voi tam trang do.

            BUOC 2 — KHOP PHIM TU DATABASE (chi phim DANG CHIEU trong DU LIEU THOI GIAN THUC hoac ket qua searchMovie):
            Chon 1-2 phim phu hop nhat, KHONG bia ten phim:
            - Met moi / Stress: Hai huoc, Hanh dong giai stress.
            - That tinh / Buon: Tinh cam nhe nhang, Gia dinh am ap, Tam ly ket tich cuc.
            - Chan chan: Hai, Hoat hinh, Phim giai tri nhe.
            - Vui ve / Di ban be: Bom tan, Hanh dong phieu luu kich tinh.

            BUOC 3 — DINH DANG TIN NHAN (BAT BUOC, khong viet dinh 1 doan dai):
            Dong 1: Cau dong cam ngan gon.
            Dong 2-3: Moi phim MOT dong rieng, dung mau:
            - 🎬 [Ten Phim]: [Ly do ngan gon vi sao hop tam trang]
            Dong cuoi: Hoi nhe nhang xem khach muon xem lich chieu rap nao.
            Vi du mau:
            Em hieu anh/chi dang met moi ạ — xem phim giai tri chut la thấy nhe long hon.

            - 🎬 Deadpool & Wolverine: Hai + hanh dong xả stress, xem la quen met moi.
            - 🎬 Inside Out 2: Hoat hinh nhe nhang, giup thu gian ma van vui.

            Anh/chi muon em bao lich chieu rap nao de xem nhung phim nay khong ạ?
            """;

    private final MovieRepository khoPhim;
    private final ShowtimeRepository khoSuatChieu;
    private final CinemaRepository khoRap;
    private final AiChatToolHandler congCuChat;
    private final GeminiApiClient geminiClient;
    private final ObjectMapper boChuyenDoiJson;

    @Value("${gemini.enabled:false}")
    private boolean geminiBat;

    private NgauCanhChatAi ngauCanhHienTai;

    @Override
    public String tuVanKhachHang(String cauHoiNguoiDung, NgauCanhChatAi ngauCanh) {
        ngauCanhHienTai = ngauCanh != null ? ngauCanh : new NgauCanhChatAi();
        try {
            if (cauHoiNguoiDung == null || cauHoiNguoiDung.isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui long nhap cau hoi");

            String cauHoi = cauHoiNguoiDung.trim();
            if (cauHoi.length() <= 2 || cauHoi.matches("^(ha|hi|ok|a|e|u|o)$"))
                return ketThucTraLoi("Dạ anh/chị muốn hỏi về địa chỉ rạp, giá vé, phim đang chiếu hay cách đặt vé ạ?");

            if (chuanHoaKhongDau(cauHoi).matches(".*(la sao|sao vay|gi vay|sao la|la gi|khong hieu|huh|wtf).*"))
                return ketThucTraLoi(traLoiGiaiThichBot());

            String tuKhoaPhim = trichTuKhoaTenPhim(cauHoi);
            if (tuKhoaPhim != null && laCauHoiLienQuanTenPhim(chuanHoaKhongDau(cauHoi))) {
                List<Movie> phimTimThay = congCuChat.timPhimTheoTuKhoa(tuKhoaPhim, 1);
                if (phimTimThay.isEmpty())
                    return ketThucTraLoi(traLoiKhongTimThayPhim(tuKhoaPhim));
            }

            String traLoiNhanh = traLoiNhanhTuTriThuc(cauHoi);
            if (traLoiNhanh != null) {
                return ketThucTraLoi(traLoiNhanh);
            }

            if (!geminiBat || !khoaApiHopLe())
                return ketThucTraLoi(traLoiKhiKhongHieu(cauHoi));

            if (!geminiClient.coKhoaHopLe()) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                        "Chua cau hinh GEMINI_API_KEYS hoac GEMINI_API_KEY. Lay key tai https://aistudio.google.com/apikey");
            }

            String duLieuThoiGianThuc = taoDuLieuThoiGianThuc(cauHoi);
            String loiNhacHeThong = BAN_TRI_THUC + "\n\nDU LIEU THOI GIAN THUC (neu co):\n" + duLieuThoiGianThuc;

            try {
                String ketQua = goiGemini(loiNhacHeThong, cauHoi);
                return ketThucTraLoi(ketQua);
            } catch (ResponseStatusException ngoaiLe) {
                String traLoiKhiLoi = traLoiKhiGeminiLoi(cauHoi, ngoaiLe.getReason());
                if (traLoiKhiLoi != null) return ketThucTraLoi(traLoiKhiLoi);
                throw new ResponseStatusException(ngoaiLe.getStatusCode(), chuyenLoiGeminiThanhThongBao(ngoaiLe.getReason()));
            } catch (Exception ngoaiLe) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Khong ket noi Gemini. Kiem tra GEMINI_API_KEYS hoac GEMINI_API_KEY.");
            }
        } finally {
            ngauCanhHienTai = null;
        }
    }

    /** Chuan hoa dinh dang tra loi: tach bullet inline, gon dong trong. */
    private String ketThucTraLoi(String traLoi) {
        return chuanHoaDinhDangTraLoi(traLoi);
    }

    private String chuanHoaDinhDangTraLoi(String traLoi) {
        if (traLoi == null || traLoi.isBlank()) return traLoi;
        return traLoi
                .replace("\r\n", "\n")
                .replaceAll("\\s*•\\s*", "\n- ")
                .replaceAll("\n{3,}", "\n\n")
                .trim();
    }

    private String goiGemini(String loiNhacHeThong, String cauHoi) {
        String model = geminiClient.getModelMacDinh();
        try {
            String ketQua = goiGeminiCoTools(model, loiNhacHeThong, cauHoi);
            if (ketQua != null && !ketQua.isBlank()) return ketQua;
        } catch (ResponseStatusException ignored) {
            /* thu fallback prompt gop */
        }
        String promptGop = loiNhacHeThong + "\n\nCAU HOI KHACH: " + cauHoi;
        String ketQuaGop = thuGoiModelDonGian(model, promptGop);
        if (ketQuaGop != null && !ketQuaGop.isBlank()) return ketQuaGop;
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini khong tra ve noi dung. Kiem tra API key.");
    }

    private String goiGeminiCoTools(String model, String systemText, String cauHoi) {
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of("role", "user", "parts", List.of(Map.of("text", cauHoi))));
        Map<String, Object> toolConfig = Map.of("functionDeclarations", congCuChat.layKhaiBaoTools());

        for (int vong = 0; vong < 6; vong++) {
            Map<String, Object> body = new HashMap<>();
            body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemText))));
            body.put("contents", contents);
            body.put("tools", List.of(toolConfig));

            String raw = goiGeminiRaw(model, body);
            JsonNode root;
            try {
                root = boChuyenDoiJson.readTree(raw);
            } catch (com.fasterxml.jackson.core.JsonProcessingException ngoaiLe) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Phan hoi Gemini khong hop le");
            }

            JsonNode parts = root.at("/candidates/0/content/parts");
            if (parts.isMissingNode() || !parts.isArray()) return null;

            StringBuilder textOut = new StringBuilder();
            List<JsonNode> functionCalls = new ArrayList<>();
            for (JsonNode part : parts) {
                if (part.has("text")) textOut.append(part.get("text").asText());
                if (part.has("functionCall")) functionCalls.add(part);
            }

            if (functionCalls.isEmpty()) {
                String ketQua = textOut.toString().trim();
                return ketQua.isBlank() ? null : ketQua;
            }

            List<Object> modelParts = new ArrayList<>();
            for (JsonNode part : parts) {
                if (part.has("functionCall")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> fc = boChuyenDoiJson.convertValue(part.get("functionCall"), Map.class);
                    modelParts.add(Map.of("functionCall", fc));
                } else if (part.has("text")) {
                    modelParts.add(Map.of("text", part.get("text").asText()));
                }
            }
            contents.add(Map.of("role", "model", "parts", modelParts));

            List<Object> responseParts = new ArrayList<>();
            for (JsonNode part : functionCalls) {
                JsonNode fc = part.get("functionCall");
                String name = fc.get("name").asText();
                JsonNode args = fc.has("args") ? fc.get("args") : boChuyenDoiJson.createObjectNode();
                var toolResult = congCuChat.thucThiFunctionCall(name, args);
                @SuppressWarnings("unchecked")
                Map<String, Object> responseMap = boChuyenDoiJson.convertValue(toolResult, Map.class);
                responseParts.add(Map.of(
                        "functionResponse", Map.of(
                                "name", name,
                                "response", responseMap
                        )
                ));
            }
            contents.add(Map.of("role", "user", "parts", responseParts));
        }
        return null;
    }

    private String thuGoiModel(String model, String systemText, String userText) {
        Map<String, Object> body = Map.of(
                "systemInstruction", Map.of("parts", List.of(Map.of("text", systemText))),
                "contents", List.of(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userText))
                ))
        );
        return trichXuatVanBan(goiGeminiRaw(model, body));
    }

    private String thuGoiModelDonGian(String model, String prompt) {
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        return trichXuatVanBan(goiGeminiRaw(model, body));
    }

    private String goiGeminiRaw(String model, Map<String, Object> body) {
        return geminiClient.generateContent(model, body);
    }

    private String trichXuatVanBan(String phanHoi) {
        if (phanHoi == null) return null;
        try {
            JsonNode noiDung = boChuyenDoiJson.readTree(phanHoi).at("/candidates/0/content/parts/0/text");
            if (noiDung.isMissingNode()) {
                JsonNode loi = boChuyenDoiJson.readTree(phanHoi).path("error").path("message");
                if (!loi.isMissingNode())
                    throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, loi.asText());
                return null;
            }
            return noiDung.asText().trim();
        } catch (com.fasterxml.jackson.core.JsonProcessingException ngoaiLe) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Phan hoi Gemini khong hop le");
        }
    }

    /** Tra loi nhanh khong can Gemini — cac cau hoi thuong gap */
    private String traLoiNhanhTuTriThuc(String cauHoi) {
        String chuan = chuanHoaKhongDau(cauHoi);
        Movie phimTim = timPhimTuCauHoi(cauHoi);
        LocalDate ngay = trichNgayTuCauHoi(chuan);

        LoaiTamTrang tamTrang = phatHienTamTrang(chuan);
        if (tamTrang != null)
            return traLoiGoiYTheoTamTrang(tamTrang);

        if (ngay != null && chuan.matches(".*(phim chieu|chieu vao|phim vao|suat chieu).*")
                && !(phimTim != null && laCauHoiVePhimCuThe(chuan, phimTim)))
            return traLoiPhimTheoNgay(ngay);

        if (ngay != null && phimTim != null)
            return traLoiSuatPhimTheoNgay(phimTim, ngay);

        if (ngay != null && chuan.matches(".*(chieu|suat|phim|co phim).*"))
            return traLoiPhimTheoNgay(ngay);

        if (phimTim != null && laCauHoiVeGia(chuan, phimTim))
            return traLoiGiaVePhim(phimTim, chuan);

        if (phimTim != null && (laCauHoiHoiCoKhong(chuan) || laCauHoiVePhimCuThe(chuan, phimTim)))
            return traLoiPhimDayDu(phimTim);

        if (laCauHoiViTri(chuan))
            return traLoiViTriRap();

        if ((chuan.matches(".*(gia ve|tien ve|sweetbox).*") || (chuan.contains("gia") && chuan.contains("ve")))
                && phimTim == null)
            return traLoiGiaVeChung();

        if (chuan.matches(".*(soat ve|qr|vao rap|check in).*"))
            return "Anh/chị mở mã QR trên app/web (sau khi vé đã PAID), nhân viên quét tại cửa. Phòng chiếu mở cửa trước 30 phút so với giờ suất ạ.";

        if (chuan.matches(".*(thanh toan|dat ve|momo|chuyen khoan|pending|paid).*"))
            return "Sau khi đặt vé (PENDING), anh/chị chuyển khoản/Momo theo hướng dẫn. Admin xác nhận «Đã nhận tiền» → vé PAID và hiện mã QR PHONGG:{mã vé} để soát vé ạ.";

        String theLoai = timTheLoaiTuCauHoi(chuan);
        if (theLoai != null && laCauHoiHoiCoKhong(chuan))
            return traLoiTheLoaiCoKhong(theLoai, chuan);

        if (theLoai != null && laCauHoiLichChieu(chuan))
            return traLoiLichTheoTheLoai(theLoai);

        if (theLoai != null && laCauHoiGoiYPhim(chuan))
            return traLoiGoiYTheLoai(theLoai);

        if (laCauHoiLichChieu(chuan))
            return traLoiLichChieuNgan();

        if (chuan.matches(".*(phim dang chieu|danh sach phim|co phim gi|phim hot).*")
                || chuan.equals("phim dang chieu") || chuan.equals("phim"))
            return traLoiDanhSachPhimNgan();

        if (chuan.contains("phim") && laCauHoiGoiYPhim(chuan))
            return traLoiGoiYPhimChung();

        if (phimTim != null && chuan.matches(".*(co chieu|chieu k|chieu khong|show).*"))
            return traLoiPhimDayDu(phimTim);

        if (phimTim != null)
            return traLoiPhimDayDu(phimTim);

        return null;
    }

    private String traLoiPhimDayDu(Movie phim) {
        List<Showtime> suatList = locSuatSapToi(phim.getId(), GIOI_HAN_SUAT_HIEN_THI);
        Map<String, Cinema> rapMap = layRapMap();
        StringBuilder sb = new StringBuilder("Dạ có ạ! «").append(phim.getTitle()).append("» đang chiếu tại PhongG Cinema.");
        if (phim.getGenres() != null && !phim.getGenres().isEmpty())
            sb.append("\n• Thể loại: ").append(String.join(", ", phim.getGenres()));
        if (phim.getDuration() != null)
            sb.append("\n• Thời lượng: ").append(phim.getDuration()).append(" phút");
        if (phim.getDescription() != null && !phim.getDescription().isBlank())
            sb.append("\n• ").append(rutGon(phim.getDescription(), 100));

        themThongTinViTriKhach(sb);

        if (suatList.isEmpty()) {
            sb.append("\n\nHiện chưa có suất chiếu sắp tới trong hệ thống ạ. Anh/chị thử lại sau hoặc xem trang chủ PhongG Cinema.");
            return sb.toString().trim();
        }

        java.util.Set<String> maRapCoPhim = suatList.stream().map(Showtime::getMaRap).collect(Collectors.toSet());
        List<Cinema> rapCoPhim = maRapCoPhim.stream()
                .map(rapMap::get)
                .filter(java.util.Objects::nonNull)
                .toList();
        Cinema rapGanCoPhim = timRapGanNhat(rapCoPhim);
        if (rapGanCoPhim != null) {
            sb.append("\n\nRạp gần anh/chị nhất có «").append(phim.getTitle()).append("»:");
            sb.append("\n").append(dinhDangChiTietRap(rapGanCoPhim, true));
        }

        Map<String, List<Showtime>> theoRap = suatList.stream()
                .collect(Collectors.groupingBy(Showtime::getMaRap));
        List<Cinema> rapSapXep = sapXepRapTheoViTri(rapCoPhim);
        sb.append("\n\nSuất chiếu theo rạp (").append(suatList.size()).append(" suất):");
        for (Cinema rap : rapSapXep) {
            List<Showtime> suatTaiRap = theoRap.getOrDefault(rap.getId(), List.of());
            if (suatTaiRap.isEmpty()) continue;
            sb.append("\n\n«").append(rap.getTenRap()).append("»");
            if (rapGanCoPhim != null && rap.getId().equals(rapGanCoPhim.getId()))
                sb.append(" — gần anh/chị nhất có phim này");
            if (rap.getDiaChi() != null && !rap.getDiaChi().isBlank())
                sb.append("\nĐịa chỉ: ").append(rap.getDiaChi());
            Double km = tinhKhoangCachRap(rap);
            if (km != null)
                sb.append(" (").append(dinhDangKhoangCach(km)).append(")");
            for (Showtime suat : suatTaiRap)
                sb.append("\n").append(dinhDangDongSuatGon(suat));
        }

        int giaTu = suatList.stream()
                .filter(s -> s.getGiaVeTu() != null)
                .mapToInt(s -> s.getGiaVeTu().intValue())
                .min()
                .orElse(GIA_CO_BAN_THAM_CHIEU);
        sb.append("\n\nGiá vé từ ").append(dinhDangTien(giaTu)).append("/ghế (ghế thường). Anh/chị chọn suất trên web để đặt vé ạ.");
        return sb.toString().trim();
    }

    private void themThongTinViTriKhach(StringBuilder sb) {
        if (ngauCanhHienTai == null) return;
        if (ngauCanhHienTai.coGps()) {
            Cinema rapGan = timRapGanNhat(layTatCaRap());
            if (rapGan != null) {
                sb.append("\n\nRạp PhongG gần anh/chị nhất:");
                sb.append("\n").append(dinhDangChiTietRap(rapGan, true));
            }
        } else if (ngauCanhHienTai.coKhuVuc()) {
            sb.append("\n\nAnh/chị chọn khu vực: ").append(ngauCanhHienTai.getKhuVuc());
            List<Cinema> rapTrongKhu = layTatCaRap().stream()
                    .filter(r -> r.getKhuVuc() != null && r.getKhuVuc().equals(ngauCanhHienTai.getKhuVuc()))
                    .toList();
            if (!rapTrongKhu.isEmpty()) {
                sb.append(" — có ").append(rapTrongKhu.size()).append(" rạp PhongG trong khu vực này.");
                rapTrongKhu.stream().limit(3).forEach(r ->
                        sb.append("\n• ").append(r.getTenRap()).append(" — ").append(r.getDiaChi() != null ? r.getDiaChi() : ""));
            }
        }
    }

    private String traLoiViTriRap() {
        List<Cinema> danhSachRap = sapXepRapTheoViTri(layTatCaRap());
        if (danhSachRap.isEmpty())
            return "PhongG Cinema Hùng Vương Plaza tại 126 Hùng Vương, Phường 12, Quận 5, TP.HCM ạ.";
        StringBuilder sb = new StringBuilder("Hệ thống rạp PhongG Cinema:");
        int batDau = 0;
        if (ngauCanhHienTai != null && ngauCanhHienTai.coGps()) {
            sb.append("\n\nRạp gần anh/chị nhất:\n").append(dinhDangChiTietRap(danhSachRap.get(0), true));
            batDau = 1;
            if (danhSachRap.size() > 1)
                sb.append("\n\nCác rạp khác:");
        }
        for (int i = batDau; i < danhSachRap.size() && i < batDau + 7; i++)
            sb.append("\n\n").append(dinhDangChiTietRap(danhSachRap.get(i), ngauCanhHienTai != null && ngauCanhHienTai.coGps()));
        sb.append("\n\nAnh/chị đặt vé online trên web hoặc app PhongG Cinema ạ.");
        return sb.toString().trim();
    }

    private String traLoiGiaVeChung() {
        StringBuilder sb = new StringBuilder("Giá vé tham chiếu tại PhongG Cinema:\n"
                + "• Ghế Thường: 80.000đ\n• Ghế VIP: 110.000đ\n• Ghế Đôi Sweetbox: 200.000đ/cặp");
        themThongTinViTriKhach(sb);
        sb.append("\n\nGiá có thể thay đổi theo suất chiếu. Hỏi tên phim cụ thể để em báo giá và suất chiếu chi tiết ạ.");
        return sb.toString().trim();
    }

    private List<Cinema> layTatCaRap() {
        return khoRap.findAll();
    }

    private Map<String, Cinema> layRapMap() {
        return layTatCaRap().stream()
                .collect(Collectors.toMap(Cinema::getId, r -> r, (a, b) -> a));
    }

    private Cinema timRapGanNhat(List<Cinema> danhSachRap) {
        List<Cinema> sapXep = sapXepRapTheoViTri(danhSachRap);
        return sapXep.isEmpty() ? null : sapXep.get(0);
    }

    private List<Cinema> sapXepRapTheoViTri(List<Cinema> danhSachRap) {
        if (ngauCanhHienTai != null && ngauCanhHienTai.coKhuVuc()) {
            return danhSachRap.stream()
                    .filter(r -> r.getKhuVuc() != null && r.getKhuVuc().equals(ngauCanhHienTai.getKhuVuc()))
                    .sorted(java.util.Comparator.comparing(Cinema::getTenRap, String.CASE_INSENSITIVE_ORDER))
                    .toList();
        }
        if (ngauCanhHienTai == null || !ngauCanhHienTai.coGps())
            return danhSachRap.stream()
                    .sorted(java.util.Comparator.comparing(Cinema::getTenRap, String.CASE_INSENSITIVE_ORDER))
                    .toList();
        return danhSachRap.stream()
                .sorted((a, b) -> {
                    Double ka = tinhKhoangCachRap(a);
                    Double kb = tinhKhoangCachRap(b);
                    if (ka == null && kb == null) return 0;
                    if (ka == null) return 1;
                    if (kb == null) return -1;
                    return Double.compare(ka, kb);
                })
                .toList();
    }

    private Double tinhKhoangCachRap(Cinema rap) {
        if (ngauCanhHienTai == null || !ngauCanhHienTai.coGps() || rap.getViDo() == null || rap.getKinhDo() == null)
            return null;
        return tinhKhoangCachKm(
                ngauCanhHienTai.getViDo(), ngauCanhHienTai.getKinhDo(),
                rap.getViDo(), rap.getKinhDo());
    }

    private double tinhKhoangCachKm(double viDo1, double kinhDo1, double viDo2, double kinhDo2) {
        double rad = Math.PI / 180;
        double dViDo = (viDo2 - viDo1) * rad;
        double dKinhDo = (kinhDo2 - kinhDo1) * rad;
        double a = Math.sin(dViDo / 2) * Math.sin(dViDo / 2)
                + Math.cos(viDo1 * rad) * Math.cos(viDo2 * rad) * Math.sin(dKinhDo / 2) * Math.sin(dKinhDo / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String dinhDangKhoangCach(double km) {
        if (km < 1) return Math.round(km * 1000) + " m";
        return String.format(Locale.forLanguageTag("vi-VN"), "%.1f km", km).replace(",", ".");
    }

    private String dinhDangChiTietRap(Cinema rap, boolean hienKhoangCach) {
        StringBuilder sb = new StringBuilder("• ").append(rap.getTenRap());
        if (rap.getDiaChi() != null && !rap.getDiaChi().isBlank())
            sb.append("\n  Địa chỉ: ").append(rap.getDiaChi());
        if (hienKhoangCach) {
            Double km = tinhKhoangCachRap(rap);
            if (km != null)
                sb.append("\n  Cách anh/chị: ").append(dinhDangKhoangCach(km));
        }
        return sb.toString();
    }

    private String dinhDangDongSuatGon(Showtime suat) {
        StringBuilder dong = new StringBuilder("  • ").append(DINH_DANG_SUAT.format(suat.getThoiGianBatDau()));
        if (suat.getMaPhong() != null && !suat.getMaPhong().isBlank())
            dong.append(" — phòng ").append(suat.getMaPhong());
        if (suat.getGiaVeTu() != null)
            dong.append(" — từ ").append(dinhDangTien(suat.getGiaVeTu().intValue()));
        return dong.toString();
    }

    private List<Showtime> locSuatSapToi(String maPhim, int gioiHan) {
        return khoSuatChieu.findAll().stream()
                .filter(s -> maPhim.equals(s.getMaPhim())
                        && s.getThoiGianBatDau() != null
                        && !s.getThoiGianBatDau().isBefore(LocalDateTime.now()))
                .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                .limit(gioiHan)
                .toList();
    }

    private Map<String, String> layTenRapMap() {
        return khoRap.findAll().stream()
                .collect(Collectors.toMap(
                        com.cinema.booking.document.Cinema::getId,
                        com.cinema.booking.document.Cinema::getTenRap,
                        (a, b) -> a));
    }

    private String dinhDangDongSuat(Showtime suat, Map<String, String> tenRap) {
        StringBuilder dong = new StringBuilder("• ").append(DINH_DANG_SUAT.format(suat.getThoiGianBatDau()));
        if (suat.getMaPhong() != null && !suat.getMaPhong().isBlank())
            dong.append(" — phòng ").append(suat.getMaPhong());
        String ten = tenRap.get(suat.getMaRap());
        if (ten != null && !ten.isBlank())
            dong.append(" (").append(ten).append(")");
        if (suat.getGiaVeTu() != null)
            dong.append(" — từ ").append(dinhDangTien(suat.getGiaVeTu().intValue()));
        return dong.toString();
    }

    private boolean laCauHoiVeGia(String chuan, Movie phim) {
        String chuanSach = chuan;
        if (phim != null) {
            String tenChuan = chuanHoaKhongDau(phim.getTitle());
            chuanSach = chuanSach.replace(tenChuan, "");
            for (String token : tenChuan.split("[\\s:&]+")) {
                if (token.length() >= 3)
                    chuanSach = chuanSach.replace(token, "");
            }
        }
        return chuanSach.matches(".*(gia ve|tien ve|bao nhieu|bao tien|bao nhiu|tong tien|tong ve|mua ve|het bao nhieu|tong con|tong bao nhieu).*")
                || chuanSach.matches(".*\\b(gia|tien)\\b.*\\b(ve|nguoi|ng)\\b.*");
    }

    private enum LoaiTamTrang {
        MET_STRESS,
        CHAN_CHUONG,
        BUON_THAT_TINH,
        VUI_BAN_BE
    }

    private LoaiTamTrang phatHienTamTrang(String chuan) {
        if (chuan.matches(".*(vui|phan khoi|hung phan|qua vui|rat vui|di ban|nhom ban|ban be|di choi|hai huoc|di rap).*")
                && !chuan.matches(".*(buon|met|stress|that tin|chia tay).*"))
            return LoaiTamTrang.VUI_BAN_BE;
        if (chuan.matches(".*(chia tay|chua lanh|that tinh|that tin|tan vo|ly di|that vong|dau long|co don|tam trang buon).*")
                || (chuan.contains("buon") && !chuan.matches(".*(buon chan|chan).*")))
            return LoaiTamTrang.BUON_THAT_TINH;
        if (chuan.matches(".*(met moi|met qua|met rai|stress|cang thang|ap luc|kiem qua|mat ngu).*"))
            return LoaiTamTrang.MET_STRESS;
        if (chuan.matches(".*(chan|chan chan|chan cuong|nham chan|buon chan|te qua|khong biet lam gi).*"))
            return LoaiTamTrang.CHAN_CHUONG;
        return null;
    }

    private String traLoiGoiYTheoTamTrang(LoaiTamTrang tamTrang) {
        List<Movie> phimGoiY = layPhimGoiYTheoTamTrang(tamTrang, 2);
        if (phimGoiY.isEmpty()) {
            phimGoiY = khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, 2)).getContent();
        }
        StringBuilder sb = new StringBuilder(cauDongCamTamTrang(tamTrang)).append("\n\n");
        for (Movie phim : phimGoiY) {
            sb.append("- 🎬 ").append(phim.getTitle()).append(": ")
                    .append(lyDoPhimPhuHop(phim, tamTrang)).append("\n");
        }
        sb.append("\n").append(cauKetGoiYTamTrang());
        return sb.toString().trim();
    }

    private String cauDongCamTamTrang(LoaiTamTrang tamTrang) {
        return switch (tamTrang) {
            case MET_STRESS ->
                    "Em hiểu anh/chị đang mệt mỏi hoặc căng thẳng ạ — xem phim giải trí chút là thấy nhẹ lòng hơn.";
            case CHAN_CHUONG ->
                    "Em hiểu anh/chị đang hơi chán ạ — một bộ phim nhẹ nhàng có thể giúp thổi bùng không khí mới.";
            case BUON_THAT_TINH ->
                    "Em hiểu cảm giác của anh/chị ạ — đôi khi một bộ phim ấm áp sẽ giúp lòng bớt nặng.";
            case VUI_BAN_BE ->
                    "Nghe tâm trạng anh/chị đang rất tốt ạ! Đi rạp cùng bạn bè thì càng vui — em gợi ý vài phim kịch tính cho nhóm.";
        };
    }

    private String cauKetGoiYTamTrang() {
        return "Anh/chị muốn em báo lịch chiếu rạp nào để xem những phim này không ạ?";
    }

    private List<Movie> layPhimGoiYTheoTamTrang(LoaiTamTrang tamTrang, int gioiHan) {
        List<String> theLoai = switch (tamTrang) {
            case MET_STRESS -> List.of("Hài", "Hành động");
            case CHAN_CHUONG -> List.of("Hài", "Hoạt hình", "Phiêu lưu");
            case BUON_THAT_TINH -> List.of("Tình cảm", "Gia đình", "Tâm lý");
            case VUI_BAN_BE -> List.of("Hành động", "Phiêu lưu", "Hài");
        };
        return locPhimTheoNhieuTheLoai(theLoai, gioiHan);
    }

    private String lyDoPhimPhuHop(Movie phim, LoaiTamTrang tamTrang) {
        String theLoai = phim.getGenres() != null ? String.join(", ", phim.getGenres()) : "phim giải trí";
        String theLoaiThuong = theLoai.toLowerCase(Locale.ROOT);
        return switch (tamTrang) {
            case MET_STRESS -> {
                if (theLoaiThuong.contains("hài") || theLoaiThuong.contains("hai"))
                    yield "Hài hước + hành động xả stress, xem là quên mệt mỏi";
                yield "Hành động kịch tính, giúp xả hơi sau ngày dài";
            }
            case CHAN_CHUONG -> {
                if (theLoaiThuong.contains("hài") || theLoaiThuong.contains("hai"))
                    yield "Hài hước nhẹ, xem là hết chán ngay";
                if (theLoaiThuong.contains("hoạt hình") || theLoaiThuong.contains("hoat hinh"))
                    yield "Hoạt hình vui nhộn, giải trí không cần nghĩ nhiều";
                yield "Phiêu lưu giải trí, thổi bùng không khí mới";
            }
            case BUON_THAT_TINH -> {
                if (theLoaiThuong.contains("gia đình") || theLoaiThuong.contains("gia dinh"))
                    yield "Gia đình ấm áp, mang lại hy vọng và an yên";
                if (theLoaiThuong.contains("tâm lý") || theLoaiThuong.contains("tam ly"))
                    yield "Tâm lý nhẹ nhàng, giúp cảm thấy được thấu hiểu";
                yield "Tình cảm chữa lành, kết cục tích cực";
            }
            case VUI_BAN_BE ->
                    "Bom tấn hành động phiêu lưu, xem nhóm bạn là hợp — kịch tính và vui";
        };
    }

    private List<Movie> locPhimTheoNhieuTheLoai(List<String> danhSachTheLoai, int gioiHan) {
        List<Movie> ketQua = new ArrayList<>();
        java.util.Set<String> daThem = new java.util.HashSet<>();
        for (String theLoai : danhSachTheLoai) {
            for (Movie phim : locPhimTheoTheLoai(theLoai, gioiHan)) {
                if (daThem.add(phim.getId())) {
                    ketQua.add(phim);
                    if (ketQua.size() >= gioiHan) return ketQua;
                }
            }
        }
        return ketQua;
    }

    private Movie timPhimTuCauHoi(String cauHoi) {
        String tuKhoa = trichTuKhoaTenPhim(cauHoi);
        if (tuKhoa == null || tuKhoa.isBlank()) return null;
        List<Movie> ketQua = congCuChat.timPhimTheoTuKhoa(tuKhoa, 1);
        return ketQua.isEmpty() ? null : ketQua.get(0);
    }

    private String trichTuKhoaTenPhim(String cauHoi) {
        if (cauHoi == null || cauHoi.isBlank()) return null;
        Matcher khopNgoac = Pattern.compile("[«\"']([^»\"']{2,})[»\"']").matcher(cauHoi);
        if (khopNgoac.find()) return khopNgoac.group(1).trim();

        Matcher khopPhim = Pattern.compile("(?i)phim\\s+(.+?)(?:\\s+(?:có|co|chiếu|chieu|giá|gia|lịch|lich|không|khong|thì|thi|ko|k)|[,?.!]|$)")
                .matcher(cauHoi);
        if (khopPhim.find()) {
            String ten = khopPhim.group(1).trim();
            ten = ten.replaceAll("(?i)\\b(có|co|chiếu|chieu|giá|gia|vé|ve|không|khong)\\b.*$", "").trim();
            if (ten.length() >= 2
                    && !ten.equalsIgnoreCase("đang chiếu")
                    && !ten.equalsIgnoreCase("dang chieu")
                    && !ten.equalsIgnoreCase("đang hot")
                    && !ten.equalsIgnoreCase("dang hot"))
                return ten;
        }
        return null;
    }

    private boolean laCauHoiLienQuanTenPhim(String chuan) {
        if (chuan.matches(".*(phim dang chieu|danh sach phim|co phim gi|phim hot|goi y phim).*"))
            return false;
        return chuan.matches(".*(co chieu|co phim|gia ve|tien ve|lich chieu|suat chieu|co khong|chieu k|bao nhieu).*")
                || (chuan.contains("phim") && chuan.matches(".*(co|gia|ve|chieu|lich|suat).*"));
    }

    private String traLoiKhongTimThayPhim(String tenPhim) {
        List<Movie> phimDangChieu = khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, 5)).getContent();
        StringBuilder sb = new StringBuilder("Rất tiếc, hệ thống PhongG Cinema hiện chưa có phim «")
                .append(tenPhim).append("».\n\nAnh/chị tham khảo các phim đang chiếu khác như:\n");
        if (phimDangChieu.isEmpty()) {
            sb.append("- (Hiện chưa có phim trong lịch chiếu)\n");
        } else {
            for (Movie p : phimDangChieu)
                sb.append("- ").append(p.getTitle()).append("\n");
        }
        sb.append("\nnhé!");
        return sb.toString().trim();
    }

    private LocalDate trichNgayTuCauHoi(String chuan) {
        Matcher khop = Pattern.compile("(\\d{1,2})[/.\\-](\\d{1,2})").matcher(chuan);
        if (!khop.find()) return null;
        int ngay = Integer.parseInt(khop.group(1));
        int thang = Integer.parseInt(khop.group(2));
        int nam = LocalDate.now().getYear();
        try {
            return LocalDate.of(nam, thang, ngay);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String traLoiSuatPhimTheoNgay(Movie phim, LocalDate ngay) {
        List<Showtime> suatList = locSuatTheoPhimVaNgay(phim.getId(), ngay, GIOI_HAN_SUAT_HIEN_THI);
        if (suatList.isEmpty())
            return "Phim «" + phim.getTitle() + "» chưa có suất chiếu ngày "
                    + DINH_DANG_NGAY.format(ngay) + " trong hệ thống ạ. Anh/chị thử ngày khác hoặc xem trang chủ PhongG Cinema.";
        Map<String, Cinema> rapMap = layRapMap();
        Map<String, List<Showtime>> theoRap = suatList.stream()
                .collect(Collectors.groupingBy(Showtime::getMaRap));
        StringBuilder sb = new StringBuilder("Dạ có ạ! «").append(phim.getTitle()).append("» chiếu ngày ")
                .append(DINH_DANG_NGAY.format(ngay)).append(":");
        themThongTinViTriKhach(sb);
        List<Cinema> rapSapXep = sapXepRapTheoViTri(
                theoRap.keySet().stream().map(rapMap::get).filter(java.util.Objects::nonNull).toList());
        for (Cinema rap : rapSapXep) {
            List<Showtime> suatTaiRap = theoRap.getOrDefault(rap.getId(), List.of());
            if (suatTaiRap.isEmpty()) continue;
            sb.append("\n\n«").append(rap.getTenRap()).append("»");
            if (rap.getDiaChi() != null) sb.append("\nĐịa chỉ: ").append(rap.getDiaChi());
            Double km = tinhKhoangCachRap(rap);
            if (km != null) sb.append(" (").append(dinhDangKhoangCach(km)).append(")");
            for (Showtime suat : suatTaiRap)
                sb.append("\n").append(dinhDangDongSuatGon(suat));
        }
        sb.append("\n\nAnh/chị chọn suất trên web để đặt vé ạ.");
        return sb.toString().trim();
    }

    private String traLoiPhimTheoNgay(LocalDate ngay) {
        List<Showtime> suatList = khoSuatChieu.findAll().stream()
                .filter(s -> s.getThoiGianBatDau() != null
                        && s.getThoiGianBatDau().toLocalDate().equals(ngay))
                .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                .limit(8)
                .toList();
        if (suatList.isEmpty())
            return "Ngày " + DINH_DANG_NGAY.format(ngay) + " chưa có suất chiếu trong hệ thống ạ.";
        Map<String, String> tenPhim = khoPhim.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
        StringBuilder sb = new StringBuilder("Phim chiếu ngày " + DINH_DANG_NGAY.format(ngay) + ":\n");
        for (Showtime suat : suatList) {
            sb.append("• ").append(tenPhim.getOrDefault(suat.getMaPhim(), "Phim"))
                    .append(" — ").append(DINH_DANG_SUAT.format(suat.getThoiGianBatDau()));
            if (suat.getGiaVeTu() != null) sb.append(" (từ ").append(suat.getGiaVeTu()).append("đ)");
            sb.append("\n");
        }
        sb.append("Anh/chị chọn phim trên web để đặt ghế ạ.");
        return sb.toString().trim();
    }

    private String traLoiSuatPhimGanNhat(Movie phim) {
        return traLoiPhimDayDu(phim);
    }

    private List<Showtime> locSuatTheoPhimVaNgay(String maPhim, LocalDate ngay, int gioiHan) {
        return khoSuatChieu.findAll().stream()
                .filter(s -> maPhim.equals(s.getMaPhim())
                        && s.getThoiGianBatDau() != null
                        && s.getThoiGianBatDau().toLocalDate().equals(ngay))
                .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                .limit(gioiHan)
                .toList();
    }

    private String traLoiGiaVePhim(Movie phim, String chuan) {
        int soNguoi = 1;
        Matcher khopNguoi = Pattern.compile("(\\d+)\\s*(nguoi|ng)").matcher(chuan);
        if (khopNguoi.find()) soNguoi = Integer.parseInt(khopNguoi.group(1));

        boolean gheDoi = chuan.matches(".*(ghe doi|sweetbox|couple|cap doi).*");
        Showtime suatGan = timSuatGanNhat(phim.getId());
        int giaCoBan = suatGan != null && suatGan.getGiaVeTu() != null
                ? suatGan.getGiaVeTu().intValue() : GIA_CO_BAN_THAM_CHIEU;

        if (gheDoi) {
            int soCap = (soNguoi + 1) / 2;
            int giaMotGheCouple = giaCoBan + PHU_THU_COUPLE;
            int tongTheoGhe = soNguoi * giaMotGheCouple;
            StringBuilder sb = new StringBuilder("Vé «").append(phim.getTitle()).append("» — ghế đôi Sweetbox cho ")
                    .append(soNguoi).append(" người:\n");
            sb.append("• Tham chiếu: ").append(soCap).append(" cặp × 200.000đ = ")
                    .append(dinhDangTien(soCap * GIA_COUPLE_THAM_CHIEU)).append("\n");
            if (suatGan != null) {
                sb.append("• Theo suất ").append(DINH_DANG_SUAT.format(suatGan.getThoiGianBatDau()))
                        .append(": ước tính ").append(dinhDangTien(tongTheoGhe))
                        .append(" (").append(soNguoi).append(" ghế đôi × ")
                        .append(dinhDangTien(giaMotGheCouple)).append(")\n");
            }
            sb.append("\n").append(traLoiPhimDayDu(phim));
            return sb.toString().trim();
        }

        int tong = soNguoi * giaCoBan;
        String phanGia = "Vé «" + phim.getTitle() + "» cho " + soNguoi + " người (ghế thường): ước tính "
                + dinhDangTien(tong) + " (từ " + dinhDangTien(giaCoBan) + "/ghế).\n\n";
        return phanGia + traLoiPhimDayDu(phim);
    }

    private Showtime timSuatGanNhat(String maPhim) {
        return locSuatSapToi(maPhim, 1).stream().findFirst().orElse(null);
    }

    private String dinhDangTien(int so) {
        return String.format(Locale.forLanguageTag("vi-VN"), "%,dđ", so).replace(",", ".");
    }

    private boolean laCauHoiVePhimCuThe(String chuan, Movie phim) {
        String tenChuan = chuanHoaKhongDau(phim.getTitle());
        if (chuan.contains(tenChuan)) return true;
        int demToken = 0;
        for (String token : tenChuan.split("[\\s:&]+")) {
            if (token.length() >= 4 && chuan.contains(token)) demToken++;
        }
        return demToken >= 2;
    }

    private boolean laCauHoiViTri(String chuan) {
        return chuan.matches(".*(rap|cinema|he thong rap).*")
                && chuan.matches(".*(dau|dia chi|vi tri|cho nao|address|location|o dau).*")
                || chuan.matches(".*rap o dau.*");
    }

    private boolean laCauHoiGoiYPhim(String chuan) {
        return chuan.matches(".*(hay nhat|nen xem|goi y|gợi ý|de xem|tot nhat|muon xem|thich|yeu).*");
    }

    private boolean laCauHoiHoiCoKhong(String chuan) {
        return chuan.matches(".*(co k|co khong|co hk|hong|khong co|co phim|co chieu).*");
    }

    private boolean laCauHoiLichChieu(String chuan) {
        return chuan.matches(".*(lich chieu|suat chieu|gio chieu|ngay chieu|khi nao|chieu khi nao|chieu luc|ngay may|gio may|may gio).*");
    }

    private String timTheLoaiTuCauHoi(String chuan) {
        if (chuan.matches(".*(phim ma|\\bma\\b|ma quy).*")) return "Kinh dị";
        if (chuan.matches(".*(tinh cam|romance|lang du).*")) return "Tình cảm";
        if (chuan.matches(".*(hanh dong|action).*")) return "Hành động";
        if (chuan.matches(".*(hoat hinh|animation|cartoon).*")) return "Hoạt hình";
        if (chuan.matches(".*(kinh di|horror).*")) return "Kinh dị";
        if (chuan.matches(".*(hai|comedy).*")) return "Hài";
        if (chuan.matches(".*(gia dinh|family).*")) return "Gia đình";
        if (chuan.matches(".*(tam ly|drama).*")) return "Tâm lý";
        return null;
    }

    private String traLoiGoiYTheLoai(String theLoai) {
        List<Movie> phim = locPhimTheoTheLoai(theLoai, 3);
        if (phim.isEmpty())
            return "Hiện chưa có phim thể loại " + theLoai + " trong lịch chiếu. Anh/chị thử xem «Phim đang chiếu» hoặc chọn thể loại khác ạ.";
        StringBuilder sb = new StringBuilder("Em gợi ý " + phim.size() + " phim " + theLoai + " đang chiếu tại PhongG Cinema:\n");
        for (Movie p : phim) {
            sb.append("• ").append(p.getTitle());
            if (p.getDuration() != null) sb.append(" (").append(p.getDuration()).append(" phút)");
            if (p.getDescription() != null && !p.getDescription().isBlank())
                sb.append(" — ").append(rutGon(p.getDescription(), 80));
            sb.append("\n");
        }
        sb.append("Anh/chị chọn phim trên web để xem suất và đặt vé ạ.");
        return sb.toString().trim();
    }

    private String traLoiTheLoaiCoKhong(String theLoai, String chuan) {
        String tenHienThi = chuan.matches(".*\\bma\\b.*") ? "ma / kinh dị" : theLoai;
        List<Movie> phim = locPhimTheoTheLoai(theLoai, 5);
        if (phim.isEmpty())
            return "Hiện chưa có phim " + tenHienThi + " trong lịch chiếu tại PhongG Cinema ạ. "
                    + "Anh/chị xem «Phim đang chiếu» hoặc thử thể loại khác nhé!";
        StringBuilder sb = new StringBuilder("Dạ có ạ! Phim " + tenHienThi + " đang chiếu tại PhongG Cinema:");
        themThongTinViTriKhach(sb);
        Map<String, Cinema> rapMap = layRapMap();
        for (Movie p : phim) {
            sb.append("\n\n«").append(p.getTitle()).append("»");
            List<Showtime> suatList = locSuatSapToi(p.getId(), 6);
            if (suatList.isEmpty()) {
                sb.append(" — chưa có suất sắp tới");
                continue;
            }
            java.util.Set<String> maRap = suatList.stream().map(Showtime::getMaRap).collect(Collectors.toSet());
            Cinema rapGan = timRapGanNhat(maRap.stream().map(rapMap::get).filter(java.util.Objects::nonNull).toList());
            if (rapGan != null) {
                sb.append("\nRạp gần anh/chị có phim: ").append(rapGan.getTenRap());
                if (rapGan.getDiaChi() != null) sb.append(" — ").append(rapGan.getDiaChi());
            }
            for (Showtime suat : suatList)
                sb.append("\n").append(dinhDangDongSuatGon(suat));
        }
        sb.append("\n\nHỏi tên phim cụ thể để em báo chi tiết hơn ạ.");
        return sb.toString().trim();
    }

    private String traLoiGiaiThichBot() {
        return "Em là trợ lý PhongG Cinema — em trả lời offline về rạp, giá vé, phim và lịch chiếu (không cần AI bên ngoài). "
                + "Anh/chị thử hỏi: «Phim đang chiếu», «Phim ma có không», «Giá vé», «Rạp ở đâu?» ạ!";
    }

    private boolean khoaApiHopLe() {
        return geminiClient.coKhoaHopLe();
    }

    private String traLoiKhiKhongHieu(String cauHoi) {
        String tuKhoa = trichTuKhoaTenPhim(cauHoi);
        if (tuKhoa != null && laCauHoiLienQuanTenPhim(chuanHoaKhongDau(cauHoi)))
            return traLoiKhongTimThayPhim(tuKhoa);
        String chuan = chuanHoaKhongDau(cauHoi);
        String theLoai = timTheLoaiTuCauHoi(chuan);
        if (theLoai != null && laCauHoiLichChieu(chuan))
            return traLoiLichTheoTheLoai(theLoai);
        if (theLoai != null)
            return traLoiTheLoaiCoKhong(theLoai, chuan);
        if (laCauHoiLichChieu(chuan))
            return traLoiLichChieuNgan();
        return "Em chưa hiểu rõ câu này ạ. Anh/chị thử: «Lịch chiếu phim hoạt hình», «Phim ma có không», "
                + "«Giá vé» hoặc «Rạp ở đâu?» nhé!";
    }

    private String traLoiGoiYPhimChung() {
        List<Movie> phim = khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, 3)).getContent();
        if (phim.isEmpty())
            return "Hiện chưa có phim trong lịch chiếu. Anh/chị quay lại sau hoặc xem trang chủ PhongG Cinema ạ.";
        StringBuilder sb = new StringBuilder("Một vài phim đang được quan tâm tại PhongG Cinema:\n");
        phim.forEach(p -> sb.append("• ").append(p.getTitle()).append("\n"));
        sb.append("Anh/chị muốn gợi ý theo thể loại (tình cảm, hành động, hoạt hình…) em sẽ tìm chính xác hơn ạ!");
        return sb.toString().trim();
    }

    private String traLoiDanhSachPhimNgan() {
        List<Movie> phim = khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, 6)).getContent();
        if (phim.isEmpty())
            return "Hiện chưa có phim trong lịch chiếu. Anh/chị quay lại sau nhé!";
        StringBuilder sb = new StringBuilder("Phim đang chiếu tại PhongG Cinema:\n");
        phim.forEach(p -> sb.append("• ").append(p.getTitle()).append("\n"));
        sb.append("Anh/chị hỏi «lịch chiếu» hoặc «phim tình cảm hay nhất» để em gợi ý chi tiết hơn ạ.");
        return sb.toString().trim();
    }

    private String traLoiLichChieuNgan() {
        LocalDateTime tu = LocalDateTime.now();
        java.util.Set<String> daHien = new java.util.HashSet<>();
        List<Showtime> suatList = khoSuatChieu.findAll().stream()
                .filter(s -> s.getThoiGianBatDau() != null && !s.getThoiGianBatDau().isBefore(tu))
                .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                .filter(s -> {
                    String key = s.getMaPhim() + "|" + s.getThoiGianBatDau();
                    if (daHien.contains(key)) return false;
                    daHien.add(key);
                    return true;
                })
                .limit(6)
                .toList();
        if (suatList.isEmpty())
            return "Chưa có suất chiếu sắp tới trong hệ thống. Anh/chị xem lại trên trang chủ PhongG Cinema ạ.";
        Map<String, String> tenPhim = khoPhim.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
        Map<String, Cinema> rapMap = layRapMap();
        StringBuilder sb = new StringBuilder("Lịch chiếu sắp tới tại PhongG Cinema:");
        themThongTinViTriKhach(sb);
        sb.append("\n");
        for (Showtime suat : suatList) {
            sb.append("\n• ")
                    .append(tenPhim.getOrDefault(suat.getMaPhim(), "Phim"))
                    .append(" — ").append(DINH_DANG_SUAT.format(suat.getThoiGianBatDau()));
            Cinema rap = rapMap.get(suat.getMaRap());
            if (rap != null) {
                sb.append(" tại ").append(rap.getTenRap());
                if (rap.getDiaChi() != null) sb.append(" (").append(rutGon(rap.getDiaChi(), 50)).append(")");
            }
            if (suat.getGiaVeTu() != null) sb.append(" — từ ").append(suat.getGiaVeTu()).append("đ");
        }
        sb.append("\n\nHỏi tên phim cụ thể để em báo đầy đủ suất và rạp gần anh/chị ạ.");
        return sb.toString().trim();
    }

    private String traLoiLichTheoTheLoai(String theLoai) {
        List<Movie> phimTheLoai = locPhimTheoTheLoai(theLoai, 20);
        if (phimTheLoai.isEmpty())
            return "Chưa có phim " + theLoai + " trong lịch chiếu tại PhongG Cinema ạ.";
        java.util.Set<String> maPhimIds = phimTheLoai.stream().map(Movie::getId).collect(Collectors.toSet());
        Map<String, String> tenPhim = phimTheLoai.stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
        LocalDateTime tu = LocalDateTime.now();
        java.util.Set<String> daHien = new java.util.HashSet<>();
        List<Showtime> suatList = khoSuatChieu.findAll().stream()
                .filter(s -> maPhimIds.contains(s.getMaPhim())
                        && s.getThoiGianBatDau() != null
                        && !s.getThoiGianBatDau().isBefore(tu))
                .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                .filter(s -> {
                    String key = s.getMaPhim() + "|" + s.getThoiGianBatDau();
                    if (daHien.contains(key)) return false;
                    daHien.add(key);
                    return true;
                })
                .limit(8)
                .toList();
        if (suatList.isEmpty()) {
            String danhSachTen = phimTheLoai.stream().map(Movie::getTitle).limit(4)
                    .collect(Collectors.joining(", "));
            return "Phim " + theLoai + " đang có: " + danhSachTen
                    + " — nhưng chưa có suất sắp tới trong hệ thống. Anh/chị xem trang chủ hoặc hỏi ngày cụ thể (vd. 30/7) ạ.";
        }
        StringBuilder sb = new StringBuilder("Lịch chiếu phim " + theLoai + " (ngày & giờ):\n");
        for (Showtime suat : suatList) {
            sb.append("• ").append(tenPhim.getOrDefault(suat.getMaPhim(), "Phim"))
                    .append(" — ").append(DINH_DANG_SUAT.format(suat.getThoiGianBatDau()));
            if (suat.getGiaVeTu() != null) sb.append(" (từ ").append(suat.getGiaVeTu()).append("đ)");
            sb.append("\n");
        }
        sb.append("Chọn suất trên web PhongG Cinema để đặt vé ạ.");
        return sb.toString().trim();
    }

    private List<Movie> locPhimTheoTheLoai(String theLoai, int gioiHan) {
        String theLoaiChuan = chuanHoaKhongDau(theLoai);
        List<Movie> ketQua = new ArrayList<>();
        for (Movie phim : khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, 30)).getContent()) {
            if (phim.getGenres() == null) continue;
            boolean khop = phim.getGenres().stream()
                    .anyMatch(tl -> chuanHoaKhongDau(tl).contains(theLoaiChuan));
            if (khop) ketQua.add(phim);
            if (ketQua.size() >= gioiHan) break;
        }
        return ketQua;
    }

    private String traLoiKhiGeminiLoi(String cauHoi, String loi) {
        String traLoiNhanh = traLoiNhanhTuTriThuc(cauHoi);
        if (traLoiNhanh != null) return traLoiNhanh;
        if (loi != null && loi.toLowerCase(Locale.ROOT).contains("quota"))
            return "Em tạm không gọi được AI (hết quota miễn phí), nhưng em vẫn trả lời được câu về địa chỉ rạp, giá vé, phim theo ngày hoặc gợi ý phim. Anh/chị thử hỏi cụ thể hơn nhé ạ!";
        if (cauHoi.length() <= 3)
            return "Dạ anh/chị muốn hỏi về địa chỉ rạp, giá vé, phim đang chiếu hay cách đặt vé ạ?";
        return null;
    }

    private String chuyenLoiGeminiThanhThongBao(String loi) {
        if (loi == null || loi.isBlank())
            return "Trợ lý AI tạm thời không phản hồi được. Anh/chị thử lại sau nhé!";
        String chuan = loi.toLowerCase(Locale.ROOT);
        if (chuan.contains("quota") || chuan.contains("rate limit") || chuan.contains("429")
                || chuan.contains("resource exhausted"))
            return "Trợ lý AI tạm hết quota (429). Hệ thống đã thử xoay API key — anh/chị hỏi «Rạp ở đâu?», «Giá vé» hoặc thử lại sau 2–5 phút ạ!";
        if (chuan.contains("api key") || chuan.contains("api_key"))
            return "Chưa cấu hình API key Gemini đúng. Admin cần GEMINI_API_KEYS (nhiều key) hoặc GEMINI_API_KEY từ Google AI Studio.";
        if (loi.length() > 160)
            return "Trợ lý AI tạm thời không phản hồi được. Anh/chị thử lại sau nhé!";
        return loi;
    }

    private String rutGon(String text, int max) {
        if (text.length() <= max) return text;
        return text.substring(0, max).trim() + "…";
    }

    private String moTaTamTrang(LoaiTamTrang tamTrang) {
        return switch (tamTrang) {
            case MET_STRESS -> "met moi / stress / muon giai tri";
            case CHAN_CHUONG -> "chan chan / nham chan";
            case BUON_THAT_TINH -> "that tinh / buon / muon chua lanh";
            case VUI_BAN_BE -> "vui ve / di cung ban be";
        };
    }

    private String chuanHoaKhongDau(String s) {
        String khongDau = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return khongDau.toLowerCase(Locale.ROOT)
                .replace("đ", "d").replace("Đ", "d");
    }

    private String taoDuLieuThoiGianThuc(String cauHoi) {
        String chuan = chuanHoaKhongDau(cauHoi);
        LoaiTamTrang tamTrang = phatHienTamTrang(chuan);
        boolean canPhim = chuan.matches(".*(phim|hot|chieu|movie|lich|dang chieu).*") || tamTrang != null;
        boolean canSuat = chuan.matches(".*(lich|suat|gio|chieu|schedule|showtime).*");

        StringBuilder sb = new StringBuilder();

        if (tamTrang != null) {
            sb.append("- Tam trang khach: ").append(moTaTamTrang(tamTrang)).append("\n");
            sb.append("- Goi y phim tu DB phu hop tam trang:\n");
            for (Movie phim : layPhimGoiYTheoTamTrang(tamTrang, 4)) {
                sb.append("  * ").append(phim.getTitle());
                if (phim.getGenres() != null)
                    sb.append(" (").append(String.join(", ", phim.getGenres())).append(")");
                sb.append(" — 🎬 ").append(lyDoPhimPhuHop(phim, tamTrang)).append("\n");
            }
        }

        if (ngauCanhHienTai != null && ngauCanhHienTai.coGps()) {
            sb.append("- Vi tri khach (GPS): ").append(ngauCanhHienTai.getViDo()).append(", ")
                    .append(ngauCanhHienTai.getKinhDo()).append("\n");
            Cinema rapGan = timRapGanNhat(layTatCaRap());
            if (rapGan != null)
                sb.append("- Rap PhongG gan khach nhat: ").append(rapGan.getTenRap())
                        .append(rapGan.getDiaChi() != null ? " | " + rapGan.getDiaChi() : "")
                        .append("\n");
        } else if (ngauCanhHienTai != null && ngauCanhHienTai.coKhuVuc()) {
            sb.append("- Khach chon khu vuc: ").append(ngauCanhHienTai.getKhuVuc()).append("\n");
        }

        sb.append("- Danh sach rap PhongG:\n");
        for (Cinema rap : sapXepRapTheoViTri(layTatCaRap()).stream().limit(10).toList()) {
            sb.append("  * ").append(rap.getTenRap());
            if (rap.getDiaChi() != null) sb.append(" | ").append(rap.getDiaChi());
            Double km = tinhKhoangCachRap(rap);
            if (km != null) sb.append(" | ").append(dinhDangKhoangCach(km));
            sb.append("\n");
        }

        if (canPhim) {
            List<Movie> phimChieu = khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, 12)).getContent();
            if (phimChieu.isEmpty()) {
                sb.append("- Phim dang chieu: (chua co du lieu trong he thong)\n");
            } else {
                sb.append("- Phim dang chieu:\n");
                phimChieu.forEach(p -> sb.append("  * ").append(p.getTitle())
                        .append(p.getGenres() != null ? " (" + String.join(", ", p.getGenres()) + ")" : "")
                        .append(p.getDuration() != null ? ", " + p.getDuration() + " phut" : "")
                        .append("\n"));
            }
        }

        if (canSuat || canPhim) {
            LocalDateTime tu = LocalDateTime.now();
            LocalDateTime den = tu.plusDays(7);
            List<Showtime> suatList = khoSuatChieu.findAll().stream()
                    .filter(s -> s.getThoiGianBatDau() != null
                            && !s.getThoiGianBatDau().isBefore(tu)
                            && s.getThoiGianBatDau().isBefore(den))
                    .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                    .limit(40)
                    .toList();

            Map<String, String> tenPhim = khoPhim.findAll().stream()
                    .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
            Map<String, String> tenRap = khoRap.findAll().stream()
                    .collect(Collectors.toMap(com.cinema.booking.document.Cinema::getId,
                            com.cinema.booking.document.Cinema::getTenRap, (a, b) -> a));

            if (suatList.isEmpty()) {
                sb.append("- Lich chieu 7 ngay toi: (chua co suat trong he thong)\n");
            } else {
                sb.append("- Lich chieu 7 ngay toi (mau):\n");
                for (Showtime suat : suatList) {
                    sb.append("  * ")
                            .append(tenPhim.getOrDefault(suat.getMaPhim(), "Phim"))
                            .append(" | ")
                            .append(tenRap.getOrDefault(suat.getMaRap(), "Rap"))
                            .append(" phong ").append(suat.getMaPhong())
                            .append(" | ").append(DINH_DANG_SUAT.format(suat.getThoiGianBatDau()))
                            .append(suat.getGiaVeTu() != null ? " | tu " + suat.getGiaVeTu() + "d" : "")
                            .append("\n");
                }
            }
        }

        if (sb.isEmpty())
            sb.append("- (Khong can tra cuu phim/lich cho cau hoi nay)\n");

        return sb.toString();
    }

    @Override
    public String xeLichChieuTuGemini(String prompt) {
        if (!geminiBat || !geminiClient.coKhoaHopLe()) return null;
        try {
            String ketQua = thuGoiModelDonGian(geminiClient.getModelMacDinh(), prompt);
            return ketQua != null && !ketQua.isBlank() ? ketQua : null;
        } catch (Exception ignored) {
            return null;
        }
    }
}
