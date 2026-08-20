package com.cinema.booking.service;

import com.cinema.booking.dto.ApDungVoucherResponseDto;
import com.cinema.booking.dto.VoucherDto;
import com.cinema.booking.dto.VoucherResponseDto;

import java.util.List;

public interface VoucherService {
    List<VoucherResponseDto> layDanhSach();
    VoucherResponseDto them(VoucherDto dto);
    VoucherResponseDto capNhat(String id, VoucherDto dto);
    void voHieuHoa(String id);
    ApDungVoucherResponseDto apDungMa(String maCode, java.math.BigDecimal tongTien);
    void tangSoLuongDaDung(String maCode);
}
