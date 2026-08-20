package com.cinema.booking.repository;

import com.cinema.booking.document.Cinema;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CinemaRepository extends MongoRepository<Cinema, String> {
    List<Cinema> findByKhuVuc(String khuVuc);
}
