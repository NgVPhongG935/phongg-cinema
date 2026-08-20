package com.cinema.booking.config;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import java.util.List;

@Data
public class MovieCastSeedDto {
    @JsonAlias({"tenPhim"})
    private String title;

    @JsonAlias({"dienVien"})
    private List<String> actors;

    @JsonAlias({"daoDien"})
    private String director;

    // Backward compatibility helpers
    public String getTenPhim() { return title; }
    public void setTenPhim(String tenPhim) { if (this.title == null || this.title.isBlank()) this.title = tenPhim; }

    public List<String> getDienVien() { return actors; }
    public void setDienVien(List<String> dienVien) { if (this.actors == null) this.actors = dienVien; }

    public String getDaoDien() { return director; }
    public void setDaoDien(String daoDien) { if (this.director == null) this.director = daoDien; }
}

