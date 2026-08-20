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
@Document(collection = "movie_review_replies")
public class MovieReviewReply {
    @Id
    private String id;
    private String maPhim;
    /** ID đánh giá gốc (bình luận cha) */
    private String maDanhGia;
    private String maNguoiDung;
    private String hoTen;
    private String noiDung;
    private LocalDateTime ngayTao;
}
