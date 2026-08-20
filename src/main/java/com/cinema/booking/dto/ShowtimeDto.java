package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ShowtimeDto {
    @JsonAlias({"maPhim"})
    private String movieId;

    @JsonAlias({"maRap"})
    private String cinemaId;

    @JsonAlias({"maPhong"})
    private String roomId;

    @JsonAlias({"thoiGianBatDau"})
    private LocalDateTime startTime;

    @JsonAlias({"thoiGianKetThuc"})
    private LocalDateTime endTime;

    @JsonAlias({"giaVeTu"})
    private BigDecimal price;

    @JsonAlias({"dinhDang"})
    private String format;

    // Backward compatibility getters/setters
    public String getMaPhim() { return movieId; }
    public void setMaPhim(String v) { if (movieId == null) movieId = v; }

    public String getMaRap() { return cinemaId; }
    public void setMaRap(String v) { if (cinemaId == null) cinemaId = v; }

    public String getMaPhong() { return roomId; }
    public void setMaPhong(String v) { if (roomId == null) roomId = v; }

    public LocalDateTime getThoiGianBatDau() { return startTime; }
    public void setThoiGianBatDau(LocalDateTime v) { if (startTime == null) startTime = v; }

    public LocalDateTime getThoiGianKetThuc() { return endTime; }
    public void setThoiGianKetThuc(LocalDateTime v) { if (endTime == null) endTime = v; }

    public BigDecimal getGiaVeTu() { return price; }
    public void setGiaVeTu(BigDecimal v) { if (price == null) price = v; }

    public String getDinhDang() { return format; }
    public void setDinhDang(String v) { if (format == null) format = v; }
}
