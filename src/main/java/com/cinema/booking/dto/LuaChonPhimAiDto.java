package com.cinema.booking.dto;

public record LuaChonPhimAiDto(long id, String title, String originalTitle, String year, String posterUrl, String source) {
    public LuaChonPhimAiDto(long id, String title, String originalTitle, String year, String posterUrl) {
        this(id, title, originalTitle, year, posterUrl, "tmdb");
    }
}
