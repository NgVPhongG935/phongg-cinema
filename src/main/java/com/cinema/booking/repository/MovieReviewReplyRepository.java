package com.cinema.booking.repository;

import com.cinema.booking.document.MovieReviewReply;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface MovieReviewReplyRepository extends MongoRepository<MovieReviewReply, String> {
    List<MovieReviewReply> findByMaDanhGiaInOrderByNgayTaoAsc(Collection<String> maDanhGia);
    List<MovieReviewReply> findByMaDanhGiaOrderByNgayTaoAsc(String maDanhGia);
    void deleteByMaDanhGia(String maDanhGia);
    long countByMaDanhGia(String maDanhGia);
}
