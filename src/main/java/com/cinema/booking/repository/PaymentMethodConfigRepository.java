package com.cinema.booking.repository;

import com.cinema.booking.document.PaymentMethodConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PaymentMethodConfigRepository extends MongoRepository<PaymentMethodConfig, String> {
    List<PaymentMethodConfig> findAllByOrderByThuTuAsc();
    List<PaymentMethodConfig> findAllByKichHoatTrueOrderByThuTuAsc();
}
