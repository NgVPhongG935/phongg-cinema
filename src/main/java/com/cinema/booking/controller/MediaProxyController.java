package com.cinema.booking.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.Set;

/**
 * Proxy poster TMDB qua backend — tránh mất ảnh khi client không vào được image.tmdb.org.
 */
@RestController
@RequestMapping("/api/v1/media")
public class MediaProxyController {

    private static final Set<String> HOST_CHO_PHEP = Set.of(
            "image.tmdb.org",
            "www.themoviedb.org",
            "picsum.photos",
            "fastly.picsum.photos",
            "i.imgur.com"
    );
    private static final int MAX_BYTES = 5 * 1024 * 1024;

    @GetMapping("/proxy")
    public ResponseEntity<byte[]> proxy(@RequestParam("url") String urlGoc) {
        try {
            if (urlGoc == null || urlGoc.isBlank()) {
                return ResponseEntity.badRequest().build();
            }
            URI uri = URI.create(urlGoc.trim());
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (!scheme.equals("https") || !HOST_CHO_PHEP.contains(host)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            HttpURLConnection ketNoi = (HttpURLConnection) uri.toURL().openConnection();
            ketNoi.setConnectTimeout(8000);
            ketNoi.setReadTimeout(12000);
            ketNoi.setInstanceFollowRedirects(true);
            ketNoi.setRequestProperty("User-Agent", "PhongGCinema-MediaProxy/1.0");
            int ma = ketNoi.getResponseCode();
            if (ma < 200 || ma >= 300) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
            }

            String contentType = ketNoi.getContentType();
            if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
                contentType = MediaType.IMAGE_JPEG_VALUE;
            }

            byte[] data;
            try (InputStream in = ketNoi.getInputStream()) {
                data = in.readNBytes(MAX_BYTES + 1);
            }
            if (data.length > MAX_BYTES) {
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setCacheControl("public, max-age=86400");
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
    }
}
