package com.cinema.booking.service;

import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

public interface BackupService {
    byte[] exportBackupJson();
    String generateBackupFileName();
    Map<String, Object> restoreBackupJson(MultipartFile file);
}
