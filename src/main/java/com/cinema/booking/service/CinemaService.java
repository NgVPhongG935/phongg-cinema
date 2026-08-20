package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Cinema.Room;
import com.cinema.booking.dto.CinemaDto;
import com.cinema.booking.dto.RoomDto;
import com.cinema.booking.dto.RoomSeatLayoutDto;
import com.cinema.booking.document.Cinema.Seat;
import java.util.List;

public interface CinemaService {
    List<String> layDanhSachKhuVuc();
    List<Cinema> layDanhSachRap(String khuVuc);
    Cinema layChiTietRap(String id);
    Cinema themRapMoi(CinemaDto dto);
    Cinema capNhatRap(String id, CinemaDto dto);
    List<Room> layDanhSachPhong(String maRap);
    Room themPhong(String maRap, RoomDto dto);
    Room capNhatPhong(String maRap, String maPhong, RoomDto dto);
    void xoaPhong(String maRap, String maPhong);
    RoomSeatLayoutDto laySoDoGhePhong(String maRap, String maPhong);
    RoomSeatLayoutDto capNhatSoDoGhePhong(String maRap, String maPhong, List<Seat> danhSachGhe);
}
