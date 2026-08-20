package com.cinema.booking.service;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.dto.CreateTicketRequest;
import com.cinema.booking.dto.HoldSeatsRequest;
import com.cinema.booking.dto.HoldSeatsResponse;

public interface BookingService {
    HoldSeatsResponse giuGheTamThoi(HoldSeatsRequest yeuCau, String maNguoiDung);
    Ticket taoVeSauThanhToan(CreateTicketRequest yeuCau);
    Ticket taoVaGuiYeuCauCk(CreateTicketRequest yeuCau);
    Ticket guiYeuCauThanhToan(String maVe);
    void huyVeTam(String maVe, String maNguoiDung);
    Ticket duyetVe(String maVe);
}
