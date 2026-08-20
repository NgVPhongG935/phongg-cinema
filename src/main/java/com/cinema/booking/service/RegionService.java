package com.cinema.booking.service;

import com.cinema.booking.document.Region;
import com.cinema.booking.dto.RegionDto;

import java.util.List;

public interface RegionService {
    List<Region> layDanhSachKhuVuc();
    Region themKhuVuc(RegionDto dto);
    Region capNhatKhuVuc(String id, RegionDto dto);
    void xoaKhuVuc(String id);
}
