package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ShowtimeFilterIndexDto {
    private Map<String, List<String>> rapTheoPhim;
    private Map<String, List<String>> dinhDangTheoPhim;
}
