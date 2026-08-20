package com.cinema.booking.service;

import com.cinema.booking.dto.ComboDto;
import com.cinema.booking.dto.ComboResponseDto;

import java.util.List;

public interface ComboService {
    List<ComboResponseDto> layDanhSach(boolean layTatCa);
    ComboResponseDto them(ComboDto dto);
    ComboResponseDto capNhat(String id, ComboDto dto);
    void xoa(String id);
}
