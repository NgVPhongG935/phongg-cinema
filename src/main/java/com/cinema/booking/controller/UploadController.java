package com.cinema.booking.controller;

import com.cinema.booking.dto.UploadResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/upload")
public class UploadController {
  @Value("${app.upload-dir:uploads}")
  private String uploadDir;

  @Value("${app.backend-url:http://localhost:8080}")
  private String backendUrl;

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public UploadResponseDto upload(@RequestParam("file") MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) throw new IllegalArgumentException("File rong");
    String loai = file.getContentType();
    if (loai == null || !loai.startsWith("image/")) throw new IllegalArgumentException("Chi chap nhan file anh");
    String duoi = loai.contains("jpeg") ? ".jpg" : loai.contains("png") ? ".png" : ".webp";
    Path thuMuc = Paths.get(uploadDir, "qr-codes");
    Files.createDirectories(thuMuc);
    String tenFile = UUID.randomUUID() + duoi;
    Files.write(thuMuc.resolve(tenFile), file.getBytes());
    String url = backendUrl.replaceAll("/$", "") + "/uploads/qr-codes/" + tenFile;
    return new UploadResponseDto(url);
  }
}
