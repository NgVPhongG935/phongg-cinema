package com.cinema.booking.dto;

import com.cinema.booking.document.Cinema.Room;
import lombok.Data;
import java.util.List;

@Data
public class CinemaDto {
    private String khuVuc;
    private String tenRap;
    private String diaChi;
    private Double viDo;
    private Double kinhDo;
    private Integer phanTramGheVip;
    private Integer phanTramGheCouple;
    private List<Room> danhSachPhong;
}
