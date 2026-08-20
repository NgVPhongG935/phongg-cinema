package com.cinema.booking.controller;

import com.cinema.booking.dto.PaymentConfigDto;
import com.cinema.booking.dto.PaymentConfigResponseDto;
import com.cinema.booking.service.PaymentConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/payment-config")
public class PaymentConfigController {
  private final PaymentConfigService dichVuCauHinh;

  @GetMapping
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto layCauHinh() {
    return dichVuCauHinh.layCauHinh();
  }

  @PutMapping
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto luuCauHinh(@RequestBody PaymentConfigDto dto) {
    return dichVuCauHinh.luuCauHinh(dto);
  }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto luuCauHinhPost(@RequestBody PaymentConfigDto dto) {
    return dichVuCauHinh.luuCauHinh(dto);
  }

  @PostMapping("/bank-qr")
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto uploadQrBank(@RequestParam("file") MultipartFile file) throws Exception {
    return dichVuCauHinh.uploadQrBank(file.getBytes(), file.getContentType());
  }

  @DeleteMapping("/bank-qr")
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto xoaQrBank() {
    return dichVuCauHinh.xoaQrBank();
  }

  @PostMapping("/momo-qr")
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto uploadQrMoMo(@RequestParam("file") MultipartFile file) throws Exception {
    return dichVuCauHinh.uploadQrMoMo(file.getBytes(), file.getContentType());
  }

  @DeleteMapping("/momo-qr")
  @PreAuthorize("hasRole('ADMIN')")
  public PaymentConfigResponseDto xoaQrMoMo() {
    return dichVuCauHinh.xoaQrMoMo();
  }
}
