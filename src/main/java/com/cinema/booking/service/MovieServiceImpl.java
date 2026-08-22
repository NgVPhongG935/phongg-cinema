package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import com.cinema.booking.dto.MovieDto;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.cinema.booking.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {
    private static final Logger nhatKy = LoggerFactory.getLogger(MovieServiceImpl.class);

    private final MovieRepository khoPhim;
    private final GeminiMovieService geminiMovieService;

    /** Sắp xếp phía DB thay vì load toàn bộ rồi sort in-memory. */
    private Pageable chuanHoaPhanTrang(Pageable phanTrang) {
        Sort sapXep = Sort.by(Sort.Order.desc("rating"), Sort.Order.desc("releaseDate"), Sort.Order.desc("id"));
        if (phanTrang == null || phanTrang.isUnpaged()) {
            return PageRequest.of(0, 20, sapXep);
        }
        return PageRequest.of(phanTrang.getPageNumber(), phanTrang.getPageSize(), sapXep);
    }

    public Page<Movie> layDanhSachPhim(String tuKhoa, String trangThai, Pageable phanTrang) {
        MovieStatus trangThaiPhim = trangThai == null || trangThai.isBlank() ? null : MovieStatus.valueOf(trangThai.toUpperCase());
        Pageable page = chuanHoaPhanTrang(phanTrang);
        String tuKhoaAnToan = tuKhoa != null && !tuKhoa.isBlank() ? escapeRegex(tuKhoa.trim()) : null;

        if (trangThaiPhim != null && tuKhoaAnToan != null)
            return khoPhim.timKiemMoRongVaTrangThai(tuKhoaAnToan, trangThaiPhim, page);
        if (trangThaiPhim != null)
            return khoPhim.findByTrangThai(trangThaiPhim, page);
        if (tuKhoaAnToan != null)
            return khoPhim.timKiemMoRong(tuKhoaAnToan, page);
        return khoPhim.findAllProjected(page);
    }

    public Movie layChiTietPhim(String id) { return timPhim(id); }

    public Movie themPhimMoi(MovieDto dto) {
        Movie phim = new Movie();
        ganDuLieu(phim, dto);
        Movie daLuu = khoPhim.save(phim);
        nhatKy.info("Da them phim moi vao DB: {} (ID: {})", daLuu.getTitle(), daLuu.getId());
        return daLuu;
    }
    public Movie capNhatPhim(String id, MovieDto dto) {
        Movie phim = timPhim(id);
        ganDuLieu(phim, dto);
        Movie daLuu = khoPhim.save(phim);
        nhatKy.info("Da cap nhat phim vao DB thanh cong: {} (ID: {})", daLuu.getTitle(), daLuu.getId());
        return daLuu;
    }
    public void xoaPhim(String id) { khoPhim.delete(timPhim(id)); }

    @Override
    public Map<String, Object> dongBoAiHangLoatPhim() {
        List<Movie> danhSachPhim = khoPhim.findAll();
        int soLuongCapNhat = 0;
        int tongSoPhim = danhSachPhim.size();

        nhatKy.info("Bat dau AI dong bo hang loat cho {} bo phim trong DB", tongSoPhim);

        for (Movie phim : danhSachPhim) {
            String ten = phim.getTitle();

            if (ten == null || ten.isBlank()) continue;

            try {
                ThongTinPhimAiDto aiDto = geminiMovieService.taoThongTinPhim(ten);
                if (aiDto != null) {
                    if (aiDto.getDirector() != null && !aiDto.getDirector().isBlank()) {
                        phim.setDirector(aiDto.getDirector());
                    }
                    if (aiDto.getActors() != null && !aiDto.getActors().isBlank()) {
                        List<String> actorsList = Arrays.stream(aiDto.getActors().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.toList());
                        phim.setActors(actorsList);
                    }
                    if (aiDto.getGenre() != null && !aiDto.getGenre().isBlank()) {
                        List<String> genresList = Arrays.stream(aiDto.getGenre().split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .collect(Collectors.toList());
                        phim.setGenres(genresList);
                    }
                    if (aiDto.getDuration() != null && aiDto.getDuration() > 0) {
                        phim.setDuration(aiDto.getDuration());
                    }
                    if (aiDto.getDescription() != null && !aiDto.getDescription().isBlank()) {
                        phim.setDescription(aiDto.getDescription());
                    }
                    if (aiDto.getPosterUrl() != null && !aiDto.getPosterUrl().isBlank()) {
                        phim.setPosterUrl(aiDto.getPosterUrl());
                    }
                    if (aiDto.getTrailerUrl() != null && !aiDto.getTrailerUrl().isBlank()) {
                        phim.setTrailerUrl(aiDto.getTrailerUrl());
                    }
                    if (aiDto.getAgeRating() != null && !aiDto.getAgeRating().isBlank()) {
                        phim.setAgeRating(aiDto.getAgeRating());
                    }

                    khoPhim.save(phim);
                    soLuongCapNhat++;
                    nhatKy.info("AI da cap nhat phim: {} ({} / {})", ten, soLuongCapNhat, tongSoPhim);
                }

                // Delay 1 giay giua cac request de tranh rate limit Gemini
                Thread.sleep(1000);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                nhatKy.warn("AI dong bo bi ngat.");
                break;
            } catch (Exception e) {
                nhatKy.warn("Loi khi AI cap nhat phim {}: {}", ten, e.getMessage());
            }
        }

        nhatKy.info("Hoan thanh AI dong bo hang loat. Da cap nhat {} / {} phim", soLuongCapNhat, tongSoPhim);

        return Map.of(
                "totalUpdated", soLuongCapNhat,
                "totalMovies", tongSoPhim,
                "message", "Đã cập nhật toàn bộ phim thành công!"
        );
    }

    @Override
    public Movie dongBoAiChoPhim(String id) {
        Movie phim = timPhim(id);
        String ten = phim.getTitle();

        if (ten != null && !ten.isBlank()) {
            ThongTinPhimAiDto aiDto = geminiMovieService.taoThongTinPhim(ten);
            if (aiDto != null) {
                if (aiDto.getDirector() != null && !aiDto.getDirector().isBlank()) {
                    phim.setDirector(aiDto.getDirector());
                }
                if (aiDto.getActors() != null && !aiDto.getActors().isBlank()) {
                    List<String> actorsList = Arrays.stream(aiDto.getActors().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                    phim.setActors(actorsList);
                }
                if (aiDto.getGenre() != null && !aiDto.getGenre().isBlank()) {
                    List<String> genresList = Arrays.stream(aiDto.getGenre().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                    phim.setGenres(genresList);
                }
                if (aiDto.getDuration() != null && aiDto.getDuration() > 0) {
                    phim.setDuration(aiDto.getDuration());
                }
                if (aiDto.getDescription() != null && !aiDto.getDescription().isBlank()) {
                    phim.setDescription(aiDto.getDescription());
                }
                if (aiDto.getPosterUrl() != null && !aiDto.getPosterUrl().isBlank()) {
                    phim.setPosterUrl(aiDto.getPosterUrl());
                }
                if (aiDto.getTrailerUrl() != null && !aiDto.getTrailerUrl().isBlank()) {
                    phim.setTrailerUrl(aiDto.getTrailerUrl());
                }
                if (aiDto.getAgeRating() != null && !aiDto.getAgeRating().isBlank()) {
                    phim.setAgeRating(aiDto.getAgeRating());
                }
                return khoPhim.save(phim);
            }
        }
        return phim;
    }

    private Movie timPhim(String id) { return khoPhim.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phim")); }
    private void ganDuLieu(Movie phim, MovieDto dto) {
        if (dto == null) return;
        if (dto.getTitle() != null && !dto.getTitle().isBlank()) phim.setTitle(dto.getTitle().trim());
        else if (dto.getTenPhim() != null && !dto.getTenPhim().isBlank()) phim.setTitle(dto.getTenPhim().trim());

        if (dto.getDuration() != null) phim.setDuration(dto.getDuration());
        else if (dto.getThoiLuong() != null) phim.setDuration(dto.getThoiLuong());

        if (dto.getGenres() != null) phim.setGenres(dto.getGenres());
        else if (dto.getTheLoai() != null) phim.setGenres(dto.getTheLoai());

        if (dto.getLanguage() != null && !dto.getLanguage().isBlank()) phim.setLanguage(dto.getLanguage().trim());
        else if (dto.getNgonNgu() != null && !dto.getNgonNgu().isBlank()) phim.setLanguage(dto.getNgonNgu().trim());

        if (dto.getAgeRating() != null && !dto.getAgeRating().isBlank()) phim.setAgeRating(dto.getAgeRating().trim());
        else if (dto.getGioiHanTuoi() != null && !dto.getGioiHanTuoi().isBlank()) phim.setAgeRating(dto.getGioiHanTuoi().trim());

        if (dto.getDescription() != null && !dto.getDescription().isBlank()) phim.setDescription(dto.getDescription().trim());
        else if (dto.getMoTa() != null && !dto.getMoTa().isBlank()) phim.setDescription(dto.getMoTa().trim());

        if (dto.getPosterUrl() != null && !dto.getPosterUrl().isBlank()) phim.setPosterUrl(dto.getPosterUrl().trim());
        else if (dto.getAnhPoster() != null && !dto.getAnhPoster().isBlank()) phim.setPosterUrl(dto.getAnhPoster().trim());

        if (dto.getTrailerUrl() != null && !dto.getTrailerUrl().isBlank()) phim.setTrailerUrl(dto.getTrailerUrl().trim());
        else if (dto.getDuongDanTrailer() != null && !dto.getDuongDanTrailer().isBlank()) phim.setTrailerUrl(dto.getDuongDanTrailer().trim());

        if (dto.getAudioUrl() != null && !dto.getAudioUrl().isBlank()) phim.setAudioUrl(dto.getAudioUrl().trim());

        if (dto.getStatus() != null) phim.setStatus(dto.getStatus());
        else if (dto.getTrangThai() != null) phim.setStatus(dto.getTrangThai());

        if (dto.getActors() != null) phim.setActors(dto.getActors());
        else if (dto.getDienVien() != null) phim.setActors(dto.getDienVien());

        if (dto.getDirector() != null && !dto.getDirector().isBlank()) phim.setDirector(dto.getDirector().trim());
        else if (dto.getDaoDien() != null && !dto.getDaoDien().isBlank()) phim.setDirector(dto.getDaoDien().trim());

        if (dto.getRating() != null) phim.setRating(dto.getRating());
        else if (dto.getDanhGia() != null) phim.setRating(dto.getDanhGia());
    }

    private String escapeRegex(String tuKhoa) {
        return tuKhoa.replaceAll("[.*+?^${}()|\\[\\]\\\\]", "\\\\$0");
    }
}
