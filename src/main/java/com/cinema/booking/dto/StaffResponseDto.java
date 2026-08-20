package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StaffResponseDto {
    private String id;
    private String email;
    private String hoTen;
    private String soDienThoai;
    private Boolean biKhoa;
    private String maRapPhuTrach;
    private String tenRapPhuTrach;
}
