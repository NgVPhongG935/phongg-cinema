package com.cinema.booking.repository;

import com.cinema.booking.document.Region;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RegionRepository extends MongoRepository<Region, String> {
    List<Region> findAllByOrderByThuTuAscTenKhuVucAsc();
    Optional<Region> findByTenKhuVuc(String tenKhuVuc);
    boolean existsByTenKhuVuc(String tenKhuVuc);
}
