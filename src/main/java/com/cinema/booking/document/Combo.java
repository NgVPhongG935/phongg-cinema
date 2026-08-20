package com.cinema.booking.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.TextIndexed;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "combos")
public class Combo {
    @Id private String id;
    private String maCombo;
    @TextIndexed private String tenCombo;
    private LoaiCombo loai;
    private String moTa;
    private BigDecimal giaTien;
    private String hinhAnh;
    private TrangThaiCombo trangThai;
}
