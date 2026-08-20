package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.dto.MovieDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface MovieService {
    Page<Movie> layDanhSachPhim(String tuKhoa, String trangThai, Pageable phanTrang);
    Movie layChiTietPhim(String id);
    Movie themPhimMoi(MovieDto dto);
    Movie capNhatPhim(String id, MovieDto dto);
    void xoaPhim(String id);
    Map<String, Object> dongBoAiHangLoatPhim();
    Movie dongBoAiChoPhim(String id);
}
