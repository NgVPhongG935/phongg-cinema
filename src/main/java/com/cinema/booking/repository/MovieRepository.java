package com.cinema.booking.repository;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MovieRepository extends MongoRepository<Movie, String> {
    @Query("{ $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } } ] }")
    Page<Movie> findByTenPhimContainingIgnoreCase(String tuKhoa, Pageable phanTrang);

    @Query("{ $or: [ { status: ?0 }, { trangThai: ?0 } ] }")
    Page<Movie> findByTrangThai(MovieStatus trangThai, Pageable phanTrang);

    @Query("{ $and: [ { $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } } ] }, { $or: [ { status: ?1 }, { trangThai: ?1 } ] } ] }")
    Page<Movie> findByTenPhimContainingIgnoreCaseAndTrangThai(String tuKhoa, MovieStatus trangThai, Pageable phanTrang);

    @Query("{ $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, { _id: { $regex: ?0, $options: 'i' } } ] }")
    Page<Movie> timTheoTenHoacMa(String tuKhoa, Pageable phanTrang);

    @Query("{ $and: [ { $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, { _id: { $regex: ?0, $options: 'i' } } ] }, { $or: [ { status: ?1 }, { trangThai: ?1 } ] } ] }")
    Page<Movie> timTheoTenHoacMaVaTrangThai(String tuKhoa, MovieStatus trangThai, Pageable phanTrang);

    @Query("{ $or: [ "
            + "{ title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, "
            + "{ director: { $regex: ?0, $options: 'i' } }, { daoDien: { $regex: ?0, $options: 'i' } }, "
            + "{ genres: { $regex: ?0, $options: 'i' } }, { theLoai: { $regex: ?0, $options: 'i' } }, "
            + "{ actors: { $regex: ?0, $options: 'i' } }, { dienVien: { $regex: ?0, $options: 'i' } } "
            + "] }")
    Page<Movie> timKiemMoRong(String tuKhoa, Pageable phanTrang);

    @Query("{ $and: [ "
            + "{ $or: [ "
            + "{ title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, "
            + "{ director: { $regex: ?0, $options: 'i' } }, { daoDien: { $regex: ?0, $options: 'i' } }, "
            + "{ genres: { $regex: ?0, $options: 'i' } }, { theLoai: { $regex: ?0, $options: 'i' } }, "
            + "{ actors: { $regex: ?0, $options: 'i' } }, { dienVien: { $regex: ?0, $options: 'i' } } "
            + "] }, { $or: [ { status: ?1 }, { trangThai: ?1 } ] } ] }")
    Page<Movie> timKiemMoRongVaTrangThai(String tuKhoa, MovieStatus trangThai, Pageable phanTrang);

    @Query("{ $text: { $search: ?0 } }")
    List<Movie> timKiemTheoNoiDung(String tuKhoa, Pageable gioiHan);
}
