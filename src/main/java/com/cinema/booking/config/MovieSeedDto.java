package com.cinema.booking.config;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.util.List;

@Data
public class MovieSeedDto {
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

    @JsonAlias({"duongDanTrailer", "trailer"})
    private String trailerUrl;

    private String audioUrl;

    @JsonAlias({"trangThai"})
    private String status;

    @JsonAlias({"dienVien"})
    private List<String> actors;

    @JsonAlias({"daoDien"})
    private String director;

    // Backward compatibility helpers
    public String getTenPhim() { return title; }
    public void setTenPhim(String tenPhim) { if (this.title == null || this.title.isBlank()) this.title = tenPhim; }

    public Integer getThoiLuong() { return duration; }
    public void setThoiLuong(Integer thoiLuong) { if (this.duration == null) this.duration = thoiLuong; }

    public List<String> getTheLoai() { return genres; }
    public void setTheLoai(List<String> theLoai) { if (this.genres == null) this.genres = theLoai; }

    public String getNgonNgu() { return language; }
    public void setNgonNgu(String ngonNgu) { if (this.language == null) this.language = ngonNgu; }

    public String getGioiHanTuoi() { return ageRating; }
    public void setGioiHanTuoi(String gioiHanTuoi) { if (this.ageRating == null) this.ageRating = gioiHanTuoi; }

    public String getMoTa() { return description; }
    public void setMoTa(String moTa) { if (this.description == null || this.description.isBlank()) this.description = moTa; }

    public String getAnhPoster() { return posterUrl; }
    public void setAnhPoster(String anhPoster) { if (this.posterUrl == null || this.posterUrl.isBlank()) this.posterUrl = anhPoster; }

    public String getDuongDanTrailer() { return trailerUrl; }
    public void setDuongDanTrailer(String duongDanTrailer) { if (this.trailerUrl == null) this.trailerUrl = duongDanTrailer; }

    public String getTrangThai() { return status; }
    public void setTrangThai(String trangThai) { if (this.status == null) this.status = trangThai; }

    public List<String> getDienVien() { return actors; }
    public void setDienVien(List<String> dienVien) { if (this.actors == null) this.actors = dienVien; }

    public String getDaoDien() { return director; }
    public void setDaoDien(String daoDien) { if (this.director == null) this.director = daoDien; }
}

