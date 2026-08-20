package com.cinema.booking.util;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.document.Showtime;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class KiemTraThoiGianSoatVe {
    private static final int PHUT_CHO_VAO_SOM = 30;
    private static final DateTimeFormatter NGAY = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
    private static final DateTimeFormatter GIO = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"));

    private KiemTraThoiGianSoatVe() {}

    public record KetQua(boolean coTheSoat, String thongBao) {}

    public static KetQua kiemTra(Ticket ve, Showtime suat, LocalDateTime bayGio) {
        if (ve.getTrangThai() == TicketStatus.PENDING || ve.getTrangThai() == TicketStatus.CHO_XAC_NHAN)
            return new KetQua(false, "Vé chưa thanh toán — không thể soát.");
        if (ve.getTrangThai() == TicketStatus.CANCELLED)
            return new KetQua(false, "Vé đã bị hủy.");
        if (ve.getTrangThai() == TicketStatus.USED) {
            String luc = dinhDangNgayGio(ve.getThoiGianSoatVe());
            return new KetQua(false, "Vé đã được soát vào lúc " + luc + ".");
        }
        if (ve.getTrangThai() != TicketStatus.PAID)
            return new KetQua(false, "Vé không ở trạng thái cho phép soát.");

        if (suat == null || suat.getThoiGianBatDau() == null)
            return new KetQua(true, "Vé hợp lệ — có thể cho khách vào rạp.");

        LocalDateTime batDau = suat.getThoiGianBatDau();
        LocalDate homNay = bayGio.toLocalDate();
        LocalDate ngayChieu = batDau.toLocalDate();

        if (homNay.isBefore(ngayChieu))
            return new KetQua(false, "Chưa tới ngày chiếu. Vui lòng quay lại ngày " + NGAY.format(ngayChieu) + ".");
        if (homNay.isAfter(ngayChieu))
            return new KetQua(false, "Vé không đúng ngày (suất chiếu " + NGAY.format(ngayChieu) + ").");

        LocalDateTime gioChoVao = batDau.minusMinutes(PHUT_CHO_VAO_SOM);
        if (bayGio.isBefore(gioChoVao))
            return new KetQua(false, "Chưa tới giờ vào phòng. Vui lòng đợi đến " + GIO.format(gioChoVao) + " (mở cửa trước suất " + PHUT_CHO_VAO_SOM + " phút).");

        return new KetQua(true, "Vé hợp lệ — có thể cho khách vào rạp.");
    }

    public static String dinhDangNgayGio(LocalDateTime thoiGian) {
        if (thoiGian == null) return "—";
        return NGAY.format(thoiGian) + " " + GIO.format(thoiGian);
    }
}
