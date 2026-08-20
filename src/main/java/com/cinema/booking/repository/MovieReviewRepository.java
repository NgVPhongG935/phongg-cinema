package com.cinema.booking.repository;

import com.cinema.booking.document.MovieReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface MovieReviewRepository extends MongoRepository<MovieReview, String> {
    Page<MovieReview> findByMaPhimOrderByNgayTaoDesc(String maPhim, Pageable phanTrang);
    Optional<MovieReview> findByMaPhimAndMaNguoiDung(String maPhim, String maNguoiDung);
    long countByMaPhim(String maPhim);
}
