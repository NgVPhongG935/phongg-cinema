package com.cinema.booking.dto;

import com.cinema.booking.document.MovieStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import java.util.List;

@Data
public class MovieDto {
    @JsonAlias({"tenPhim"})
    private String title;

    @JsonAlias({"thoiLuong"})
    private Integer duration;

    @JsonAlias({"theLoai"})
    private List<String> genres;

    @JsonAlias({"ngonNgu"})
    private String language;

    @JsonAlias({"gioiHanTuoi"})
    private String ageRating;

    @JsonAlias({"moTa"})
    private String description;

    @JsonAlias({"anhPoster", "hinhAnh"})
    private String posterUrl;

    @JsonAlias({"duongDanTrailer"})
    private String trailerUrl;

    private String audioUrl;

    @JsonAlias({"trangThai"})
    private MovieStatus status;

    @JsonAlias({"dienVien"})
    private List<String> actors;

    @JsonAlias({"daoDien"})
    private String director;

    @JsonAlias({"danhGia", "diemDanhGia"})
    private Double rating;

    // Helper methods for backward compatibility
    public String getTenPhim() { return title; }
    public void setTenPhim(String v) { if (title == null || title.isBlank()) title = v; }

    public Integer getThoiLuong() { return duration; }
    public void setThoiLuong(Integer v) { if (duration == null) duration = v; }

    public List<String> getTheLoai() { return genres; }
    public void setTheLoai(List<String> v) { if (genres == null) genres = v; }

    public String getNgonNgu() { return language; }
    public void setNgonNgu(String v) { if (language == null) language = v; }

    public String getGioiHanTuoi() { return ageRating; }
    public void setGioiHanTuoi(String v) { if (ageRating == null) ageRating = v; }

    public String getMoTa() { return description; }
    public void setMoTa(String v) { if (description == null || description.isBlank()) description = v; }

    public String getAnhPoster() { return posterUrl; }
    public void setAnhPoster(String v) { if (posterUrl == null || posterUrl.isBlank()) posterUrl = v; }

    public String getDuongDanTrailer() { return trailerUrl; }
    public void setDuongDanTrailer(String v) { if (trailerUrl == null) trailerUrl = v; }

    public MovieStatus getTrangThai() { return status; }
    public void setTrangThai(MovieStatus v) { if (status == null) status = v; }

    public List<String> getDienVien() { return actors; }
    public void setDienVien(List<String> v) { if (actors == null) actors = v; }

    public String getDaoDien() { return director; }
    public void setDaoDien(String v) { if (director == null) director = v; }

    public Double getDanhGia() { return rating; }
    public void setDanhGia(Double v) { if (rating == null) rating = v; }
}
