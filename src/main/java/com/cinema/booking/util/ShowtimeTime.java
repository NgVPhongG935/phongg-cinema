package com.cinema.booking.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Date;

/** Conversion for showtime start/end fields only; other application dates are untouched. */
public final class ShowtimeTime {
    private ShowtimeTime() {}
    public static LocalDateTime now() {
        return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));
    }
    public static Date stored(LocalDateTime value) {
        return Date.from(value.toInstant(ZoneOffset.UTC));
    }
    public static LocalDateTime local(Date value) {
        return LocalDateTime.ofInstant(value.toInstant(), ZoneOffset.UTC);
    }
}
