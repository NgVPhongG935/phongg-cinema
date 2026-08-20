package com.cinema.booking.repository;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends MongoRepository<Ticket, String> {
    @Query(value = "{ $or: [ { userId: ?0 }, { maNguoiDung: ?0 } ] }", sort = "{ _id: -1 }")
    List<Ticket> findByMaNguoiDungOrderByIdDesc(String maNguoiDung);

    @Query(value = "{ $or: [ { status: ?0 }, { trangThai: ?0 } ] }", sort = "{ createdAt: -1, ngayTao: -1 }")
    List<Ticket> findByTrangThaiOrderByNgayTaoDesc(TicketStatus trangThai);

    @Query(value = "{ $or: [ { status: { $in: ?0 } }, { trangThai: { $in: ?0 } } ] }", sort = "{ createdAt: -1, ngayTao: -1 }")
    List<Ticket> findByTrangThaiInOrderByNgayTaoDesc(Collection<TicketStatus> trangThai);

    @Query(value = "{ $and: [ { $or: [ { status: ?0 }, { trangThai: ?0 } ] }, { $or: [ { checkedInAt: { $gte: ?1, $lte: ?2 } }, { thoiGianSoatVe: { $gte: ?1, $lte: ?2 } } ] } ] }", sort = "{ checkedInAt: -1, thoiGianSoatVe: -1 }")
    List<Ticket> findByTrangThaiAndThoiGianSoatVeBetweenOrderByThoiGianSoatVeDesc(
            TicketStatus trangThai, LocalDateTime tu, LocalDateTime den);

    @Query("{ $or: [ { qrCode: ?0 }, { maQrCode: ?0 } ] }")
    Optional<Ticket> findByMaQrCode(String maQrCode);

    @Query(value = "{ $or: [ { showtimeId: ?0 }, { maSuatChieu: ?0 } ] }")
    List<Ticket> findByMaSuatChieu(String maSuatChieu);

    @Query(value = "{ $or: [ { showtimeId: ?0 }, { maSuatChieu: ?0 } ] }", exists = true)
    boolean existsByMaSuatChieu(String maSuatChieu);

    @Query(value = "{ $or: [ { showtimeId: { $in: ?0 } }, { maSuatChieu: { $in: ?0 } } ] }", exists = true)
    boolean existsByMaSuatChieuIn(Collection<String> maSuatChieu);
}
