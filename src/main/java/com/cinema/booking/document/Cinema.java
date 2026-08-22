package com.cinema.booking.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "cinemas")
public class Cinema {
    @Id private String id;
    @Indexed
    private String khuVuc;
    private String tenRap;
    private String diaChi;
    private Double viDo;
    private Double kinhDo;
    private Integer phanTramGheVip;
    private Integer phanTramGheCouple;
    private List<Room> danhSachPhong;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Room {
        private String maPhong;
        private String tenPhong;
        private String loaiPhong;
        private List<Seat> danhSachGhe;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class Seat {
        private String soGhe;
        private String loaiGhe;
        private BigDecimal giaVe;
    }
}
