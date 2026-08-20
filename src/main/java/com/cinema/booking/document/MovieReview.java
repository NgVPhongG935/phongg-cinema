package com.cinema.booking.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movie_reviews")
public class MovieReview {
    @Id
    private String id;
    private String maPhim;
    private String maNguoiDung;
    private String hoTen;
    private int diem;
    private String noiDung;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;
}
