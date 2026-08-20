package com.cinema.booking.repository;

import com.cinema.booking.document.Combo;
import com.cinema.booking.document.TrangThaiCombo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ComboRepository extends MongoRepository<Combo, String> {
    List<Combo> findByTrangThai(TrangThaiCombo trangThai);
    Optional<Combo> findByMaComboIgnoreCase(String maCombo);
    boolean existsByMaComboIgnoreCase(String maCombo);
}
