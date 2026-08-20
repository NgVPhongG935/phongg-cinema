package com.cinema.booking.repository;

import com.cinema.booking.document.PaymentConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PaymentConfigRepository extends MongoRepository<PaymentConfig, String> {}
