package com.cinema.booking.service;

import com.cinema.booking.config.CacheConfig;
import com.cinema.booking.document.PaymentMethodConfig;
import com.cinema.booking.dto.PaymentMethodConfigDto;
import com.cinema.booking.dto.PaymentMethodConfigResponseDto;
import com.cinema.booking.repository.PaymentMethodConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentMethodConfigServiceImpl implements PaymentMethodConfigService {
    private final PaymentMethodConfigRepository khoCauHinh;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.backend-url:http://localhost:8080}")
    private String backendUrl;

    @Override
    @Cacheable(cacheNames = CacheConfig.CACHE_PAYMENT_METHODS, key = "'active'")
    public List<PaymentMethodConfigResponseDto> layDanhSachKichHoat() {
        napMacDinhNeuCan();
        return khoCauHinh.findAllByKichHoatTrueOrderByThuTuAsc().stream().map(this::chuyenDto).toList();
    }

    @Override
    public List<PaymentMethodConfigResponseDto> layDanhSachAdmin() {
        napMacDinhNeuCan();
        return khoCauHinh.findAllByOrderByThuTuAsc().stream().map(this::chuyenDto).toList();
    }

    @Override
    @CacheEvict(cacheNames = CacheConfig.CACHE_PAYMENT_METHODS, allEntries = true)
    public PaymentMethodConfigResponseDto them(PaymentMethodConfigDto dto) {
        if (dto.getMa() == null || dto.getMa().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thieu ma hinh thuc");
        String ma = dto.getMa().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_");
        if (khoCauHinh.existsById(ma))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ma hinh thuc da ton tai");
        PaymentMethodConfig muc = PaymentMethodConfig.builder()
                .ma(ma)
                .ten(dto.getTen() != null ? dto.getTen().trim() : ma)
                .moTa(dto.getMoTa())
                .mau(dto.getMau() != null ? dto.getMau() : "from-slate-600 to-slate-800")
                .loaiCong(dto.getLoaiCong() != null ? dto.getLoaiCong() : "MANUAL")
                .soTaiKhoan(trimHoacNull(dto.getSoTaiKhoan()))
                .soDienThoai(trimHoacNull(dto.getSoDienThoai()))
                .tenTaiKhoan(dto.getTenTaiKhoan())
                .chiNhanh(dto.getChiNhanh())
                .anhQrUrl(trimHoacNull(dto.getAnhQr()))
                .kichHoat(dto.getKichHoat() != null ? dto.getKichHoat() : true)
                .thuTu(dto.getThuTu() != null ? dto.getThuTu() : 99)
                .build();
        return chuyenDto(khoCauHinh.save(muc));
    }

    @Override
    @CacheEvict(cacheNames = CacheConfig.CACHE_PAYMENT_METHODS, allEntries = true)
    public PaymentMethodConfigResponseDto capNhat(String ma, PaymentMethodConfigDto dto) {
        PaymentMethodConfig muc = khoCauHinh.findById(ma)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay hinh thuc thanh toan"));
        if (dto.getTen() != null) muc.setTen(dto.getTen().trim());
        if (dto.getMoTa() != null) muc.setMoTa(dto.getMoTa().trim());
        if (dto.getMau() != null) muc.setMau(dto.getMau().trim());
        if (dto.getLoaiCong() != null) muc.setLoaiCong(dto.getLoaiCong().trim());
        if (dto.getThuTu() != null) muc.setThuTu(dto.getThuTu());
        if (dto.getSoTaiKhoan() != null) muc.setSoTaiKhoan(trimHoacNull(dto.getSoTaiKhoan()));
        if (dto.getSoDienThoai() != null) muc.setSoDienThoai(trimHoacNull(dto.getSoDienThoai()));
        if (dto.getTenTaiKhoan() != null) muc.setTenTaiKhoan(dto.getTenTaiKhoan().trim());
        if (dto.getChiNhanh() != null) muc.setChiNhanh(dto.getChiNhanh().trim());
        if (dto.getAnhQr() != null) muc.setAnhQrUrl(trimHoacNull(dto.getAnhQr()));
        if (dto.getKichHoat() != null) muc.setKichHoat(dto.getKichHoat());
        return chuyenDto(khoCauHinh.save(muc));
    }

    @Override
    @CacheEvict(cacheNames = CacheConfig.CACHE_PAYMENT_METHODS, allEntries = true)
    public void xoa(String ma) {
        if (!khoCauHinh.existsById(ma))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay hinh thuc thanh toan");
        khoCauHinh.deleteById(ma);
    }

    private String trimHoacNull(String giaTri) {
        if (giaTri == null) return null;
        String s = giaTri.trim();
        return s.isEmpty() ? null : s;
    }

    @Override
    @CacheEvict(cacheNames = CacheConfig.CACHE_PAYMENT_METHODS, allEntries = true)
    public PaymentMethodConfigResponseDto uploadQr(String ma, byte[] noiDung, String contentType) {
        if (noiDung == null || noiDung.length == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File QR rong");
        PaymentMethodConfig muc = khoCauHinh.findById(ma)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay hinh thuc thanh toan"));
        String duoi = ".png";
        if (contentType != null && contentType.contains("jpeg")) duoi = ".jpg";
        try {
            Path thuMuc = Paths.get(uploadDir, "payment");
            Files.createDirectories(thuMuc);
            Path file = thuMuc.resolve(ma + duoi);
            Files.write(file, noiDung);
            String goc = backendUrl.replaceAll("/$", "");
            String url = goc + "/uploads/payment/" + ma + duoi;
            muc.setAnhQrUrl(url);
            return chuyenDto(khoCauHinh.save(muc));
        } catch (IOException loi) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Khong luu duoc file QR");
        }
    }

    @Override
    public void napMacDinhNeuCan() {
        damBaoPhuongThuc(PaymentMethodConfig.builder()
                .ma("CHUYEN_KHOAN_MB")
                .ten("Chuyển khoản MB Bank (VietQR)")
                .moTa("Ngân hàng TMCP Quân đội — quét VietQR Napas 247")
                .mau("from-blue-600 to-indigo-700")
                .soTaiKhoan("2100609032005")
                .tenTaiKhoan("NGUYEN VU PHONG")
                .chiNhanh("MB Bank")
                .kichHoat(true)
                .thuTu(1)
                .loaiCong("MANUAL")
                .build());
        damBaoPhuongThuc(PaymentMethodConfig.builder()
                .ma("MOMO")
                .ten("Ví MoMo")
                .moTa("Quét mã nhận tiền MoMo")
                .mau("from-pink-600 to-rose-600")
                .soDienThoai("0900000001")
                .tenTaiKhoan("NGUYEN VU PHONG")
                .chiNhanh("Mã nhận tiền MoMo")
                .kichHoat(true)
                .thuTu(2)
                .loaiCong("MANUAL")
                .build());
        damBaoPhuongThuc(PaymentMethodConfig.builder()
                .ma("VNPAY")
                .ten("VNPay (thẻ / ngân hàng)")
                .moTa("Thanh toán qua cổng VNPay sandbox — tự động xác nhận")
                .mau("from-red-600 to-rose-700")
                .tenTaiKhoan("Cổng VNPay")
                .chiNhanh("Sandbox")
                .kichHoat(true)
                .thuTu(3)
                .loaiCong("GATEWAY")
                .build());
        damBaoPhuongThuc(PaymentMethodConfig.builder()
                .ma("MOMO_GATEWAY")
                .ten("MoMo (cổng thanh toán)")
                .moTa("Thanh toán qua ví MoMo sandbox — tự động xác nhận")
                .mau("from-pink-600 to-rose-600")
                .tenTaiKhoan("Cổng MoMo")
                .chiNhanh("Sandbox")
                .kichHoat(true)
                .thuTu(4)
                .loaiCong("GATEWAY")
                .build());
    }

    private void damBaoPhuongThuc(PaymentMethodConfig macDinh) {
        if (!khoCauHinh.existsById(macDinh.getMa())) khoCauHinh.save(macDinh);
    }

    private PaymentMethodConfigResponseDto chuyenDto(PaymentMethodConfig muc) {
        return PaymentMethodConfigResponseDto.builder()
                .ma(muc.getMa())
                .ten(muc.getTen())
                .moTa(muc.getMoTa())
                .mau(muc.getMau())
                .soTaiKhoan(muc.getSoTaiKhoan())
                .soDienThoai(muc.getSoDienThoai())
                .tenTaiKhoan(muc.getTenTaiKhoan())
                .chiNhanh(muc.getChiNhanh())
                .anhQr(muc.getAnhQrUrl())
                .kichHoat(muc.getKichHoat())
                .thuTu(muc.getThuTu())
                .loaiCong(muc.getLoaiCong())
                .build();
    }
}
