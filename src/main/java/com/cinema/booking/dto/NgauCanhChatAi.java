package com.cinema.booking.dto;

import lombok.Data;

@Data
public class NgauCanhChatAi {
    private Double viDo;
    private Double kinhDo;
    /** gps hoặc khu_vuc */
    private String cheDo;
    private String khuVuc;

    public boolean coGps() {
        return viDo != null && kinhDo != null;
    }

    public boolean coKhuVuc() {
        return "khu_vuc".equals(cheDo) && khuVuc != null && !khuVuc.isBlank();
    }
}
