package com.cinema.booking.service;

import com.cinema.booking.document.KieuGiamGiam;
import com.cinema.booking.document.Voucher;
import com.cinema.booking.dto.ApDungVoucherResponseDto;
import com.cinema.booking.dto.VoucherDto;
import com.cinema.booking.dto.VoucherResponseDto;
import com.cinema.booking.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {
    private final VoucherRepository khoVoucher;

    @Override
    public List<VoucherResponseDto> layDanhSach() {
        return khoVoucher.findAll().stream()
                .sorted(Comparator.comparing(Voucher::getNgayKetThuc, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::chuyenDoi)
                .toList();
    }

    @Override
    public VoucherResponseDto them(VoucherDto dto) {
        kiemTraDto(dto, null);
        String maCode = chuanHoaMaCode(dto.getMaCode());
        if (khoVoucher.existsByMaCodeIgnoreCase(maCode))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma voucher da ton tai");
        Voucher voucher = Voucher.builder()
                .maCode(maCode)
                .kieuGiam(dto.getKieuGiam())
                .giaTriGiam(dto.getGiaTriGiam())
                .giamToiDa(dto.getGiamToiDa())
                .donToiThieu(dto.getDonToiThieu())
                .ngayBatDau(dto.getNgayBatDau())
                .ngayKetThuc(dto.getNgayKetThuc())
                .soLuong(dto.getSoLuong())
                .soLuongDaDung(0)
                .voHieuHoa(false)
                .build();
        return chuyenDoi(khoVoucher.save(voucher));
    }

    @Override
    public VoucherResponseDto capNhat(String id, VoucherDto dto) {
        Voucher voucher = timVoucher(id);
        kiemTraDto(dto, voucher.getMaCode());
        String maCode = chuanHoaMaCode(dto.getMaCode());
        if (!maCode.equalsIgnoreCase(voucher.getMaCode()) && khoVoucher.existsByMaCodeIgnoreCase(maCode))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma voucher da ton tai");
        voucher.setMaCode(maCode);
        voucher.setKieuGiam(dto.getKieuGiam());
        voucher.setGiaTriGiam(dto.getGiaTriGiam());
        voucher.setGiamToiDa(dto.getGiamToiDa());
        voucher.setDonToiThieu(dto.getDonToiThieu());
        voucher.setNgayBatDau(dto.getNgayBatDau());
        voucher.setNgayKetThuc(dto.getNgayKetThuc());
        voucher.setSoLuong(dto.getSoLuong());
        return chuyenDoi(khoVoucher.save(voucher));
    }

    @Override
    public void voHieuHoa(String id) {
        Voucher voucher = timVoucher(id);
        voucher.setVoHieuHoa(true);
        khoVoucher.save(voucher);
    }

    @Override
    public ApDungVoucherResponseDto apDungMa(String maCode, java.math.BigDecimal tongTien) {
        if (tongTien == null || tongTien.signum() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tong tien khong hop le");
        Voucher voucher = timVoucherHopLe(maCode);
        java.math.BigDecimal soGiam = tinhSoTienGiam(voucher, tongTien);
        java.math.BigDecimal tongSauGiam = tongTien.subtract(soGiam);
        return ApDungVoucherResponseDto.builder()
                .maCode(voucher.getMaCode())
                .maVoucher(voucher.getId())
                .tongTienGoc(tongTien)
                .soTienGiam(soGiam)
                .tongTienSauGiam(tongSauGiam)
                .thongBao("Đã áp dụng mã giảm giá thành công")
                .build();
    }

    @Override
    public void tangSoLuongDaDung(String maCode) {
        Voucher voucher = timVoucherTheoMa(maCode);
        int daDung = voucher.getSoLuongDaDung() != null ? voucher.getSoLuongDaDung() : 0;
        voucher.setSoLuongDaDung(daDung + 1);
        khoVoucher.save(voucher);
    }

    private Voucher timVoucherTheoMa(String maCode) {
        String maChuan = chuanHoaMaCode(maCode);
        return khoVoucher.findByMaCodeIgnoreCase(maChuan)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mã giảm giá không hợp lệ hoặc không tồn tại"));
    }

    private Voucher timVoucherHopLe(String maCode) {
        if (maCode == null || maCode.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma giam gia khong hop le");
        Voucher voucher = timVoucherTheoMa(maCode);
        if (Boolean.TRUE.equals(voucher.getVoHieuHoa()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma giam gia da vo hieu");
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getNgayBatDau() != null && now.isBefore(voucher.getNgayBatDau()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma giam gia chua co hieu luc");
        if (voucher.getNgayKetThuc() != null && now.isAfter(voucher.getNgayKetThuc()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma giam gia da het han");
        int daDung = voucher.getSoLuongDaDung() != null ? voucher.getSoLuongDaDung() : 0;
        int tong = voucher.getSoLuong() != null ? voucher.getSoLuong() : 0;
        if (daDung >= tong)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma giam gia da het so luong");
        return voucher;
    }

    private java.math.BigDecimal tinhSoTienGiam(Voucher voucher, java.math.BigDecimal tongTien) {
        if (voucher.getDonToiThieu() != null && tongTien.compareTo(voucher.getDonToiThieu()) < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Don hang chua dat dieu kien (toi thieu " + voucher.getDonToiThieu() + " VND)");
        java.math.BigDecimal soGiam;
        if (voucher.getKieuGiam() == KieuGiamGiam.PERCENT) {
            soGiam = tongTien.multiply(voucher.getGiaTriGiam())
                    .divide(java.math.BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
            if (voucher.getGiamToiDa() != null && soGiam.compareTo(voucher.getGiamToiDa()) > 0)
                soGiam = voucher.getGiamToiDa();
        } else {
            soGiam = voucher.getGiaTriGiam();
        }
        if (soGiam.compareTo(tongTien) > 0) soGiam = tongTien;
        if (soGiam.signum() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma giam gia khong ap dung cho don nay");
        return soGiam;
    }

    private Voucher timVoucher(String id) {
        return khoVoucher.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay voucher"));
    }

    private void kiemTraDto(VoucherDto dto, String maCu) {
        if (dto == null || dto.getMaCode() == null || dto.getMaCode().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma code khong hop le");
        if (dto.getKieuGiam() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kieu giam khong hop le");
        if (dto.getGiaTriGiam() == null || dto.getGiaTriGiam().signum() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gia tri giam khong hop le");
        if (dto.getKieuGiam() == KieuGiamGiam.PERCENT && dto.getGiaTriGiam().compareTo(java.math.BigDecimal.valueOf(100)) > 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phan tram giam khong hop le");
        if (dto.getNgayBatDau() == null || dto.getNgayKetThuc() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngay bat dau/ket thuc khong hop le");
        if (dto.getNgayKetThuc().isBefore(dto.getNgayBatDau()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngay ket thuc phai sau ngay bat dau");
        if (dto.getSoLuong() == null || dto.getSoLuong() <= 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "So luong khong hop le");
    }

    private String chuanHoaMaCode(String maCode) {
        return maCode.trim().toUpperCase(Locale.ROOT);
    }

    private VoucherResponseDto chuyenDoi(Voucher voucher) {
        int daDung = voucher.getSoLuongDaDung() != null ? voucher.getSoLuongDaDung() : 0;
        int tong = voucher.getSoLuong() != null ? voucher.getSoLuong() : 0;
        int conLai = Math.max(0, tong - daDung);
        return VoucherResponseDto.builder()
                .id(voucher.getId())
                .maCode(voucher.getMaCode())
                .kieuGiam(voucher.getKieuGiam())
                .giaTriGiam(voucher.getGiaTriGiam())
                .giamToiDa(voucher.getGiamToiDa())
                .donToiThieu(voucher.getDonToiThieu())
                .ngayBatDau(voucher.getNgayBatDau())
                .ngayKetThuc(voucher.getNgayKetThuc())
                .soLuong(tong)
                .soLuongDaDung(daDung)
                .soLuongConLai(conLai)
                .voHieuHoa(Boolean.TRUE.equals(voucher.getVoHieuHoa()))
                .trangThai(tinhTrangThai(voucher, conLai))
                .build();
    }

    private String tinhTrangThai(Voucher voucher, int conLai) {
        if (Boolean.TRUE.equals(voucher.getVoHieuHoa())) return "VO_HIEU";
        LocalDateTime now = LocalDateTime.now();
        if (voucher.getNgayKetThuc() != null && now.isAfter(voucher.getNgayKetThuc()))
            return "HET_HAN";
        if (voucher.getNgayBatDau() != null && now.isBefore(voucher.getNgayBatDau()))
            return "HET_HAN";
        if (conLai <= 0) return "HET_SO_LUONG";
        return "DANG_AP_DUNG";
    }
}
