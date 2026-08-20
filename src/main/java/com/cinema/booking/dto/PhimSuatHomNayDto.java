package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhimSuatHomNayDto {
    @JsonProperty("movieId")
    @JsonAlias({"maPhim", "movieId"})
    private String movieId;

    @JsonProperty("title")
    @JsonAlias({"tenPhim", "title"})
    private String title;

    @JsonProperty("posterUrl")
    @JsonAlias({"anhPoster", "posterUrl", "hinhAnh"})
    private String posterUrl;

    @JsonProperty("duration")
    @JsonAlias({"thoiLuong", "duration"})
    private Integer duration;

    @JsonProperty("ageRating")
    @JsonAlias({"gioiHanTuoi", "ageRating"})
    private String ageRating;

    @JsonProperty("showtimes")
    @JsonAlias({"danhSachSuat", "showtimes"})
    private List<ShowtimeResponseDto> showtimes;

    // Backward-compatibility getters and setters
    public String getMaPhim() { return movieId; }
    public void setMaPhim(String maPhim) { this.movieId = maPhim; }

    public String getTenPhim() { return title; }
    public void setTenPhim(String tenPhim) { this.title = tenPhim; }

    public String getAnhPoster() { return posterUrl; }
    public void setAnhPoster(String anhPoster) { this.posterUrl = anhPoster; }

    public Integer getThoiLuong() { return duration; }
    public void setThoiLuong(Integer thoiLuong) { this.duration = thoiLuong; }

    public String getGioiHanTuoi() { return ageRating; }
    public void setGioiHanTuoi(String gioiHanTuoi) { this.ageRating = gioiHanTuoi; }

    public List<ShowtimeResponseDto> getDanhSachSuat() { return showtimes; }
    public void setDanhSachSuat(List<ShowtimeResponseDto> danhSachSuat) { this.showtimes = danhSachSuat; }
}

