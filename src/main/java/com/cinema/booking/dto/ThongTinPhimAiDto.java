package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ThongTinPhimAiDto {
    @JsonProperty("title")
    @JsonAlias({"tenPhim", "title"})
    private String title;

    @JsonProperty("description")
    @JsonAlias({"tomTat", "moTa", "description", "summary"})
    private String description;

    @JsonProperty("duration")
    @JsonAlias({"thoiLuongPhut", "thoiLuong", "duration", "runtime"})
    private Integer duration;

    @JsonProperty("ageRating")
    @JsonAlias({"gioiHanTuoi", "ageRating"})
    private String ageRating;

    @JsonProperty("genre")
    @JsonAlias({"theLoai", "genres", "genre"})
    private String genre;

    @JsonProperty("director")
    @JsonAlias({"daoDien", "director"})
    private String director;

    @JsonProperty("actors")
    @JsonAlias({"dienVien", "actors", "cast"})
    private String actors;

    @JsonProperty("posterUrl")
    @JsonAlias({"posterUrl", "anhPoster", "hinhAnh"})
    private String posterUrl;

    @JsonProperty("trailerUrl")
    @JsonAlias({"trailerUrl", "duongDanTrailer", "trailer", "trailer_url", "linkTrailer", "trailerId"})
    private String trailerUrl;

    /** Canh bao khi dung du lieu web thay Gemini */
    @JsonProperty("canhBao")
    @JsonAlias({"canhBao", "warning"})
    private String canhBao;

    // Backward-compatibility getters/setters
    public String getTenPhim() { return title; }
    public void setTenPhim(String tenPhim) { this.title = tenPhim; }

    public String getTomTat() { return description; }
    public void setTomTat(String tomTat) { this.description = tomTat; }

    public Integer getThoiLuongPhut() { return duration; }
    public void setThoiLuongPhut(Integer thoiLuongPhut) { this.duration = thoiLuongPhut; }

    public String getGioiHanTuoi() { return ageRating; }
    public void setGioiHanTuoi(String gioiHanTuoi) { this.ageRating = gioiHanTuoi; }

    public String getTheLoai() { return genre; }
    public void setTheLoai(String theLoai) { this.genre = theLoai; }

    public String getDaoDien() { return director; }
    public void setDaoDien(String daoDien) { this.director = daoDien; }

    public String getDienVien() { return actors; }
    public void setDienVien(String dienVien) { this.actors = dienVien; }

    public String getWarning() { return canhBao; }
    public void setWarning(String warning) { this.canhBao = warning; }
}
