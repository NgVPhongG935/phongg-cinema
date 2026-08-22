package com.cinema.booking.document;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "showtimes")
public class Showtime {
    @Id
    private String id;

    @Version
    private Long version;

    @JsonAlias({"maPhim"})
    private String movieId;

    @Indexed
    @JsonAlias({"maRap"})
    private String cinemaId;

    @JsonAlias({"maPhong"})
    private String roomId;

    @Indexed
    @JsonAlias({"thoiGianBatDau"})
    private LocalDateTime startTime;

    @JsonAlias({"thoiGianKetThuc"})
    private LocalDateTime endTime;

    @JsonAlias({"giaVeTu"})
    private BigDecimal price;

    @JsonAlias({"dinhDang"})
    private String format;

    @JsonAlias({"trangThaiGhe"})
    private List<SeatStatus> seats;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SeatStatus {
        @JsonAlias({"soGhe"})
        private String seatNumber;

        @JsonAlias({"trangThai"})
        private SeatAvailability status;

        @JsonAlias({"nguoiGiuGhe"})
        private String heldBy;

        @JsonAlias({"thoiGianHetHanGiu"})
        private LocalDateTime heldExpiresAt;

        @JsonAlias({"loaiGhe"})
        private String seatType;

        @JsonAlias({"phuThu"})
        private Integer surcharge;

        // Compatibility getters / setters
        public String getSoGhe() { return seatNumber; }
        public void setSoGhe(String v) { if (seatNumber == null) seatNumber = v; }
        public SeatAvailability getTrangThai() { return status; }
        public void setTrangThai(SeatAvailability v) { if (status == null) status = v; }
        public String getNguoiGiuGhe() { return heldBy; }
        public void setNguoiGiuGhe(String v) { if (heldBy == null) heldBy = v; }
        public LocalDateTime getThoiGianHetHanGiu() { return heldExpiresAt; }
        public void setThoiGianHetHanGiu(LocalDateTime v) { if (heldExpiresAt == null) heldExpiresAt = v; }
        public String getLoaiGhe() { return seatType; }
        public void setLoaiGhe(String v) { if (seatType == null) seatType = v; }
        public Integer getPhuThu() { return surcharge; }
        public void setPhuThu(Integer v) { if (surcharge == null) surcharge = v; }
    }

    // Compatibility getters / setters
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
    public List<SeatStatus> getTrangThaiGhe() { return seats; }
    public void setTrangThaiGhe(List<SeatStatus> v) { if (seats == null) seats = v; }
    public Long getPhienBan() { return version; }
    public void setPhienBan(Long v) { if (version == null) version = v; }
}
