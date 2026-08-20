package com.cinema.booking.dto;

import com.cinema.booking.document.Showtime;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ShowtimeSeatMapDto {
    private BigDecimal giaVeTu;
    private List<Showtime.SeatStatus> danhSachGhe;
}
