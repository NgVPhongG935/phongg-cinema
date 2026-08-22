package com.cinema.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableCaching
public class CinemaBookingApplication {

    public static void main(String[] thamSo) {
        SpringApplication.run(CinemaBookingApplication.class, thamSo);
    }
}
