package com.cinema.booking.repository;

import com.cinema.booking.document.Voucher;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface VoucherRepository extends MongoRepository<Voucher, String> {
    Optional<Voucher> findByMaCodeIgnoreCase(String maCode);
    boolean existsByMaCodeIgnoreCase(String maCode);
}
