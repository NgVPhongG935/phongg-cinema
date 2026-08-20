package com.cinema.booking.document;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.index.TextIndexed;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movies", language = "none")
public class Movie {
    @Id
    private String id;

    @TextIndexed
    @JsonAlias({"tenPhim"})
    private String title;

    @TextIndexed
    @JsonAlias({"moTa"})
    private String description;

    @JsonAlias({"daoDien"})
    private String director;

    @JsonAlias({"dienVien"})
    private List<String> actors;

    @JsonAlias({"theLoai"})
    private List<String> genres;

    @JsonAlias({"thoiLuong"})
    private Integer duration;

    @JsonAlias({"anhPoster", "hinhAnh"})
    private String posterUrl;

    private String backdropUrl;

    @JsonAlias({"duongDanTrailer"})
    private String trailerUrl;

    private String audioUrl;

    @JsonAlias({"danhGia", "diemDanhGia"})
    private Double rating;

    @JsonAlias({"gioiHanTuoi"})
    private String ageRating;

    @Field("movieLanguage")
    @JsonAlias({"ngonNgu", "movieLanguage"})
    private String language;

    @JsonAlias({"trangThai"})
    private MovieStatus status;

    private LocalDate releaseDate;
}
