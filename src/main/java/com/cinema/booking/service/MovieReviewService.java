package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieReview;
import com.cinema.booking.document.MovieReviewReply;
import com.cinema.booking.document.User;
import com.cinema.booking.document.UserRole;
import com.cinema.booking.dto.MovieReviewDto;
import com.cinema.booking.dto.MovieReviewReplyDto;
import com.cinema.booking.dto.MovieReviewSummaryDto;
import com.cinema.booking.dto.TaoMovieReviewRequest;
import com.cinema.booking.dto.TaoMovieReviewReplyRequest;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.MovieReviewReplyRepository;
import com.cinema.booking.repository.MovieReviewRepository;
import com.cinema.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieReviewService {
    private final MovieReviewRepository khoDanhGia;
    private final MovieReviewReplyRepository khoPhanHoi;
    private final MovieRepository khoPhim;
    private final UserRepository khoNguoiDung;

    public Page<MovieReviewDto> layDanhSach(String maPhim, Pageable phanTrang) {
        timPhim(maPhim);
        Page<MovieReview> trang = khoDanhGia.findByMaPhimOrderByNgayTaoDesc(maPhim, phanTrang);
        List<String> maDanhGia = trang.getContent().stream().map(MovieReview::getId).toList();
        Map<String, List<MovieReviewReplyDto>> phanHoiTheoDanhGia = gomPhanHoi(maDanhGia);
        return trang.map(review -> chuyenDoi(review, phanHoiTheoDanhGia.getOrDefault(review.getId(), List.of())));
    }

    public MovieReviewSummaryDto layTomTat(String maPhim) {
        timPhim(maPhim);
        List<MovieReview> tatCa = khoDanhGia.findByMaPhimOrderByNgayTaoDesc(maPhim, Pageable.unpaged()).getContent();
        if (tatCa.isEmpty()) return MovieReviewSummaryDto.builder().diemTrungBinh(0).soLuong(0).build();
        double tb = tatCa.stream().mapToInt(MovieReview::getDiem).average().orElse(0);
        return MovieReviewSummaryDto.builder().diemTrungBinh(Math.round(tb * 10) / 10.0).soLuong(tatCa.size()).build();
    }

    public MovieReviewDto taoHoacCapNhat(String maPhim, String email, TaoMovieReviewRequest yeuCau) {
        timPhim(maPhim);
        User nguoi = timNguoiDung(email);
        int diem = yeuCau.getDiem();
        if (diem < 1 || diem > 5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Diem phai tu 1 den 5");
        String noiDung = yeuCau.getNoiDung() != null ? yeuCau.getNoiDung().trim() : "";
        if (noiDung.length() > 500) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noi dung qua dai");

        MovieReview review = khoDanhGia.findByMaPhimAndMaNguoiDung(maPhim, nguoi.getId()).orElse(null);
        LocalDateTime now = LocalDateTime.now();
        if (review == null) {
            review = MovieReview.builder()
                    .maPhim(maPhim)
                    .maNguoiDung(nguoi.getId())
                    .hoTen(nguoi.getHoTen() != null ? nguoi.getHoTen() : nguoi.getEmail())
                    .diem(diem)
                    .noiDung(noiDung)
                    .ngayTao(now)
                    .ngayCapNhat(now)
                    .build();
        } else {
            review.setDiem(diem);
            review.setNoiDung(noiDung);
            review.setNgayCapNhat(now);
        }
        MovieReview saved = khoDanhGia.save(review);
        List<MovieReviewReplyDto> phanHoi = gomPhanHoi(List.of(saved.getId())).getOrDefault(saved.getId(), List.of());
        return chuyenDoi(saved, phanHoi);
    }

    public void xoaCuaToi(String maPhim, String email) {
        User nguoi = timNguoiDung(email);
        khoDanhGia.findByMaPhimAndMaNguoiDung(maPhim, nguoi.getId()).ifPresent(review -> {
            khoPhanHoi.deleteByMaDanhGia(review.getId());
            khoDanhGia.delete(review);
        });
    }

    public MovieReviewReplyDto taoPhanHoi(String maPhim, String maDanhGia, String email, TaoMovieReviewReplyRequest yeuCau) {
        timPhim(maPhim);
        MovieReview review = khoDanhGia.findById(maDanhGia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay danh gia"));
        if (!review.getMaPhim().equals(maPhim))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh gia khong thuoc phim nay");
        User nguoi = timNguoiDung(email);
        String noiDung = yeuCau.getNoiDung() != null ? yeuCau.getNoiDung().trim() : "";
        if (noiDung.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noi dung phan hoi khong duoc de trống");
        if (noiDung.length() > 300) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Noi dung qua dai");

        MovieReviewReply reply = MovieReviewReply.builder()
                .maPhim(maPhim)
                .maDanhGia(maDanhGia)
                .maNguoiDung(nguoi.getId())
                .hoTen(nguoi.getHoTen() != null ? nguoi.getHoTen() : nguoi.getEmail())
                .noiDung(noiDung)
                .ngayTao(LocalDateTime.now())
                .build();
        return chuyenDoiPhanHoi(khoPhanHoi.save(reply));
    }

    public void xoaPhanHoi(String maPhim, String maDanhGia, String maPhanHoi, String email) {
        timPhim(maPhim);
        MovieReview review = khoDanhGia.findById(maDanhGia)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay danh gia"));
        if (!review.getMaPhim().equals(maPhim))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh gia khong thuoc phim nay");
        User nguoi = timNguoiDung(email);
        MovieReviewReply reply = khoPhanHoi.findById(maPhanHoi)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phan hoi"));
        if (!reply.getMaDanhGia().equals(maDanhGia))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phan hoi khong thuoc danh gia nay");
        boolean laChu = reply.getMaNguoiDung().equals(nguoi.getId());
        boolean laChuDanhGia = review.getMaNguoiDung().equals(nguoi.getId());
        boolean laAdmin = nguoi.getVaiTro() == UserRole.ADMIN;
        if (!laChu && !laChuDanhGia && !laAdmin)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Khong duoc xoa phan hoi nay");
        khoPhanHoi.delete(reply);
    }

    private Map<String, List<MovieReviewReplyDto>> gomPhanHoi(List<String> maDanhGia) {
        if (maDanhGia.isEmpty()) return Collections.emptyMap();
        return khoPhanHoi.findByMaDanhGiaInOrderByNgayTaoAsc(maDanhGia).stream()
                .map(this::chuyenDoiPhanHoi)
                .collect(Collectors.groupingBy(MovieReviewReplyDto::getMaDanhGia));
    }

    private Movie timPhim(String maPhim) {
        return khoPhim.findById(maPhim)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phim"));
    }

    private User timNguoiDung(String email) {
        return khoNguoiDung.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Khong tim thay tai khoan"));
    }

    private MovieReviewDto chuyenDoi(MovieReview review, List<MovieReviewReplyDto> phanHoi) {
        return MovieReviewDto.builder()
                .id(review.getId())
                .maPhim(review.getMaPhim())
                .maNguoiDung(review.getMaNguoiDung())
                .hoTen(review.getHoTen())
                .diem(review.getDiem())
                .noiDung(review.getNoiDung())
                .ngayTao(review.getNgayTao())
                .ngayCapNhat(review.getNgayCapNhat())
                .phanHoi(phanHoi)
                .soPhanHoi(phanHoi.size())
                .build();
    }

    private MovieReviewReplyDto chuyenDoiPhanHoi(MovieReviewReply reply) {
        return MovieReviewReplyDto.builder()
                .id(reply.getId())
                .maDanhGia(reply.getMaDanhGia())
                .maNguoiDung(reply.getMaNguoiDung())
                .hoTen(reply.getHoTen())
                .noiDung(reply.getNoiDung())
                .ngayTao(reply.getNgayTao())
                .build();
    }
}
