package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class HoldSeatsResponse {
    private String maSuatChieu;
    private List<String> danhSachGheGiu;
    private LocalDateTime thoiGianHetHan;
}
