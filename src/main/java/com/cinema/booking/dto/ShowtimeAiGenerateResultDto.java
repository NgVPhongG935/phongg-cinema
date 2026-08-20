package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ShowtimeAiGenerateResultDto {
    /** GEMINI hoặc RULE_BASED */
    private String nguon;
    private List<ShowtimeAiSlotDto> danhSachGoiY;
}
