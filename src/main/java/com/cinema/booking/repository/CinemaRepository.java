package com.cinema.booking.repository;

import com.cinema.booking.document.Cinema;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface CinemaRepository extends MongoRepository<Cinema, String> {

    /** Bỏ sơ đồ ghế lồng trong phòng — payload list rạp gọn hơn nhiều. */
    String FIELDS_LIST = "{ 'danhSachPhong.danhSachGhe': 0 }";

    @Query(value = "{}", fields = FIELDS_LIST)
    List<Cinema> findAllProjected();

    @Query(value = "{ 'khuVuc': ?0 }", fields = FIELDS_LIST)
    List<Cinema> findByKhuVucProjected(String khuVuc);

    List<Cinema> findByKhuVuc(String khuVuc);
}
