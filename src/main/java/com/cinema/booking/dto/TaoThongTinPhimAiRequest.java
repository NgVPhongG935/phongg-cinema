package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaoThongTinPhimAiRequest {
    @JsonProperty("title")
    @JsonAlias({"tenPhim", "title", "movieName", "name", "keyword"})
    private String title;

    public String getTenPhim() {
        return title;
    }

    public void setTenPhim(String tenPhim) {
        this.title = tenPhim;
    }
}
