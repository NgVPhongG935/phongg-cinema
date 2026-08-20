package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SeedResultDto {
    private int soRapCapNhat;
    private int soPhongThem;
    private long soSuatDaXoa;
    private int soSuatThem;
    private int soPhim;
}
