package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.dto.DuLieuThoPhimDto;
import com.cinema.booking.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * Sửa poster chết (TMDB 404 / URL rỗng) bằng tìm lại trên TMDB.
 */
// @Component
@Order(100)
@RequiredArgsConstructor
public class PosterRepairRunner implements ApplicationRunner {
    private static final Logger nhatKy = LoggerFactory.getLogger(PosterRepairRunner.class);

    private final MovieRepository khoPhim;
    private final TmdbMovieService dichVuTmdb;

    @Override
    public void run(ApplicationArguments args) {
        int daSua = 0;
        int daKiem = 0;
        List<Movie> canLuu = new ArrayList<>();
        for (Movie phim : khoPhim.findAll()) {
            daKiem++;
            String anh = phim.getPosterUrl();
            boolean canSua = anh == null || anh.isBlank()
                    || anh.contains("image.tmdb.org") && !posterConSong(anh);
            if (!canSua) continue;

            DuLieuThoPhimDto tho = dichVuTmdb.timPhim(phim.getTitle());
            if (tho == null || tho.getPosterUrl() == null || tho.getPosterUrl().isBlank()) {
                continue;
            }
            String moi = tho.getPosterUrl().trim();
            if (moi.equals(anh)) continue;
            phim.setPosterUrl(moi);
            canLuu.add(phim);
            daSua++;
        }
        if (!canLuu.isEmpty()) {
            khoPhim.saveAll(canLuu);
        }
        nhatKy.info("Poster repair: kiem {}, sua {} phim.", daKiem, daSua);
    }

    private boolean posterConSong(String url) {
        try {
            HttpURLConnection ketNoi = (HttpURLConnection) URI.create(url).toURL().openConnection();
            ketNoi.setConnectTimeout(5000);
            ketNoi.setReadTimeout(8000);
            ketNoi.setRequestMethod("HEAD");
            ketNoi.setInstanceFollowRedirects(true);
            ketNoi.setRequestProperty("User-Agent", "PhongGCinema-PosterRepair/1.0");
            int ma = ketNoi.getResponseCode();
            if (ma == HttpURLConnection.HTTP_FORBIDDEN || ma == 405) {
                ketNoi.disconnect();
                ketNoi = (HttpURLConnection) URI.create(url).toURL().openConnection();
                ketNoi.setConnectTimeout(5000);
                ketNoi.setReadTimeout(8000);
                ketNoi.setRequestMethod("GET");
                ketNoi.setRequestProperty("Range", "bytes=0-0");
                ketNoi.setRequestProperty("User-Agent", "PhongGCinema-PosterRepair/1.0");
                ma = ketNoi.getResponseCode();
            }
            return ma >= 200 && ma < 400;
        } catch (Exception e) {
            return false;
        }
    }
}
