package com.cinema.booking.repository;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

/**
 * Projection danh sách phim: bỏ description / actors / audio (payload nặng),
 * giữ đủ field cho Home / card / banner.
 */
public interface MovieRepository extends MongoRepository<Movie, String> {

    String FIELDS_LIST =
            "{ 'description': 0, 'moTa': 0, 'actors': 0, 'dienVien': 0, 'audioUrl': 0 }";

    @Query(value = "{}", fields = FIELDS_LIST)
    Page<Movie> findAllProjected(Pageable phanTrang);

    @Query(
            value = "{ $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } } ] }",
            fields = FIELDS_LIST)
    Page<Movie> findByTenPhimContainingIgnoreCase(String tuKhoa, Pageable phanTrang);

    @Query(value = "{ $or: [ { status: ?0 }, { trangThai: ?0 } ] }", fields = FIELDS_LIST)
    Page<Movie> findByTrangThai(MovieStatus trangThai, Pageable phanTrang);

    @Query(
            value = "{ $and: [ { $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } } ] }, { $or: [ { status: ?1 }, { trangThai: ?1 } ] } ] }",
            fields = FIELDS_LIST)
    Page<Movie> findByTenPhimContainingIgnoreCaseAndTrangThai(String tuKhoa, MovieStatus trangThai, Pageable phanTrang);

    @Query(
            value = "{ $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, { _id: { $regex: ?0, $options: 'i' } } ] }",
            fields = FIELDS_LIST)
    Page<Movie> timTheoTenHoacMa(String tuKhoa, Pageable phanTrang);

    @Query(
            value = "{ $and: [ { $or: [ { title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, { _id: { $regex: ?0, $options: 'i' } } ] }, { $or: [ { status: ?1 }, { trangThai: ?1 } ] } ] }",
            fields = FIELDS_LIST)
    Page<Movie> timTheoTenHoacMaVaTrangThai(String tuKhoa, MovieStatus trangThai, Pageable phanTrang);

    @Query(
            value = "{ $or: [ "
                    + "{ title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, "
                    + "{ director: { $regex: ?0, $options: 'i' } }, { daoDien: { $regex: ?0, $options: 'i' } }, "
                    + "{ genres: { $regex: ?0, $options: 'i' } }, { theLoai: { $regex: ?0, $options: 'i' } }, "
                    + "{ actors: { $regex: ?0, $options: 'i' } }, { dienVien: { $regex: ?0, $options: 'i' } } "
                    + "] }",
            fields = FIELDS_LIST)
    Page<Movie> timKiemMoRong(String tuKhoa, Pageable phanTrang);

    @Query(
            value = "{ $and: [ "
                    + "{ $or: [ "
                    + "{ title: { $regex: ?0, $options: 'i' } }, { tenPhim: { $regex: ?0, $options: 'i' } }, "
                    + "{ director: { $regex: ?0, $options: 'i' } }, { daoDien: { $regex: ?0, $options: 'i' } }, "
                    + "{ genres: { $regex: ?0, $options: 'i' } }, { theLoai: { $regex: ?0, $options: 'i' } }, "
                    + "{ actors: { $regex: ?0, $options: 'i' } }, { dienVien: { $regex: ?0, $options: 'i' } } "
                    + "] }, { $or: [ { status: ?1 }, { trangThai: ?1 } ] } ] }",
            fields = FIELDS_LIST)
    Page<Movie> timKiemMoRongVaTrangThai(String tuKhoa, MovieStatus trangThai, Pageable phanTrang);

    @Query(value = "{ $text: { $search: ?0 } }", fields = FIELDS_LIST)
    List<Movie> timKiemTheoNoiDung(String tuKhoa, Pageable gioiHan);
}
