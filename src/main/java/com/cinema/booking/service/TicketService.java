package com.cinema.booking.service;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.dto.TicketResponseDto;

import java.util.List;

public interface TicketService {
    List<TicketResponseDto> layDanhSachVeCuaToi(String maNguoiDung, String tuKhoa);
    List<TicketResponseDto> layVeChoThanhToan();
    List<TicketResponseDto> layVeDaXacNhan();
    TicketResponseDto xacNhanThanhToan(String maVe);
    TicketResponseDto baogYeuCauXacNhan(String maVe);
    TicketResponseDto traCuuVeQrcode(String maQrCode);
    TicketResponseDto soatVeQrcode(String maQrCode);
    List<TicketResponseDto> layVeDaSoatHomNay();
    TicketResponseDto chuyenDoiVe(Ticket ve);
}
