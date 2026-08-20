package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShowtimeAutoSeedResultDto {
    private int soPhim;
    private int soSuat;
    private int soPhimBoQua;
}
