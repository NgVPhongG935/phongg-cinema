package com.cinema.booking.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vouchers")
public class Voucher {
    @Id private String id;
    private String maCode;
    private KieuGiamGiam kieuGiam;
    private BigDecimal giaTriGiam;
    private BigDecimal giamToiDa;
    private BigDecimal donToiThieu;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private Integer soLuong;
    private Integer soLuongDaDung;
    private Boolean voHieuHoa;
}
