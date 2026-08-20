package com.cinema.booking.service;

import com.cinema.booking.document.*;
import com.cinema.booking.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class BackupServiceImpl implements BackupService {

    private final MovieRepository khoPhim;
    private final UserRepository khoNguoiDung;
    private final CinemaRepository khoRap;
    private final ShowtimeRepository khoSuatChieu;
    private final ComboRepository khoCombo;
    private final RegionRepository khoKhuVuc;
    private final VoucherRepository khoVoucher;
    private final TicketRepository khoVe;
    private final PersonRepository khoPerson;
    private final MovieReviewRepository khoDanhGia;
    private final PaymentMethodConfigRepository khoPaymentConfig;
    private final ObjectMapper objectMapper;

    @Override
    public byte[] exportBackupJson() {
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("version", "1.0");
            payload.put("exportedAt", LocalDateTime.now().toString());
            payload.put("system", "PhongG Cinema Management System");

            Map<String, Object> collections = new LinkedHashMap<>();
            List<Movie> movies = khoPhim.findAll();
            List<Person> persons = khoPerson.findAll();
            List<User> users = khoNguoiDung.findAll();
            List<Cinema> cinemas = khoRap.findAll();
            List<Showtime> showtimes = khoSuatChieu.findAll();
            List<Combo> combos = khoCombo.findAll();
            List<Region> regions = khoKhuVuc.findAll();
            List<Voucher> vouchers = khoVoucher.findAll();
            List<Ticket> tickets = khoVe.findAll();
            List<MovieReview> reviews = khoDanhGia.findAll();
            List<PaymentMethodConfig> paymentConfigs = khoPaymentConfig.findAll();

            collections.put("movies", movies);
            collections.put("persons", persons);
            collections.put("users", users);
            collections.put("cinemas", cinemas);
            collections.put("showtimes", showtimes);
            collections.put("combos", combos);
            collections.put("regions", regions);
            collections.put("vouchers", vouchers);
            collections.put("tickets", tickets);
            collections.put("reviews", reviews);
            collections.put("paymentMethodConfigs", paymentConfigs);

            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("moviesCount", movies.size());
            stats.put("personsCount", persons.size());
            stats.put("usersCount", users.size());
            stats.put("cinemasCount", cinemas.size());
            stats.put("showtimesCount", showtimes.size());
            stats.put("combosCount", combos.size());
            stats.put("regionsCount", regions.size());
            stats.put("vouchersCount", vouchers.size());
            stats.put("ticketsCount", tickets.size());
            stats.put("reviewsCount", reviews.size());
            stats.put("paymentConfigsCount", paymentConfigs.size());

            payload.put("collections", collections);
            payload.put("stats", stats);

            String jsonString = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload);
            log.info("Admin đã xuất bản sao lưu hệ thống: {} phim, {} người dùng, {} rạp, {} suất chiếu, {} vé.",
                    movies.size(), users.size(), cinemas.size(), showtimes.size(), tickets.size());
            return jsonString.getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Lỗi khi xuất file backup: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể xuất bản sao lưu: " + e.getMessage());
        }
    }

    @Override
    public String generateBackupFileName() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return "phongg_cinema_backup_" + timestamp + ".json";
    }

    @Override
    public Map<String, Object> restoreBackupJson(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File sao lưu không được để trống.");
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            JsonNode rootNode = objectMapper.readTree(content);

            JsonNode collectionsNode = rootNode.has("collections") ? rootNode.get("collections") : rootNode;

            Map<String, Integer> restoredStats = new LinkedHashMap<>();

            // 1. Restore Movies
            if (collectionsNode.has("movies") && collectionsNode.get("movies").isArray()) {
                List<Movie> movies = objectMapper.convertValue(collectionsNode.get("movies"), new TypeReference<List<Movie>>() {});
                if (!movies.isEmpty()) {
                    khoPhim.deleteAll();
                    khoPhim.saveAll(movies);
                    restoredStats.put("movies", movies.size());
                }
            }

            // 1.1 Restore Persons
            if (collectionsNode.has("persons") && collectionsNode.get("persons").isArray()) {
                List<Person> persons = objectMapper.convertValue(collectionsNode.get("persons"), new TypeReference<List<Person>>() {});
                if (!persons.isEmpty()) {
                    khoPerson.deleteAll();
                    khoPerson.saveAll(persons);
                    restoredStats.put("persons", persons.size());
                }
            }

            // 2. Restore Cinemas
            if (collectionsNode.has("cinemas") && collectionsNode.get("cinemas").isArray()) {
                List<Cinema> cinemas = objectMapper.convertValue(collectionsNode.get("cinemas"), new TypeReference<List<Cinema>>() {});
                if (!cinemas.isEmpty()) {
                    khoRap.deleteAll();
                    khoRap.saveAll(cinemas);
                    restoredStats.put("cinemas", cinemas.size());
                }
            }

            // 3. Restore Regions
            if (collectionsNode.has("regions") && collectionsNode.get("regions").isArray()) {
                List<Region> regions = objectMapper.convertValue(collectionsNode.get("regions"), new TypeReference<List<Region>>() {});
                if (!regions.isEmpty()) {
                    khoKhuVuc.deleteAll();
                    khoKhuVuc.saveAll(regions);
                    restoredStats.put("regions", regions.size());
                }
            }

            // 4. Restore Combos
            if (collectionsNode.has("combos") && collectionsNode.get("combos").isArray()) {
                List<Combo> combos = objectMapper.convertValue(collectionsNode.get("combos"), new TypeReference<List<Combo>>() {});
                if (!combos.isEmpty()) {
                    khoCombo.deleteAll();
                    khoCombo.saveAll(combos);
                    restoredStats.put("combos", combos.size());
                }
            }

            // 5. Restore Vouchers
            if (collectionsNode.has("vouchers") && collectionsNode.get("vouchers").isArray()) {
                List<Voucher> vouchers = objectMapper.convertValue(collectionsNode.get("vouchers"), new TypeReference<List<Voucher>>() {});
                if (!vouchers.isEmpty()) {
                    khoVoucher.deleteAll();
                    khoVoucher.saveAll(vouchers);
                    restoredStats.put("vouchers", vouchers.size());
                }
            }

            // 6. Restore Showtimes
            if (collectionsNode.has("showtimes") && collectionsNode.get("showtimes").isArray()) {
                List<Showtime> showtimes = objectMapper.convertValue(collectionsNode.get("showtimes"), new TypeReference<List<Showtime>>() {});
                if (!showtimes.isEmpty()) {
                    khoSuatChieu.deleteAll();
                    // Đảm bảo không bị dính version conflict / Optimistic Locking Failure
                    showtimes.forEach(s -> s.setVersion(null));
                    khoSuatChieu.saveAll(showtimes);
                    restoredStats.put("showtimes", showtimes.size());
                }
            }

            // 7. Restore Users (only if present in backup)
            if (collectionsNode.has("users") && collectionsNode.get("users").isArray()) {
                List<User> users = objectMapper.convertValue(collectionsNode.get("users"), new TypeReference<List<User>>() {});
                if (!users.isEmpty()) {
                    khoNguoiDung.deleteAll();
                    khoNguoiDung.saveAll(users);
                    restoredStats.put("users", users.size());
                }
            }

            // 8. Restore Tickets (if present)
            if (collectionsNode.has("tickets") && collectionsNode.get("tickets").isArray()) {
                List<Ticket> tickets = objectMapper.convertValue(collectionsNode.get("tickets"), new TypeReference<List<Ticket>>() {});
                if (!tickets.isEmpty()) {
                    khoVe.deleteAll();
                    khoVe.saveAll(tickets);
                    restoredStats.put("tickets", tickets.size());
                }
            }

            // 9. Restore Reviews
            if (collectionsNode.has("reviews") && collectionsNode.get("reviews").isArray()) {
                List<MovieReview> reviews = objectMapper.convertValue(collectionsNode.get("reviews"), new TypeReference<List<MovieReview>>() {});
                if (!reviews.isEmpty()) {
                    khoDanhGia.deleteAll();
                    khoDanhGia.saveAll(reviews);
                    restoredStats.put("reviews", reviews.size());
                }
            }

            log.info("Admin đã khôi phục dữ liệu hệ thống từ file thành công: {}", restoredStats);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("success", true);
            result.put("message", "🎉 Đã khôi phục toàn bộ dữ liệu hệ thống thành công!");
            result.put("stats", restoredStats);
            result.put("restoredAt", LocalDateTime.now().toString());
            return result;
        } catch (Exception e) {
            log.error("Lỗi khi khôi phục dữ liệu từ backup: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File sao lưu không hợp lệ hoặc bị lỗi định dạng: " + e.getMessage());
        }
    }
}
