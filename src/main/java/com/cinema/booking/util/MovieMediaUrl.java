package com.cinema.booking.util;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Set;

public final class MovieMediaUrl {
    private static final Set<String> YOUTUBE_HOSTS = Set.of("youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com");
    private MovieMediaUrl() {}

    public static String trailer(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim().replace("&amp;", "&");
        if (value.matches("[a-zA-Z0-9_-]{11}")) return "https://www.youtube.com/watch?v=" + value;
        try {
            URI uri = URI.create(value);
            if (!Set.of("http", "https").contains(uri.getScheme()) || uri.getUserInfo() != null) return null;
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(java.util.Locale.ROOT);
            String id = null;
            if (Set.of("youtu.be", "www.youtu.be").contains(host)) {
                id = uri.getPath().substring(1);
            } else if (YOUTUBE_HOSTS.contains(host)) {
                if ("/watch".equals(uri.getPath()) && uri.getRawQuery() != null) {
                    for (String part : uri.getRawQuery().split("&")) {
                        if (part.startsWith("v=")) id = URLDecoder.decode(part.substring(2), StandardCharsets.UTF_8);
                    }
                } else if (uri.getPath().matches("/(embed|shorts|v|e)/[^/]+/?")) {
                    id = uri.getPath().split("/")[2];
                }
            }
            return id != null && id.matches("[a-zA-Z0-9_-]{11}") ? "https://www.youtube.com/watch?v=" + id : null;
        } catch (RuntimeException error) {
            return null;
        }
    }

    public static String poster(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim();
        try {
            URI uri = URI.create(value);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(java.util.Locale.ROOT);
            if (!Set.of("http", "https").contains(uri.getScheme()) || host.isBlank() || uri.getUserInfo() != null) return null;
            if (host.equals("picsum.photos") || host.endsWith(".picsum.photos") || host.equals("placehold.co") || host.equals("via.placeholder.com")) return null;
            if (value.contains("...") || value.contains("{YOUTUBE") || uri.getPath().isBlank() || uri.getPath().equals("/")) return null;
            return value;
        } catch (RuntimeException error) {
            return null;
        }
    }
}
