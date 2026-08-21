package com.cinema.booking.config;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import com.cinema.booking.document.SeatAvailability;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.document.User;
import com.cinema.booking.document.UserRole;
import com.cinema.booking.document.Combo;
import com.cinema.booking.document.LoaiCombo;
import com.cinema.booking.document.TrangThaiCombo;
import com.cinema.booking.document.Voucher;
import com.cinema.booking.document.KieuGiamGiam;
import com.cinema.booking.dto.ShowtimeAutoSeedRequestDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.ComboRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.document.Person;
import com.cinema.booking.document.Region;
import com.cinema.booking.repository.PersonRepository;
import com.cinema.booking.repository.RegionRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.repository.UserRepository;
import com.cinema.booking.repository.VoucherRepository;
import com.cinema.booking.service.CinemaServiceImpl;
import com.cinema.booking.service.PaymentConfigService;
import com.cinema.booking.service.PaymentMethodConfigService;
import com.cinema.booking.service.ShowtimeService;
import com.cinema.booking.util.CinemaSeatTemplates;
import com.cinema.booking.util.ShowtimeSeatMapper;
import com.cinema.booking.util.TinhGiaVeUtil;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
// @Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger nhatKy = LoggerFactory.getLogger(DataInitializer.class);
    private static final BigDecimal GIA_CO_BAN = BigDecimal.valueOf(90000);
    private static final BigDecimal GIA_BAN_NGAY = BigDecimal.valueOf(69000);
    private static final BigDecimal GIA_BAN_TOI = BigDecimal.valueOf(75000);
    private static final int SO_GHE_TOI_THIEU = 100;
    private static final int[][] KHUNG_GIO_SUAT = {{10, 0}, {14, 30}, {18, 0}, {20, 45}};
    private static final String[] DINH_DANG_SUAT = {"2D Lồng Tiếng", "2D Phụ Đề", "2D Lồng Tiếng", "2D Phụ Đề"};

    private final UserRepository khoNguoiDung;
    private final MovieRepository khoPhim;
    private final CinemaRepository khoRap;
    private final ShowtimeRepository khoSuatChieu;
    private final TicketRepository khoVe;
    private final RegionRepository khoKhuVuc;
    private final VoucherRepository khoVoucher;
    private final ComboRepository khoCombo;
    private final PersonRepository khoPerson;
    private final ShowtimeService dichVuSuatChieu;
    private final PaymentMethodConfigService dichVuCauHinhThanhToan;
    private final PaymentConfigService dichVuCauHinhPayment;
    private final PasswordEncoder boMaHoaMatKhau;
    private final ObjectMapper boJson;
    private final MongoTemplate mongoTemplate;

    public DataInitializer(UserRepository khoNguoiDung, MovieRepository khoPhim, CinemaRepository khoRap, ShowtimeRepository khoSuatChieu, TicketRepository khoVe, RegionRepository khoKhuVuc, VoucherRepository khoVoucher, ComboRepository khoCombo, PersonRepository khoPerson, ShowtimeService dichVuSuatChieu, PaymentMethodConfigService dichVuCauHinhThanhToan, PaymentConfigService dichVuCauHinhPayment, PasswordEncoder boMaHoaMatKhau, ObjectMapper boJson, MongoTemplate mongoTemplate) {
        this.khoNguoiDung = khoNguoiDung;
        this.khoPhim = khoPhim;
        this.khoRap = khoRap;
        this.khoSuatChieu = khoSuatChieu;
        this.khoVe = khoVe;
        this.khoKhuVuc = khoKhuVuc;
        this.khoVoucher = khoVoucher;
        this.khoCombo = khoCombo;
        this.khoPerson = khoPerson;
        this.dichVuSuatChieu = dichVuSuatChieu;
        this.dichVuCauHinhThanhToan = dichVuCauHinhThanhToan;
        this.dichVuCauHinhPayment = dichVuCauHinhPayment;
        this.boMaHoaMatKhau = boMaHoaMatKhau;
        this.boJson = boJson;
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(String... thamSo) {
        chuanHoaIndexPhimNeuCan();

        // 1. Nạp người dùng mẫu (chỉ khi chưa có người dùng nào)
        if (khoNguoiDung.count() == 0) {
            nhatKy.info("Database chưa có người dùng, đang nạp người dùng mẫu ban đầu...");
            napNguoiDungMau();
        } else {
            nhatKy.info("Database đã có sẵn {} người dùng. Bỏ qua bước nạp lại để giữ nguyên thay đổi.", khoNguoiDung.count());
        }

        // 2. Nạp khu vực (chỉ khi chưa có khu vực)
        if (khoKhuVuc.count() == 0) {
            nhatKy.info("Database chưa có khu vực, đang nạp danh sách khu vực mẫu...");
            napKhuVucNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} khu vực. Bỏ qua bước nạp lại.", khoKhuVuc.count());
        }

        // 3. Nạp rạp chiếu phim (chỉ khi chưa có rạp nào)
        if (khoRap.count() == 0) {
            nhatKy.info("Database chưa có rạp, đang nạp danh sách rạp mẫu...");
            napRapTuSeed();
            boSungPhongNeuCan();
            boSungSoDoGheTieuChuanNeuCan();
            boSungToaDoRapNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} rạp. Giữ nguyên danh sách rạp hiện có.", khoRap.count());
            xoaRapTestOaeNeuCan();
            boSungPhongNeuCan();
            boSungSoDoGheTieuChuanNeuCan();
        }

        // 4. Nạp phim (chỉ nạp dữ liệu mẫu NẾU database chưa có phim)
        if (khoPhim.count() == 0) {
            nhatKy.info("Database chưa có phim, đang nạp dữ liệu phim mẫu ban đầu...");
            napDuLieuPhimBanDau();
            boSungPhimNeuCan();
            boSungPhimSapChieuNeuCan();
            capNhatDienVienDaoDienNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} phim. Bỏ qua bước nạp lại dữ liệu để giữ nguyên thay đổi.", khoPhim.count());
        }

        // 5. Nạp suất chiếu (chỉ khi chưa có suất chiếu)
        if (khoSuatChieu.count() == 0) {
            nhatKy.info("Database chưa có suất chiếu, đang sinh suất chiếu mẫu ban đầu...");
            sinhSuatChieuTatCaRapNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} suất chiếu. Giữ nguyên các suất chiếu hiện có.", khoSuatChieu.count());
            boSungThongTinSuatChieuNeuCan();
        }

        // 6. Nạp Voucher (chỉ khi chưa có)
        if (khoVoucher.count() == 0) {
            nhatKy.info("Database chưa có voucher, đang nạp voucher mẫu...");
            napVoucherNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} voucher. Bỏ qua bước nạp lại.", khoVoucher.count());
        }

        // 7. Nạp Combo (chỉ khi chưa có)
        if (khoCombo.count() == 0) {
            nhatKy.info("Database chưa có combo bắp nước, đang nạp combo mẫu...");
            napComboNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} combo. Bỏ qua bước nạp lại.", khoCombo.count());
        }

        // 8. Nạp danh sách Diễn viên / Đạo diễn
        if (khoPerson.count() == 0) {
            napPersonNeuCan();
        } else {
            nhatKy.info("Database đã có sẵn {} nghệ sĩ (diễn viên/đạo diễn).", khoPerson.count());
        }

        // 9. Cấu hình hệ thống & quyền nhân viên
        ganRapChoNhanVienNeuCan();
        dichVuCauHinhThanhToan.napMacDinhNeuCan();
        dichVuCauHinhPayment.napMacDinhNeuCan();
    }

    private void chuanHoaIndexPhimNeuCan() {
        try {
            var indexOps = mongoTemplate.indexOps(Movie.class);
            indexOps.getIndexInfo().forEach(info -> {
                boolean laTextIndex = info.getIndexFields().stream().anyMatch(f -> f.isText())
                        || (info.getName() != null && info.getName().toLowerCase().contains("text"));
                if (laTextIndex && info.getName() != null) {
                    try {
                        indexOps.dropIndex(info.getName());
                        nhatKy.info("Đã làm mới text index cho Movie: {}", info.getName());
                    } catch (Exception e) {
                        nhatKy.debug("Bỏ qua drop index: {}", e.getMessage());
                    }
                }
            });
        } catch (Exception loi) {
            nhatKy.debug("Bỏ qua chuẩn hóa text index: {}", loi.getMessage());
        }
    }

    private void napKhuVucNeuCan() {
        try {
            List<RegionSeedDto> seed = boJson.readValue(new ClassPathResource("data/regions.json").getInputStream(), new TypeReference<>() {});
            khoKhuVuc.saveAll(seed.stream().map(muc -> Region.builder().tenKhuVuc(muc.getTenKhuVuc()).thuTu(muc.getThuTu()).build()).toList());
            nhatKy.info("Đã nạp {} khu vực vào MongoDB.", seed.size());
        } catch (Exception loi) {
            nhatKy.warn("Không thể nạp khu vực từ seed: {}", loi.getMessage());
        }
    }

    private void capNhatDienVienDaoDienNeuCan() {
        try {
            List<MovieCastSeedDto> seed = boJson.readValue(
                    new ClassPathResource("data/movies-cast.json").getInputStream(), new TypeReference<>() {});
            var theoTen = seed.stream()
                    .filter(m -> m.getTitle() != null)
                    .collect(java.util.stream.Collectors.toMap(MovieCastSeedDto::getTitle, m -> m, (a, b) -> a));
            List<Movie> capNhat = new ArrayList<>();
            for (Movie phim : khoPhim.findAll()) {
                MovieCastSeedDto muc = theoTen.get(phim.getTitle());
                if (muc == null) continue;
                boolean thayDoi = false;
                if (muc.getActors() != null && !muc.getActors().isEmpty()) {
                    phim.setActors(muc.getActors());
                    thayDoi = true;
                }
                if (muc.getDirector() != null && !muc.getDirector().isBlank()) {
                    phim.setDirector(muc.getDirector());
                    thayDoi = true;
                }
                if (thayDoi) capNhat.add(phim);
            }
            if (!capNhat.isEmpty()) {
                khoPhim.saveAll(capNhat);
                nhatKy.info("Đã cập nhật diễn viên/đạo diễn cho {} phim.", capNhat.size());
            }
        } catch (Exception loi) {
            nhatKy.warn("Không thể cập nhật diễn viên/đạo diễn: {}", loi.getMessage());
        }
    }

    private void napNguoiDungMau() {
        khoNguoiDung.saveAll(List.of(
                User.builder().email("admin@gmail.com").matKhau(boMaHoaMatKhau.encode("123456")).hoTen("Nguyễn Vũ Phong").soDienThoai("0900000001").vaiTro(UserRole.ADMIN).biKhoa(false).build(),
                User.builder().email("staff@gmail.com").matKhau(boMaHoaMatKhau.encode("123456")).hoTen("Nhân Viên PhongG").soDienThoai("0900000002").vaiTro(UserRole.STAFF).biKhoa(false).build(),
                User.builder().email("phong@gmail.com").matKhau(boMaHoaMatKhau.encode("123456")).hoTen("Anh Bảy Vấp Cỏ Hôi Pen").soDienThoai("0900000003").vaiTro(UserRole.CUSTOMER).biKhoa(false).build()));
        nhatKy.info("Đã nạp 3 tài khoản người dùng mẫu mặc định (admin, staff, customer).");
    }

    private void napDuLieuPhimBanDau() {
        List<Movie> danhSachPhim = khoPhim.saveAll(List.of(
                Movie.builder().title("Deadpool & Wolverine").duration(128).genres(List.of("Hành động", "Hài")).language("Tiếng Anh").ageRating("C18")
                        .description("Deadpool và Wolverine hợp tác trong một cuộc phiêu lưu hỗn loạn xuyên đa vũ trụ để thay đổi lịch sử.")
                        .posterUrl("https://image.tmdb.org/t/p/w500/lfY2CfmxyN9OvxmFuap6aejViJn.jpg").trailerUrl("https://www.youtube.com/watch?v=73_1biulkYk")
                        .actors(List.of("Ryan Reynolds", "Hugh Jackman", "Emma Corrin")).director("Shawn Levy").status(MovieStatus.SHOWING).build(),
                Movie.builder().title("Lật Mặt 7: Một Điều Ước").duration(138).genres(List.of("Gia đình", "Tâm lý")).language("Tiếng Việt").ageRating("K")
                        .description("Một câu chuyện cảm động về tình mẹ, những thử thách và ước mơ bình dị của một gia đình Việt Nam.")
                        .posterUrl("https://picsum.photos/seed/latmat7/300/450").trailerUrl("https://www.youtube.com/watch?v=R1v2C5tV9J0")
                        .actors(List.of("Lý Hải", "Minh Hà", "Ngô Kiến Huy")).director("Lý Hải").status(MovieStatus.SHOWING).build(),
                Movie.builder().title("Inside Out 2: Những Mảnh Cảm Xúc").duration(96).genres(List.of("Hoạt hình", "Phiêu lưu")).language("Tiếng Anh").ageRating("P")
                        .description("Riley bước vào tuổi thiếu niên khi những cảm xúc mới xuất hiện và làm đảo lộn trụ sở cảm xúc quen thuộc.")
                        .posterUrl("https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg").trailerUrl("https://www.youtube.com/watch?v=LEjhY15eCx0")
                        .actors(List.of("Amy Poehler", "Maya Hawke", "Liza Lapira")).director("Kelsey Mann").status(MovieStatus.SHOWING).build(),
                Movie.builder().title("Đào, Phở và Piano").duration(100).genres(List.of("Lịch sử", "Chiến tranh")).language("Tiếng Việt").ageRating("P")
                        .description("Bản tình ca về Hà Nội trong những ngày khói lửa, nơi tình yêu và lòng quả cảm được thắp sáng.")
                        .posterUrl("https://picsum.photos/seed/daopho/300/450").trailerUrl("https://www.youtube.com/watch?v=G3e4L9l9Q9M")
                        .actors(List.of("Tuấn Tran", "Phương Anh Đào", "Hồng Diễm")).director("Phi Tiến Sơn").status(MovieStatus.SHOWING).build()));
        nhatKy.info("Đã nạp {} phim mẫu ban đầu.", danhSachPhim.size());
    }

    private void napRapTuSeed() {
        try {
            List<CinemaSeedDto> seed = boJson.readValue(new ClassPathResource("data/regions-cinemas.json").getInputStream(), new TypeReference<>() {});
            List<Cinema> danhSachRap = khoRap.saveAll(seed.stream().map(muc -> Cinema.builder()
                    .khuVuc(muc.getKhuVuc())
                    .tenRap(muc.getTenRap())
                    .diaChi(muc.getDiaChi())
                    .viDo(muc.getViDo())
                    .kinhDo(muc.getKinhDo())
                    .danhSachPhong(CinemaServiceImpl.taoMuoiPhongMacDinh())
                    .build()).toList());
            nhatKy.info("Đã nạp {} rạp từ seed JSON.", danhSachRap.size());
        } catch (Exception loi) {
            nhatKy.warn("Không đọc được file seed rạp: {}", loi.getMessage());
        }
    }

    private void boSungPhimNeuCan() {
        try {
            List<MovieSeedDto> seed = boJson.readValue(new ClassPathResource("data/movies-hot.json").getInputStream(), new TypeReference<>() {});
            var tenPhimDaCo = khoPhim.findAll().stream().map(Movie::getTitle).collect(java.util.stream.Collectors.toSet());
            List<Movie> phimMoi = new ArrayList<>();
            for (MovieSeedDto muc : seed) {
                if (muc.getTitle() == null || tenPhimDaCo.contains(muc.getTitle())) continue;
                phimMoi.add(Movie.builder()
                        .title(muc.getTitle())
                        .duration(muc.getDuration())
                        .genres(muc.getGenres())
                        .language(muc.getLanguage())
                        .ageRating(muc.getAgeRating())
                        .description(muc.getDescription())
                        .posterUrl(muc.getPosterUrl())
                        .trailerUrl(muc.getTrailerUrl())
                        .audioUrl(muc.getAudioUrl())
                        .actors(muc.getActors())
                        .director(muc.getDirector())
                        .status("UPCOMING".equalsIgnoreCase(muc.getStatus()) ? MovieStatus.UPCOMING : MovieStatus.SHOWING)
                        .build());
            }
            if (!phimMoi.isEmpty()) {
                khoPhim.saveAll(phimMoi);
                nhatKy.info("Đã bổ sung {} phim hot từ seed JSON (tổng seed: {}).", phimMoi.size(), seed.size());
            }
        } catch (Exception loi) {
            nhatKy.warn("Không thể bổ sung phim từ seed: {}", loi.getMessage());
        }
    }

    private void boSungPhimSapChieuNeuCan() {
        try {
            List<MovieSeedDto> seed = boJson.readValue(new ClassPathResource("data/movies-upcoming.json").getInputStream(), new TypeReference<>() {});
            var tenPhimDaCo = khoPhim.findAll().stream().map(Movie::getTitle).collect(java.util.stream.Collectors.toSet());
            List<Movie> phimMoi = new ArrayList<>();
            for (MovieSeedDto muc : seed) {
                if (muc.getTitle() == null || tenPhimDaCo.contains(muc.getTitle())) continue;
                phimMoi.add(Movie.builder()
                        .title(muc.getTitle())
                        .duration(muc.getDuration())
                        .genres(muc.getGenres())
                        .language(muc.getLanguage())
                        .ageRating(muc.getAgeRating())
                        .description(muc.getDescription())
                        .posterUrl(muc.getPosterUrl())
                        .trailerUrl(muc.getTrailerUrl())
                        .audioUrl(muc.getAudioUrl())
                        .actors(muc.getActors())
                        .director(muc.getDirector())
                        .status(MovieStatus.UPCOMING)
                        .build());
            }
            if (!phimMoi.isEmpty()) {
                khoPhim.saveAll(phimMoi);
                nhatKy.info("Đã bổ sung {} phim sắp chiếu từ seed JSON.", phimMoi.size());
            }
        } catch (Exception loi) {
            nhatKy.warn("Không thể bổ sung phim sắp chiếu từ seed: {}", loi.getMessage());
        }
    }

    private void boSungRapNeuCan() {
        try {
            for (Cinema rap : khoRap.findAll()) {
                if (rap.getKhuVuc() == null || rap.getKhuVuc().isBlank()) {
                    rap.setKhuVuc("Tp. Hồ Chí Minh");
                    khoRap.save(rap);
                }
            }
            Set<String> tenRapDaCo = khoRap.findAll().stream()
                    .map(Cinema::getTenRap)
                    .filter(ten -> ten != null && !ten.isBlank())
                    .collect(java.util.stream.Collectors.toSet());
            List<CinemaSeedDto> seed = boJson.readValue(new ClassPathResource("data/regions-cinemas.json").getInputStream(), new TypeReference<>() {});
            List<Cinema> rapMoi = new ArrayList<>();
            for (CinemaSeedDto muc : seed) {
                if (muc.getTenRap() == null || laChuoiRapTestOae(muc.getTenRap())) continue;
                if (tenRapDaCo.contains(muc.getTenRap())) continue;
                rapMoi.add(Cinema.builder()
                        .khuVuc(muc.getKhuVuc())
                        .tenRap(muc.getTenRap())
                        .diaChi(muc.getDiaChi())
                        .viDo(muc.getViDo())
                        .kinhDo(muc.getKinhDo())
                        .danhSachPhong(CinemaServiceImpl.taoMuoiPhongMacDinh())
                        .build());
            }
            if (!rapMoi.isEmpty()) {
                khoRap.saveAll(rapMoi);
                nhatKy.info("Đã bổ sung {} rạp từ seed JSON.", rapMoi.size());
            }
        } catch (Exception loi) {
            nhatKy.warn("Không thể bổ sung rạp từ seed: {}", loi.getMessage());
        }
    }

    private boolean laRapTestOae(Cinema rap) {
        if (rap == null) return false;
        return laChuoiRapTestOae(rap.getTenRap()) || laChuoiRapTestOae(rap.getId());
    }

    private boolean laChuoiRapTestOae(String chuoi) {
        return chuoi != null && chuoi.toLowerCase().contains("oae");
    }

    private void xoaRapTestOaeNeuCan() {
        List<Cinema> rapOae = khoRap.findAll().stream().filter(this::laRapTestOae).toList();
        if (rapOae.isEmpty()) return;
        int soRapXoa = 0;
        int soSuatXoa = 0;
        for (Cinema rap : rapOae) {
            for (Showtime suat : khoSuatChieu.findByMaRap(rap.getId())) {
                if (!khoVe.existsByMaSuatChieu(suat.getId())) {
                    khoSuatChieu.delete(suat);
                    soSuatXoa++;
                }
            }
            khoRap.delete(rap);
            soRapXoa++;
            nhatKy.info("Đã xóa rạp test oae: {}", rap.getTenRap());
        }
        nhatKy.info("Dọn dẹp oae: {} rạp, {} suất chiếu.", soRapXoa, soSuatXoa);
    }

    private static final int SO_PHIM_TOI_DA_SINH_SUAT = 8;

    private void sinhSuatChieuTatCaRapNeuCan() {
        try {
            List<Movie> phimDangChieu = khoPhim.findAll().stream()
                    .filter(phim -> phim.getStatus() == MovieStatus.SHOWING)
                    .filter(phim -> phim.getDuration() != null && phim.getDuration() > 0)
                    .limit(SO_PHIM_TOI_DA_SINH_SUAT)
                    .toList();
            if (phimDangChieu.isEmpty()) return;

            List<Cinema> danhSachRap = khoRap.findAll().stream().filter(rap -> !laRapTestOae(rap)).toList();
            if (danhSachRap.isEmpty()) return;

            LocalDate homNay = LocalDate.now();
            LocalDateTime bayGio = LocalDateTime.now();
            int soSuatMoi = 0;
            int chiSoPhimToanCuc = 0;

            for (Cinema rap : danhSachRap) {
                if (rap.getDanhSachPhong() == null || rap.getDanhSachPhong().isEmpty()) continue;
                String maPhong = rap.getDanhSachPhong().get(0).getMaPhong();

                for (int soNgay = 0; soNgay <= 1; soNgay++) {
                    LocalDate ngay = homNay.plusDays(soNgay);
                    LocalDateTime batDauNgay = ngay.atStartOfDay();
                    LocalDateTime ketThucNgay = ngay.plusDays(1).atStartOfDay();
                    final boolean laHomNay = soNgay == 0;
                    List<Showtime> suatTrongPhong = new ArrayList<>(
                            laySuatNheTheoPhongNgay(rap.getId(), maPhong, batDauNgay, ketThucNgay));

                    long soSuatConLai = suatTrongPhong.stream()
                            .filter(suat -> !laHomNay || suat.getThoiGianBatDau() == null || !suat.getThoiGianBatDau().isBefore(bayGio))
                            .count();
                    if (soSuatConLai >= KHUNG_GIO_SUAT.length) continue;

                    for (int i = 0; i < KHUNG_GIO_SUAT.length; i++) {
                        LocalDateTime batDau = ngay.atTime(KHUNG_GIO_SUAT[i][0], KHUNG_GIO_SUAT[i][1]);
                        if (soNgay == 0 && !batDau.isAfter(bayGio)) continue;

                        boolean daCoKhungGio = suatTrongPhong.stream()
                                .anyMatch(suat -> suat.getThoiGianBatDau() != null
                                        && Math.abs(ChronoUnit.MINUTES.between(suat.getThoiGianBatDau(), batDau)) < 10);
                        if (daCoKhungGio) continue;

                        Movie phim = phimDangChieu.get(chiSoPhimToanCuc % phimDangChieu.size());
                        chiSoPhimToanCuc++;
                        LocalDateTime ketThuc = batDau.plusMinutes(phim.getDuration() != null ? phim.getDuration() : 120);
                        if (coTrungLichSuat(suatTrongPhong, batDau, ketThuc)) continue;

                        Showtime suatMoi = taoSuatChieu(phim, rap, maPhong, batDau, DINH_DANG_SUAT[i % DINH_DANG_SUAT.length]);
                        khoSuatChieu.save(suatMoi);
                        suatTrongPhong.add(suatMoi);
                        soSuatMoi++;
                    }
                }
            }
            if (soSuatMoi > 0) {
                nhatKy.info("Đã sinh {} suất chiếu mới cho tất cả rạp (hôm nay + ngày mai).", soSuatMoi);
            }
        } catch (Exception loi) {
            nhatKy.warn("Không thể sinh suất chiếu tự động: {}", loi.getMessage());
        }
    }

    private boolean coTrungLichSuat(List<Showtime> danhSachSuat, LocalDateTime batDau, LocalDateTime ketThuc) {
        for (Showtime suat : danhSachSuat) {
            if (suat.getThoiGianBatDau() == null || suat.getThoiGianKetThuc() == null) continue;
            if (batDau.isBefore(suat.getThoiGianKetThuc()) && ketThuc.isAfter(suat.getThoiGianBatDau())) return true;
        }
        return false;
    }

    private void boSungPhongNeuCan() {
        int soRapCapNhat = 0;
        for (Cinema rap : khoRap.findAll()) {
            List<Cinema.Room> phongHienTai = rap.getDanhSachPhong() != null ? new ArrayList<>(rap.getDanhSachPhong()) : new ArrayList<>();
            Set<String> maDaCo = new HashSet<>();
            phongHienTai.forEach(phong -> maDaCo.add(phong.getMaPhong()));
            boolean coThem = false;
            for (int i = 1; i <= CinemaServiceImpl.SO_PHONG_MAC_DINH; i++) {
                String maPhong = String.format("P%02d", i);
                if (!maDaCo.contains(maPhong)) {
                    phongHienTai.add(taoPhong(maPhong, String.format("Phòng %02d", i)));
                    coThem = true;
                }
            }
            if (coThem) {
                rap.setDanhSachPhong(phongHienTai);
                khoRap.save(rap);
                soRapCapNhat++;
            }
        }
        if (soRapCapNhat > 0) {
            nhatKy.info("Đã bổ sung phòng chiếu lên {} phòng/rạp cho {} rạp.", CinemaServiceImpl.SO_PHONG_MAC_DINH, soRapCapNhat);
        }
    }

    private void boSungSoDoGheTieuChuanNeuCan() {
        int soRapCapNhat = 0;
        for (Cinema rap : khoRap.findAll()) {
            boolean coCapNhat = false;
            for (Cinema.Room phong : rap.getDanhSachPhong()) {
                if (phong.getDanhSachGhe() == null || phong.getDanhSachGhe().size() < 80) {
                    phong.setDanhSachGhe(CinemaSeatTemplates.taoMauTieuChuan());
                    coCapNhat = true;
                }
            }
            if (coCapNhat) {
                khoRap.save(rap);
                soRapCapNhat++;
            }
        }
        if (soRapCapNhat > 0) {
            nhatKy.info("Đã nâng sơ đồ ghế tiêu chuẩn cho {} rạp.", soRapCapNhat);
        }
    }

    private void boSungThongTinSuatChieuNeuCan() {
        Query truyVan = new Query(new Criteria().orOperator(
                Criteria.where("price").is(null),
                Criteria.where("giaVeTu").is(null),
                Criteria.where("format").is(null),
                Criteria.where("format").is(""),
                Criteria.where("dinhDang").is(null),
                Criteria.where("dinhDang").is("")));
        int soCapNhat = 0;
        for (Showtime suat : mongoTemplate.find(truyVan, Showtime.class)) {
            boolean canCapNhat = false;
            LocalDateTime tgBatDau = suat.getStartTime() != null ? suat.getStartTime() : suat.getThoiGianBatDau();
            if (suat.getPrice() == null && suat.getGiaVeTu() == null) {
                suat.setPrice(tinhGiaVeTu(tgBatDau));
                canCapNhat = true;
            }
            String dd = suat.getFormat() != null && !suat.getFormat().isBlank() ? suat.getFormat() : suat.getDinhDang();
            if (dd == null || dd.isBlank()) {
                suat.setFormat("2D Lồng Tiếng");
                canCapNhat = true;
            }
            if (canCapNhat) {
                try {
                    mongoTemplate.save(suat);
                    soCapNhat++;
                } catch (Exception e) {
                    nhatKy.warn("Không thể cập nhật suất chiếu {}: {}", suat.getId(), e.getMessage());
                }
            }
        }
        if (soCapNhat > 0) {
            nhatKy.info("Đã bổ sung thông tin cho {} suất chiếu.", soCapNhat);
        }
    }

    private List<Showtime> laySuatNheTheoPhongNgay(String maRap, String maPhong, LocalDateTime batDauNgay, LocalDateTime ketThucNgay) {
        Query truyVan = new Query(new Criteria().andOperator(
                new Criteria().orOperator(Criteria.where("cinemaId").is(maRap), Criteria.where("maRap").is(maRap)),
                new Criteria().orOperator(Criteria.where("roomId").is(maPhong), Criteria.where("maPhong").is(maPhong)),
                new Criteria().orOperator(
                        Criteria.where("startTime").gte(batDauNgay).lt(ketThucNgay),
                        Criteria.where("thoiGianBatDau").gte(batDauNgay).lt(ketThucNgay)
                )
        ));
        return mongoTemplate.find(truyVan, Showtime.class);
    }

    private void boSungToaDoRapNeuCan() {
        try {
            List<CinemaSeedDto> seed = boJson.readValue(new ClassPathResource("data/regions-cinemas.json").getInputStream(), new TypeReference<>() {});
            var toaDoTheoTen = seed.stream()
                    .filter(muc -> muc.getTenRap() != null && muc.getViDo() != null && muc.getKinhDo() != null)
                    .collect(java.util.stream.Collectors.toMap(CinemaSeedDto::getTenRap, muc -> muc, (a, b) -> a));
            int soCapNhat = 0;
            for (Cinema rap : khoRap.findAll()) {
                if (rap.getViDo() != null && rap.getKinhDo() != null) continue;
                CinemaSeedDto muc = toaDoTheoTen.get(rap.getTenRap());
                if (muc == null) muc = timSeedGanDungTen(rap.getTenRap(), seed);
                if (muc == null) continue;
                rap.setViDo(muc.getViDo());
                rap.setKinhDo(muc.getKinhDo());
                khoRap.save(rap);
                soCapNhat++;
            }
            if (soCapNhat > 0) {
                nhatKy.info("Đã bổ sung tọa độ GPS cho {} rạp.", soCapNhat);
            }
        } catch (Exception loi) {
            nhatKy.warn("Không thể bổ sung tọa độ rạp: {}", loi.getMessage());
        }
    }

    private CinemaSeedDto timSeedGanDungTen(String tenRap, List<CinemaSeedDto> seed) {
        if (tenRap == null || tenRap.isBlank()) return null;
        String tenChuan = chuanHoaTenRap(tenRap);
        for (CinemaSeedDto muc : seed) {
            if (muc.getTenRap() == null || muc.getViDo() == null || muc.getKinhDo() == null) continue;
            String tenSeed = chuanHoaTenRap(muc.getTenRap());
            if (tenChuan.equals(tenSeed) || tenChuan.contains(tenSeed) || tenSeed.contains(tenChuan)) {
                return muc;
            }
        }
        return null;
    }

    private String chuanHoaTenRap(String ten) {
        return ten.toLowerCase()
                .replaceAll("[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private List<Cinema> taoDanhSachRapTuSeed() {
        try {
            List<CinemaSeedDto> seed = boJson.readValue(new ClassPathResource("data/regions-cinemas.json").getInputStream(), new TypeReference<>() {});
            return khoRap.saveAll(seed.stream().map(muc -> Cinema.builder()
                    .khuVuc(muc.getKhuVuc())
                    .tenRap(muc.getTenRap())
                    .diaChi(muc.getDiaChi())
                    .viDo(muc.getViDo())
                    .kinhDo(muc.getKinhDo())
                    .danhSachPhong(CinemaServiceImpl.taoMuoiPhongMacDinh())
                    .build()).toList());
        } catch (Exception loi) {
            throw new IllegalStateException("Không đọc được file seed rạp", loi);
        }
    }

    private void capNhatSoDoGheNeuCan() {
        List<Cinema> danhSachRap = khoRap.findAll();
        boolean coCapNhat = false;
        for (Cinema rap : danhSachRap) {
            boolean rapCanCapNhat = false;
            for (Cinema.Room phong : rap.getDanhSachPhong()) {
                if (phong.getDanhSachGhe() == null || phong.getDanhSachGhe().size() < SO_GHE_TOI_THIEU) {
                    phong.setDanhSachGhe(taoDanhSachGhePhong());
                    rapCanCapNhat = true;
                }
            }
            if (rapCanCapNhat) {
                khoRap.save(rap);
                coCapNhat = true;
            }
        }
        if (!coCapNhat) return;

        List<Cinema> rapDaCapNhat = khoRap.findAll();
        for (Showtime suatChieu : khoSuatChieu.findAll()) {
            Cinema rap = rapDaCapNhat.stream().filter(muc -> muc.getId().equals(suatChieu.getMaRap())).findFirst().orElse(null);
            if (rap == null) continue;
            Cinema.Room phong = rap.getDanhSachPhong().stream().filter(muc -> muc.getMaPhong().equals(suatChieu.getMaPhong())).findFirst().orElse(null);
            if (phong == null) continue;
            Map<String, Showtime.SeatStatus> trangThaiCu = new HashMap<>();
            if (suatChieu.getTrangThaiGhe() != null) {
                suatChieu.getTrangThaiGhe().forEach(ghe -> trangThaiCu.put(ghe.getSoGhe(), ghe));
            }
            suatChieu.setTrangThaiGhe(phong.getDanhSachGhe().stream().map(ghe -> {
                Showtime.SeatStatus cu = trangThaiCu.get(ghe.getSoGhe());
                BigDecimal giaVeTu = suatChieu.getGiaVeTu() != null ? suatChieu.getGiaVeTu() : GIA_BAN_NGAY;
                int phuThu = TinhGiaVeUtil.tinhPhuThu(giaVeTu, ghe.getLoaiGhe(), rap);
                if (cu != null) {
                    cu.setLoaiGhe(ghe.getLoaiGhe());
                    cu.setPhuThu(phuThu);
                    return cu;
                }
                return new Showtime.SeatStatus(ghe.getSoGhe(), SeatAvailability.AVAILABLE, null, null, ghe.getLoaiGhe(), phuThu);
            }).toList());
            khoSuatChieu.save(suatChieu);
        }
        nhatKy.info("Đã nâng cấp sơ đồ ghế PhongG Cinema lên {} ghế/phòng.", taoDanhSachGhePhong().size());
    }

    private List<Cinema.Seat> taoDanhSachGhePhong() {
        List<Cinema.Seat> danhSachGhe = new ArrayList<>();
        for (char hangGhe = 'A'; hangGhe <= 'C'; hangGhe++) {
            for (int soThuTu = 1; soThuTu <= 20; soThuTu++) {
                danhSachGhe.add(new Cinema.Seat(hangGhe + String.valueOf(soThuTu), "STANDARD", GIA_CO_BAN));
            }
        }
        for (char hangGhe = 'D'; hangGhe <= 'K'; hangGhe++) {
            for (int soThuTu = 1; soThuTu <= 20; soThuTu++) {
                boolean laGheVip = soThuTu >= 4 && soThuTu <= 17;
                danhSachGhe.add(new Cinema.Seat(hangGhe + String.valueOf(soThuTu), laGheVip ? "VIP" : "STANDARD", laGheVip ? GIA_CO_BAN.add(BigDecimal.valueOf(20000)) : GIA_CO_BAN));
            }
        }
        for (int soThuTu = 1; soThuTu <= 16; soThuTu += 2) {
            BigDecimal giaGheDoi = GIA_CO_BAN.add(BigDecimal.valueOf(80000));
            danhSachGhe.add(new Cinema.Seat("L" + soThuTu, "COUPLE", giaGheDoi));
            danhSachGhe.add(new Cinema.Seat("L" + (soThuTu + 1), "COUPLE", giaGheDoi));
        }
        return danhSachGhe;
    }

    private Cinema.Room taoPhong(String maPhong, String tenPhong) {
        return Cinema.Room.builder()
                .maPhong(maPhong)
                .tenPhong(tenPhong)
                .danhSachGhe(taoDanhSachGhePhong())
                .build();
    }

    private void ganRapChoNhanVienNeuCan() {
        khoNguoiDung.findByEmail("staff@gmail.com").ifPresent(nhanVien -> {
            if (nhanVien.getMaRapPhuTrach() == null || nhanVien.getMaRapPhuTrach().isBlank()) {
                khoRap.findAll().stream().findFirst().ifPresent(rap -> {
                    nhanVien.setMaRapPhuTrach(rap.getId());
                    khoNguoiDung.save(nhanVien);
                });
            }
        });
    }

    private void napVoucherNeuCan() {
        LocalDateTime now = LocalDateTime.now();
        boSungVoucherNeuChuaCo("PHONGG20K", Voucher.builder()
                .maCode("PHONGG20K")
                .kieuGiam(KieuGiamGiam.FIXED)
                .giaTriGiam(BigDecimal.valueOf(20000))
                .donToiThieu(BigDecimal.valueOf(100000))
                .ngayBatDau(now.minusDays(1))
                .ngayKetThuc(now.plusMonths(3))
                .soLuong(100)
                .soLuongDaDung(0)
                .voHieuHoa(false)
                .build());
        boSungVoucherNeuChuaCo("PHONGG15", Voucher.builder()
                .maCode("PHONGG15")
                .kieuGiam(KieuGiamGiam.PERCENT)
                .giaTriGiam(BigDecimal.valueOf(15))
                .giamToiDa(BigDecimal.valueOf(50000))
                .donToiThieu(BigDecimal.valueOf(150000))
                .ngayBatDau(now.minusDays(1))
                .ngayKetThuc(now.plusMonths(2))
                .soLuong(50)
                .soLuongDaDung(0)
                .voHieuHoa(false)
                .build());
    }

    private void boSungVoucherNeuChuaCo(String maCode, Voucher mau) {
        if (khoVoucher.findByMaCodeIgnoreCase(maCode).isPresent()) return;
        khoVoucher.save(mau);
        nhatKy.info("Đã nạp mã giảm giá mẫu: {}", maCode);
    }

    private void napComboNeuCan() {
        boSungComboNeuChuaCo("COMBO_1_PHIM", Combo.builder()
                .maCombo("COMBO_1_PHIM")
                .tenCombo("Solo Combo")
                .loai(LoaiCombo.COMBO)
                .moTa("1 Bắp ngọt + 1 Nước ngọt size M")
                .giaTien(BigDecimal.valueOf(69000))
                .hinhAnh("https://images.unsplash.com/photo-1585647340883-2a8c37b7b137?w=400&h=300&fit=crop")
                .trangThai(TrangThaiCombo.HOAT_DONG)
                .build());
        boSungComboNeuChuaCo("COMBO_2_PHIM", Combo.builder()
                .maCombo("COMBO_2_PHIM")
                .tenCombo("Sweet Combo 69oz")
                .loai(LoaiCombo.COMBO)
                .moTa("1 Bắp phô mai lớn + 2 Pepsi 22oz")
                .giaTien(BigDecimal.valueOf(99000))
                .hinhAnh("https://images.unsplash.com/photo-1578849276569-e35a62b90a2c?w=400&h=300&fit=crop")
                .trangThai(TrangThaiCombo.HOAT_DONG)
                .build());
        boSungComboNeuChuaCo("COMBO_GIA_DINH", Combo.builder()
                .maCombo("COMBO_GIA_DINH")
                .tenCombo("Family Combo")
                .loai(LoaiCombo.COMBO)
                .moTa("2 Bắp lớn + 4 Nước ngọt size M")
                .giaTien(BigDecimal.valueOf(159000))
                .hinhAnh("https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop")
                .trangThai(TrangThaiCombo.HOAT_DONG)
                .build());
        boSungComboNeuChuaCo("BAP_PHO_MAI", Combo.builder()
                .maCombo("BAP_PHO_MAI")
                .tenCombo("Bắp phô mai lớn")
                .loai(LoaiCombo.BAP)
                .moTa("Bắp phô mai size lớn 69oz")
                .giaTien(BigDecimal.valueOf(55000))
                .hinhAnh("https://images.unsplash.com/photo-1585647340883-2a8c37b7b137?w=400&h=300&fit=crop")
                .trangThai(TrangThaiCombo.HOAT_DONG)
                .build());
        boSungComboNeuChuaCo("PEPSI_22OZ", Combo.builder()
                .maCombo("PEPSI_22OZ")
                .tenCombo("Pepsi 22oz")
                .loai(LoaiCombo.NUOC)
                .moTa("Nước ngọt Pepsi size 22oz")
                .giaTien(BigDecimal.valueOf(25000))
                .hinhAnh("https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&h=300&fit=crop")
                .trangThai(TrangThaiCombo.HOAT_DONG)
                .build());
    }

    private void boSungComboNeuChuaCo(String maCombo, Combo mau) {
        if (khoCombo.findByMaComboIgnoreCase(maCombo).isPresent()) return;
        khoCombo.save(mau);
        nhatKy.info("Đã nạp combo mẫu: {}", maCombo);
    }

    private void capNhatHeThongGiaVeNeuCan() {
        boolean coCapNhat = false;
        for (Cinema rap : khoRap.findAll()) {
            boolean rapCapNhat = false;
            if (rap.getPhanTramGheVip() == null) {
                rap.setPhanTramGheVip(TinhGiaVeUtil.MAC_DINH_PHAN_TRAM_VIP);
                rapCapNhat = true;
            }
            if (rap.getPhanTramGheCouple() == null) {
                rap.setPhanTramGheCouple(TinhGiaVeUtil.MAC_DINH_PHAN_TRAM_COUPLE);
                rapCapNhat = true;
            }
            if (rapCapNhat) {
                khoRap.save(rap);
                coCapNhat = true;
            }
        }
        for (Showtime suat : khoSuatChieu.findAll()) {
            if (suat.getGiaVeTu() == null || suat.getTrangThaiGhe() == null) continue;
            Cinema rap = khoRap.findById(suat.getMaRap()).orElse(null);
            if (rap == null) continue;
            TinhGiaVeUtil.capNhatPhuThuGhe(suat, rap);
            khoSuatChieu.save(suat);
            coCapNhat = true;
        }
        if (coCapNhat) nhatKy.info("Đã đồng bộ hệ thống giá vé theo % rạp.");
    }

    private Showtime taoSuatChieu(Movie phim, Cinema rap, String maPhong, LocalDateTime thoiGianBatDau, String dinhDang) {
        Cinema.Room phong = rap.getDanhSachPhong().stream().filter(muc -> muc.getMaPhong().equals(maPhong)).findFirst().orElseThrow();
        BigDecimal giaVeTu = tinhGiaVeTu(thoiGianBatDau);
        List<Showtime.SeatStatus> trangThaiGhe = ShowtimeSeatMapper.taoTrangThaiGheTuPhong(phong.getDanhSachGhe(), giaVeTu, rap);
        return Showtime.builder()
                .movieId(phim.getId())
                .cinemaId(rap.getId())
                .roomId(maPhong)
                .startTime(thoiGianBatDau)
                .endTime(thoiGianBatDau.plusMinutes(phim.getDuration() != null ? phim.getDuration() : 100))
                .price(giaVeTu)
                .format(dinhDang)
                .seats(trangThaiGhe)
                .build();
    }

    private BigDecimal tinhGiaVeTu(LocalDateTime thoiGian) {
        if (thoiGian == null) return GIA_BAN_NGAY;
        return thoiGian.getHour() >= 18 ? GIA_BAN_TOI : GIA_BAN_NGAY;
    }

    private void napPersonNeuCan() {
        if (khoPerson.count() > 0) return;
        List<Person> danhSach = new ArrayList<>();
        Map<String, String> avatarMap = Map.of(
                "Ryan Reynolds", "https://image.tmdb.org/t/p/w500/h1co81sf9G6svqR1vxGZ1nJ950S.jpg",
                "Hugh Jackman", "https://image.tmdb.org/t/p/w500/oX6CpXmnXCHEZMuBWo2zA7QR4KC.jpg",
                "Shawn Levy", "https://image.tmdb.org/t/p/w500/2L2H2f1hL2fN9aWf6797B.jpg",
                "Lý Hải", "https://picsum.photos/seed/lyhai/300/300",
                "Minh Hà", "https://picsum.photos/seed/minhha/300/300",
                "Tuấn Trần", "https://picsum.photos/seed/tuantran/300/300",
                "Phương Anh Đào", "https://picsum.photos/seed/phuonganhdao/300/300"
        );

        Map<String, String> birthDateMap = Map.of(
                "Ryan Reynolds", "1976-10-23",
                "Hugh Jackman", "1968-10-12",
                "Shawn Levy", "1968-07-23",
                "Lý Hải", "1968-09-28",
                "Minh Hà", "1985-03-27",
                "Tuấn Trần", "1992-11-20",
                "Phương Anh Đào", "1992-04-30"
        );

        for (Movie phim : khoPhim.findAll()) {
            if (phim.getActors() != null) {
                for (String dienVien : phim.getActors()) {
                    if (dienVien == null || dienVien.isBlank()) continue;
                    String ten = dienVien.trim();
                    if (danhSach.stream().noneMatch(p -> p.getName().equalsIgnoreCase(ten))) {
                        danhSach.add(Person.builder()
                                .name(ten)
                                .roleType("ACTOR")
                                .birthDate(birthDateMap.getOrDefault(ten, "1985-06-15"))
                                .avatarUrl(avatarMap.getOrDefault(ten, "https://ui-avatars.com/api/?name=" + ten.replace(" ", "+") + "&background=8b5cf6&color=fff&size=256"))
                                .bio(ten + " là diễn viên nổi tiếng với nhiều vai diễn ấn tượng trên màn ảnh rộng.")
                                .build());
                    }
                }
            }
            if (phim.getDirector() != null && !phim.getDirector().isBlank()) {
                String ten = phim.getDirector().trim();
                Optional<Person> tonTai = danhSach.stream().filter(p -> p.getName().equalsIgnoreCase(ten)).findFirst();
                if (tonTai.isPresent()) {
                    tonTai.get().setRoleType("BOTH");
                } else {
                    danhSach.add(Person.builder()
                            .name(ten)
                            .roleType("DIRECTOR")
                            .birthDate(birthDateMap.getOrDefault(ten, "1975-08-20"))
                            .avatarUrl(avatarMap.getOrDefault(ten, "https://ui-avatars.com/api/?name=" + ten.replace(" ", "+") + "&background=ec4899&color=fff&size=256"))
                            .bio(ten + " là đạo diễn tài năng đã chỉ đạo nhiều siêu phẩm điện ảnh đạt doanh thu cao.")
                            .build());
                }
            }
        }
        if (!danhSach.isEmpty()) {
            khoPerson.saveAll(danhSach);
            nhatKy.info("Đã nạp tự động {} nghệ sĩ (diễn viên/đạo diễn) vào MongoDB.", danhSach.size());
        }
    }
}
