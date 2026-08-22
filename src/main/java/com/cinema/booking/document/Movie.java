package com.cinema.booking.document;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movies")
@CompoundIndex(name = "idx_status_releaseDate", def = "{'status': 1, 'releaseDate': -1}")
public class Movie {
    @Id
    private String id;

    @JsonAlias({"tenPhim"})
    private String title;

    @JsonAlias({"moTa"})
    private String description;

    @JsonAlias({"daoDien"})
    private String director;

    @JsonAlias({"dienVien"})
    private List<String> actors;

    @JsonAlias({"theLoai"})
    private List<String> genres;

    @JsonAlias({"thoiLuong"})
    private Integer duration;

    @JsonAlias({"anhPoster", "hinhAnh"})
    private String posterUrl;

    private String backdropUrl;

    @JsonAlias({"duongDanTrailer"})
    private String trailerUrl;

    private String audioUrl;

    @JsonAlias({"danhGia", "diemDanhGia"})
    private Double rating;

    @JsonAlias({"gioiHanTuoi"})
    private String ageRating;

    @Field("movieLanguage")
    @JsonAlias({"ngonNgu", "movieLanguage", "language"})
    private String language;

    @Indexed
    @JsonAlias({"trangThai"})
    private MovieStatus status;

    @Indexed
    private LocalDate releaseDate;

    // Compatibility getters & setters for MongoDB / Legacy field mapping
    @JsonIgnore
    public String getTenPhim() { return title; }
    public void setTenPhim(String v) { if (title == null) title = v; }

    @JsonIgnore
    public String getMoTa() { return description; }
    public void setMoTa(String v) { if (description == null) description = v; }

    @JsonIgnore
    public String getDaoDien() { return director; }
    public void setDaoDien(String v) { if (director == null) director = v; }

    @JsonIgnore
    public List<String> getDienVien() { return actors; }
    public void setDienVien(List<String> v) { if (actors == null) actors = v; }

    @JsonIgnore
    public List<String> getTheLoai() { return genres; }
    public void setTheLoai(List<String> v) { if (genres == null) genres = v; }

    @JsonIgnore
    public Integer getThoiLuong() { return duration; }
    public void setThoiLuong(Integer v) { if (duration == null) duration = v; }

    @JsonIgnore
    public String getAnhPoster() { return posterUrl; }
    public void setAnhPoster(String v) { if (posterUrl == null) posterUrl = v; }

    @JsonIgnore
    public String getHinhAnh() { return posterUrl; }
    public void setHinhAnh(String v) { if (posterUrl == null) posterUrl = v; }

    @JsonIgnore
    public String getDuongDanTrailer() { return trailerUrl; }
    public void setDuongDanTrailer(String v) { if (trailerUrl == null) trailerUrl = v; }

    @JsonIgnore
    public Double getDanhGia() { return rating; }
    public void setDanhGia(Double v) { if (rating == null) rating = v; }

    @JsonIgnore
    public Double getDiemDanhGia() { return rating; }
    public void setDiemDanhGia(Double v) { if (rating == null) rating = v; }

    @JsonIgnore
    public String getGioiHanTuoi() { return ageRating; }
    public void setGioiHanTuoi(String v) { if (ageRating == null) ageRating = v; }

    @JsonIgnore
    public String getNgonNgu() { return language; }
    public void setNgonNgu(String v) { if (language == null) language = v; }

    @JsonIgnore
    public MovieStatus getTrangThai() { return status; }
    public void setTrangThai(MovieStatus v) { if (status == null) status = v; }

    @JsonIgnore
    public LocalDate getNgayKhoiChieu() { return releaseDate; }
    public void setNgayKhoiChieu(LocalDate v) { if (releaseDate == null) releaseDate = v; }
}
