package com.cinema.booking.util;

import org.springframework.data.mongodb.core.convert.MongoConversionContext;
import org.springframework.data.mongodb.core.convert.MongoValueConverter;
import java.time.LocalDateTime;
import java.util.Date;

/** Applied only to Showtime.startTime/endTime, preserving the existing Render representation. */
public class ShowtimeDateConverter implements MongoValueConverter<Object, Object> {
    @Override public Object read(Object value, MongoConversionContext context) {
        if (value instanceof Date date) return ShowtimeTime.local(date);
        if (value instanceof String text) return LocalDateTime.parse(text);
        return value;
    }
    @Override public Object write(Object value, MongoConversionContext context) {
        if (value instanceof LocalDateTime date) return ShowtimeTime.stored(date);
        return value;
    }
}
