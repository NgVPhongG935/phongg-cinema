package com.cinema.booking.service;

import com.cinema.booking.document.PaymentConfig;
import com.cinema.booking.document.PaymentMethodConfig;
import com.cinema.booking.dto.PaymentConfigDto;
import com.cinema.booking.dto.PaymentConfigResponseDto;
import com.cinema.booking.repository.PaymentConfigRepository;
import com.cinema.booking.repository.PaymentMethodConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentConfigServiceImpl implements PaymentConfigService {
  private static final Map<String, String> MAP_NGAN_HANG = Map.of(
      "MB Bank", "CHUYEN_KHOAN_MB",
      "Vietcombank", "CHUYEN_KHOAN_VCB",
      "Techcombank", "CHUYEN_KHOAN_BIDV"
  );

  private final PaymentConfigRepository khoCauHinh;
  private final PaymentMethodConfigRepository khoPhuongThuc;
  private final PaymentMethodConfigService dichVuPhuongThuc;

  @Value("${payment.vnpay.tmn-code:}")
  private String tmnCodeEnv;

  @Value("${payment.vnpay.hash-secret:}")
  private String hashSecretEnv;

  @Value("${app.upload-dir:uploads}")
  private String uploadDir;

  @Value("${app.backend-url:http://localhost:8080}")
  private String backendUrl;

  @Override
  public PaymentConfigResponseDto layCauHinh() {
    dichVuPhuongThuc.napMacDinhNeuCan();
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElseGet(this::taoTuPhuongThuc);
    return chuyenDto(cfg, true);
  }

  @Override
  public PaymentConfigResponseDto luuCauHinh(PaymentConfigDto dto) {
    dichVuPhuongThuc.napMacDinhNeuCan();
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH)
        .orElse(PaymentConfig.builder().id(PaymentConfig.ID_MAC_DINH).build());

    if (dto.getNganHangVietQr() != null) cfg.setNganHangVietQr(dto.getNganHangVietQr().trim());
    if (dto.getSoTaiKhoanVietQr() != null) cfg.setSoTaiKhoanVietQr(trimHoacNull(dto.getSoTaiKhoanVietQr()));
    if (dto.getTenChuVietQr() != null) cfg.setTenChuVietQr(dto.getTenChuVietQr().trim());
    if (dto.getBatVietQr() != null) cfg.setBatVietQr(dto.getBatVietQr());
    if (dto.getQrBankUrl() != null) cfg.setQrBankUrl(trimHoacNull(dto.getQrBankUrl()));
    if (dto.getSoMoMo() != null) cfg.setSoMoMo(trimHoacNull(dto.getSoMoMo()));
    if (dto.getTenChuMoMo() != null) cfg.setTenChuMoMo(dto.getTenChuMoMo().trim());
    if (dto.getQrMomoUrl() != null) cfg.setQrMomoUrl(trimHoacNull(dto.getQrMomoUrl()));
    if (dto.getBatMoMo() != null) cfg.setBatMoMo(dto.getBatMoMo());
    if (dto.getVnpayTmnCode() != null) cfg.setVnpayTmnCode(trimHoacNull(dto.getVnpayTmnCode()));
    if (dto.getVnpayHashSecret() != null && !dto.getVnpayHashSecret().isBlank())
      cfg.setVnpayHashSecret(dto.getVnpayHashSecret().trim());
    if (dto.getBatVnPay() != null) cfg.setBatVnPay(dto.getBatVnPay());
    if (dto.getBatMoMoGateway() != null) cfg.setBatMoMoGateway(dto.getBatMoMoGateway());

    khoCauHinh.save(cfg);
    dongBoPhuongThuc(cfg);
    return chuyenDto(cfg, false);
  }

  @Override
  public PaymentConfigResponseDto uploadQrBank(byte[] noiDung, String contentType) {
    return uploadQrFile(noiDung, contentType, "BANK", (cfg, url) -> cfg.setQrBankUrl(url));
  }

  @Override
  public PaymentConfigResponseDto uploadQrMoMo(byte[] noiDung, String contentType) {
    return uploadQrFile(noiDung, contentType, "MOMO", (cfg, url) -> cfg.setQrMomoUrl(url));
  }

  @Override
  public PaymentConfigResponseDto xoaQrBank() {
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElseGet(this::taoTuPhuongThuc);
    cfg.setQrBankUrl(null);
    xoaFileQr("BANK");
    khoCauHinh.save(cfg);
    dongBoPhuongThuc(cfg);
    return chuyenDto(cfg, false);
  }

  @Override
  public PaymentConfigResponseDto xoaQrMoMo() {
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElseGet(this::taoTuPhuongThuc);
    cfg.setQrMomoUrl(null);
    cfg.setAnhQrMoMo(null);
    xoaFileQr("MOMO");
    khoCauHinh.save(cfg);
    dongBoPhuongThuc(cfg);
    return chuyenDto(cfg, false);
  }

  private PaymentConfigResponseDto uploadQrFile(byte[] noiDung, String contentType, String tienTo,
      java.util.function.BiConsumer<PaymentConfig, String> ganUrl) {
    if (noiDung == null || noiDung.length == 0) throw new IllegalArgumentException("File QR rong");
    String duoi = contentType != null && contentType.contains("jpeg") ? ".jpg" : ".png";
    try {
      Path thuMuc = Paths.get(uploadDir, "payment");
      Files.createDirectories(thuMuc);
      Path file = thuMuc.resolve(tienTo + duoi);
      Files.write(file, noiDung);
      String url = backendUrl.replaceAll("/$", "") + "/uploads/payment/" + tienTo + duoi;
      PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElseGet(this::taoTuPhuongThuc);
      ganUrl.accept(cfg, url);
      khoCauHinh.save(cfg);
      dongBoPhuongThuc(cfg);
      return chuyenDto(cfg, false);
    } catch (IOException loi) {
      throw new IllegalStateException("Khong luu duoc file QR");
    }
  }

  private void xoaFileQr(String tienTo) {
    try {
      Path thuMuc = Paths.get(uploadDir, "payment");
      Files.deleteIfExists(thuMuc.resolve(tienTo + ".png"));
      Files.deleteIfExists(thuMuc.resolve(tienTo + ".jpg"));
    } catch (IOException ignored) { }
  }

  @Override
  public String layVnpayTmnCode() {
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElse(null);
    if (cfg != null && cfg.getVnpayTmnCode() != null && !cfg.getVnpayTmnCode().isBlank())
      return cfg.getVnpayTmnCode();
    return tmnCodeEnv;
  }

  @Override
  public String layVnpayHashSecret() {
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElse(null);
    if (cfg != null && cfg.getVnpayHashSecret() != null && !cfg.getVnpayHashSecret().isBlank())
      return cfg.getVnpayHashSecret();
    return hashSecretEnv;
  }

  @Override
  public boolean vnpayKichHoat() {
    PaymentConfig cfg = khoCauHinh.findById(PaymentConfig.ID_MAC_DINH).orElse(null);
    return cfg == null || cfg.getBatVnPay() == null || cfg.getBatVnPay();
  }

  @Override
  public void napMacDinhNeuCan() {
    if (khoCauHinh.existsById(PaymentConfig.ID_MAC_DINH)) return;
    PaymentConfig cfg = taoTuPhuongThuc();
    khoCauHinh.save(cfg);
    dongBoPhuongThuc(cfg);
  }

  private PaymentConfig taoTuPhuongThuc() {
    PaymentMethodConfig mb = khoPhuongThuc.findById("CHUYEN_KHOAN_MB").orElse(null);
    PaymentMethodConfig momo = khoPhuongThuc.findById("MOMO").orElse(null);
    PaymentMethodConfig vnpay = khoPhuongThuc.findById("VNPAY").orElse(null);
    return PaymentConfig.builder()
        .id(PaymentConfig.ID_MAC_DINH)
        .nganHangVietQr(mb != null && mb.getChiNhanh() != null ? mb.getChiNhanh() : "MB Bank")
        .soTaiKhoanVietQr(mb != null ? mb.getSoTaiKhoan() : "2100609032005")
        .tenChuVietQr(mb != null ? mb.getTenTaiKhoan() : "NGUYEN VU PHONG")
        .batVietQr(mb != null ? mb.getKichHoat() : true)
        .qrBankUrl(mb != null ? mb.getAnhQrUrl() : null)
        .soMoMo(momo != null ? momo.getSoDienThoai() : "0900000001")
        .tenChuMoMo(momo != null ? momo.getTenTaiKhoan() : "NGUYEN VU PHONG")
        .qrMomoUrl(momo != null ? momo.getAnhQrUrl() : null)
        .batMoMo(momo != null ? momo.getKichHoat() : true)
        .vnpayTmnCode(tmnCodeEnv)
        .vnpayHashSecret(hashSecretEnv)
        .batVnPay(vnpay != null ? vnpay.getKichHoat() : true)
        .batMoMoGateway(khoPhuongThuc.findById("MOMO_GATEWAY").map(PaymentMethodConfig::getKichHoat).orElse(true))
        .build();
  }

  private void dongBoPhuongThuc(PaymentConfig cfg) {
    dichVuPhuongThuc.napMacDinhNeuCan();
    String maNganHang = MAP_NGAN_HANG.getOrDefault(cfg.getNganHangVietQr(), "CHUYEN_KHOAN_MB");
    List<String> tatCaNganHang = List.of("CHUYEN_KHOAN_MB", "CHUYEN_KHOAN_VCB", "CHUYEN_KHOAN_BIDV");
    for (String ma : tatCaNganHang) {
      khoPhuongThuc.findById(ma).ifPresent(m -> {
        m.setKichHoat(false);
        khoPhuongThuc.save(m);
      });
    }
    PaymentMethodConfig nganHang = khoPhuongThuc.findById(maNganHang).orElse(null);
    if (nganHang != null) {
      nganHang.setSoTaiKhoan(cfg.getSoTaiKhoanVietQr());
      nganHang.setTenTaiKhoan(cfg.getTenChuVietQr());
      nganHang.setChiNhanh(cfg.getNganHangVietQr());
      nganHang.setAnhQrUrl(cfg.getQrBankUrl());
      nganHang.setKichHoat(Boolean.TRUE.equals(cfg.getBatVietQr()));
      nganHang.setTen("Chuyển khoản " + cfg.getNganHangVietQr() + " (VietQR)");
      khoPhuongThuc.save(nganHang);
    }
    khoPhuongThuc.findById("MOMO").ifPresent(m -> {
      m.setSoDienThoai(cfg.getSoMoMo());
      m.setTenTaiKhoan(cfg.getTenChuMoMo());
      m.setAnhQrUrl(layQrMomoUrl(cfg));
      m.setKichHoat(Boolean.TRUE.equals(cfg.getBatMoMo()));
      khoPhuongThuc.save(m);
    });
    khoPhuongThuc.findById("VNPAY").ifPresent(m -> {
      m.setKichHoat(Boolean.TRUE.equals(cfg.getBatVnPay()));
      khoPhuongThuc.save(m);
    });
    khoPhuongThuc.findById("MOMO_GATEWAY").ifPresent(m -> {
      m.setKichHoat(Boolean.TRUE.equals(cfg.getBatMoMoGateway()));
      khoPhuongThuc.save(m);
    });
  }

  private PaymentConfigResponseDto chuyenDto(PaymentConfig cfg, boolean anMatSecret) {
    boolean coSecret = cfg.getVnpayHashSecret() != null && !cfg.getVnpayHashSecret().isBlank();
    return PaymentConfigResponseDto.builder()
        .nganHangVietQr(cfg.getNganHangVietQr())
        .soTaiKhoanVietQr(cfg.getSoTaiKhoanVietQr())
        .tenChuVietQr(cfg.getTenChuVietQr())
        .batVietQr(cfg.getBatVietQr())
        .qrBankUrl(cfg.getQrBankUrl())
        .soMoMo(cfg.getSoMoMo())
        .tenChuMoMo(cfg.getTenChuMoMo())
        .qrMomoUrl(layQrMomoUrl(cfg))
        .batMoMo(cfg.getBatMoMo())
        .vnpayTmnCode(cfg.getVnpayTmnCode())
        .vnpayHashSecret(anMatSecret && coSecret ? "********" : cfg.getVnpayHashSecret())
        .vnpayHashSecretDaCauHinh(coSecret)
        .batVnPay(cfg.getBatVnPay())
        .batMoMoGateway(cfg.getBatMoMoGateway())
        .build();
  }

  private String trimHoacNull(String giaTri) {
    if (giaTri == null) return null;
    String s = giaTri.trim();
    return s.isEmpty() ? null : s;
  }

  private String layQrMomoUrl(PaymentConfig cfg) {
    if (cfg.getQrMomoUrl() != null && !cfg.getQrMomoUrl().isBlank()) return cfg.getQrMomoUrl();
    return cfg.getAnhQrMoMo();
  }
}
