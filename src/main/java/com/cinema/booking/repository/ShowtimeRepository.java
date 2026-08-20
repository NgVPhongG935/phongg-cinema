package com.cinema.booking.repository;

import com.cinema.booking.document.Showtime;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ShowtimeRepository extends MongoRepository<Showtime, String> {
    @Query("{ $and: [ { $or: [ { movieId: ?0 }, { maPhim: ?0 } ] }, { $or: [ { startTime: { $gte: ?1, $lte: ?2 } }, { thoiGianBatDau: { $gte: ?1, $lte: ?2 } } ] } ] }")
    List<Showtime> findByMaPhimAndThoiGianBatDauBetween(String maPhim, LocalDateTime batDauNgay, LocalDateTime ketThucNgay);

    @Query("{ $and: [ { $or: [ { movieId: ?0 }, { maPhim: ?0 } ] }, { $or: [ { cinemaId: ?1 }, { maRap: ?1 } ] }, { $or: [ { startTime: { $gte: ?2, $lte: ?3 } }, { thoiGianBatDau: { $gte: ?2, $lte: ?3 } } ] } ] }")
    List<Showtime> findByMaPhimAndMaRapAndThoiGianBatDauBetween(String maPhim, String maRap, LocalDateTime batDauNgay, LocalDateTime ketThucNgay);

    @Query("{ $and: [ { $or: [ { cinemaId: ?0 }, { maRap: ?0 } ] }, { $or: [ { roomId: ?1 }, { maPhong: ?1 } ] }, { $or: [ { startTime: { $gte: ?2, $lte: ?3 } }, { thoiGianBatDau: { $gte: ?2, $lte: ?3 } } ] } ] }")
    List<Showtime> findByMaRapAndMaPhongAndThoiGianBatDauBetween(String maRap, String maPhong, LocalDateTime batDauNgay, LocalDateTime ketThucNgay);

    @Query("{ $and: [ { $or: [ { cinemaId: ?0 }, { maRap: ?0 } ] }, { $or: [ { startTime: { $gte: ?1, $lte: ?2 } }, { thoiGianBatDau: { $gte: ?1, $lte: ?2 } } ] } ] }")
    List<Showtime> findByMaRapAndThoiGianBatDauBetween(String maRap, LocalDateTime batDauNgay, LocalDateTime ketThucNgay);

    @Query("{ $or: [ { cinemaId: ?0 }, { maRap: ?0 } ] }")
    List<Showtime> findByMaRap(String maRap);

    @Query(value = "{ $or: [ { movieId: ?0 }, { maPhim: ?0 } ] }", exists = true)
    boolean existsByMaPhim(String maPhim);

    @Query(value = "{ $and: [ { $or: [ { cinemaId: ?0 }, { maRap: ?0 } ] }, { $or: [ { roomId: ?1 }, { maPhong: ?1 } ] } ] }", exists = true)
    boolean existsByMaRapAndMaPhong(String maRap, String maPhong);

    @Query("{ $and: [ { $or: [ { cinemaId: ?0 }, { maRap: ?0 } ] }, { $or: [ { roomId: ?1 }, { maPhong: ?1 } ] } ] }")
    List<Showtime> findByMaRapAndMaPhong(String maRap, String maPhong);

    @Query(value = "{}", sort = "{ startTime: -1, thoiGianBatDau: -1 }")
    List<Showtime> findAllByOrderByThoiGianBatDauDesc();
}
