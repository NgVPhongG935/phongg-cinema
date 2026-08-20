package com.cinema.booking.service;

import com.cinema.booking.dto.NgauCanhChatAi;

public interface AiService {
    String tuVanKhachHang(String cauHoiNguoiDung, NgauCanhChatAi ngauCanh);
    /** Gọi Gemini xếp lịch — trả JSON thô hoặc null nếu không dùng được */
    String xeLichChieuTuGemini(String prompt);
}
