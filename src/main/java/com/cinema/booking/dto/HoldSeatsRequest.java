package com.cinema.booking.dto;

import lombok.Data;
import java.util.List;

@Data
public class HoldSeatsRequest {
    private String maSuatChieu;
    private List<String> danhSachGheChon;
}
