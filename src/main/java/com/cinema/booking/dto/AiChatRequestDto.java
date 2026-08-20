package com.cinema.booking.dto;

import lombok.Data;

@Data
public class AiChatRequestDto {
    private String userMessage;
    /** Ho tro payload cu */
    private String message;
    private Double viDo;
    private Double kinhDo;
    private String cheDo;
    private String khuVuc;
}
