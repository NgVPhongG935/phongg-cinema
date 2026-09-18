package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss]")
    private LocalDateTime startTime;

    @JsonAlias({"thoiGianKetThuc"})
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss]")
    private LocalDateTime endTime;

    @JsonAlias({"giaVeTu", "ticketPrice"})
    private BigDecimal price;

    @JsonAlias({"dinhDang"})
    private String format;

    // Backward compatibility getters/setters — luôn ghi đè để PUT/POST đúng
    public String getMaPhim() { return movieId; }
    public void setMaPhim(String v) { movieId = v; }

    public String getMaRap() { return cinemaId; }
    public void setMaRap(String v) { cinemaId = v; }

    public String getMaPhong() { return roomId; }
    public void setMaPhong(String v) { roomId = v; }

    public LocalDateTime getThoiGianBatDau() { return startTime; }
    public void setThoiGianBatDau(LocalDateTime v) { startTime = v; }

    public LocalDateTime getThoiGianKetThuc() { return endTime; }
    public void setThoiGianKetThuc(LocalDateTime v) { endTime = v; }

    public BigDecimal getGiaVeTu() { return price; }
    public void setGiaVeTu(BigDecimal v) { price = v; }

    public String getDinhDang() { return format; }
    public void setDinhDang(String v) { format = v; }
}
