package com.cinema.booking.controller;

import com.cinema.booking.repository.*;
import com.cinema.booking.service.BackupService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/backup")
@CrossOrigin(origins = "*") // Đảm bảo không bị chặn CORS từ Frontend 5173
public class BackupController {

    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final CinemaRepository cinemaRepository;
    private final ShowtimeRepository showtimeRepository;
    private final ComboRepository comboRepository;
    private final RegionRepository regionRepository;
    private final VoucherRepository voucherRepository;
    private final TicketRepository ticketRepository;
    private final PersonRepository personRepository;
    private final BackupService backupService;

    public BackupController(MovieRepository movieRepository,
                            UserRepository userRepository,
                            CinemaRepository cinemaRepository,
                            ShowtimeRepository showtimeRepository,
                            ComboRepository comboRepository,
                            RegionRepository regionRepository,
                            VoucherRepository voucherRepository,
                            TicketRepository ticketRepository,
                            PersonRepository personRepository,
                            BackupService backupService) {
        this.movieRepository = movieRepository;
        this.userRepository = userRepository;
        this.cinemaRepository = cinemaRepository;
        this.showtimeRepository = showtimeRepository;
        this.comboRepository = comboRepository;
        this.regionRepository = regionRepository;
        this.voucherRepository = voucherRepository;
        this.ticketRepository = ticketRepository;
        this.personRepository = personRepository;
        this.backupService = backupService;
    }

    @GetMapping("/export")
    public ResponseEntity<?> exportBackupData() {
        try {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("appName", "PhongG Cinema");
            data.put("backupDate", Instant.now().toString());
            data.put("movies", movieRepository.findAll());
            data.put("persons", personRepository.findAll());
            data.put("users", userRepository.findAll());
            data.put("cinemas", cinemaRepository.findAll());
            data.put("showtimes", showtimeRepository.findAll());
            data.put("combos", comboRepository.findAll());
            data.put("regions", regionRepository.findAll());
            data.put("vouchers", voucherRepository.findAll());
            data.put("tickets", ticketRepository.findAll());

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());

            byte[] jsonBytes = mapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"phongg_cinema_backup.json\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(jsonBytes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Lỗi tạo backup: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/restore", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> restoreBackup(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> ketQua = backupService.restoreBackupJson(file);
            return ResponseEntity.ok(ketQua);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi phục hồi dữ liệu: " + e.getMessage()));
        }
    }
}
