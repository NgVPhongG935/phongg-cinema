package com.cinema.booking.config;

import com.cinema.booking.document.Showtime;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.convert.NoOpDbRefResolver;
import org.springframework.data.mongodb.core.convert.QueryMapper;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;
import static org.assertj.core.api.Assertions.assertThat;

class ShowtimeDateConverterTest {
    private MappingMongoConverter converter() throws Exception {
        var conversions = new MongoCustomConversions(List.of());
        var context = new MongoMappingContext();
        context.setSimpleTypeHolder(conversions.getSimpleTypeHolder());
        context.afterPropertiesSet();
        var converter = new MappingMongoConverter(NoOpDbRefResolver.INSTANCE, context);
        converter.setCustomConversions(conversions);
        converter.afterPropertiesSet();
        return converter;
    }
    @Test
    void scheduleReadWriteAndRangeQueriesAgreeAcrossHostsWhileHoldDatesKeepDefaultMapping() throws Exception {
        var original = TimeZone.getDefault();
        var start = LocalDateTime.parse("2026-10-13T21:00:00");
        var expected = Date.from(start.toInstant(ZoneOffset.UTC));
        try {
            for (String zone : new String[] { "UTC", "Asia/Ho_Chi_Minh" }) {
                TimeZone.setDefault(TimeZone.getTimeZone(zone));
                var converter = converter();
                var source = new Document("_id", "existing-show").append("startTime", expected);
                assertThat(converter.read(Showtime.class, source).getStartTime()).isEqualTo(start);
                var output = new Document();
                converter.write(Showtime.builder().startTime(start).endTime(start.plusHours(2)).seats(List.of(
                        Showtime.SeatStatus.builder().heldExpiresAt(start).build())).build(), output);
                assertThat(output.get("startTime")).isEqualTo(expected);
                assertThat(output.get("endTime")).isEqualTo(Date.from(start.plusHours(2).toInstant(ZoneOffset.UTC)));
                var seat = ((List<Document>) output.get("seats")).get(0);
                assertThat(seat.get("heldExpiresAt")).isEqualTo(Date.from(start.atZone(ZoneId.systemDefault()).toInstant()));
                var mapper = new QueryMapper(converter);
                var entity = converter.getMappingContext().getPersistentEntity(Showtime.class);
                var localQuery = mapper.getMappedObject(new Query(Criteria.where("startTime").gte(start)).getQueryObject(), entity);
                assertThat(localQuery.get("startTime", Document.class).get("$gte")).isEqualTo(expected);
                var storedQuery = mapper.getMappedObject(new Query(Criteria.where("startTime").gte(expected)).getQueryObject(), entity);
                assertThat(storedQuery.get("startTime", Document.class).get("$gte")).isEqualTo(expected);
            }
        } finally { TimeZone.setDefault(original); }
    }
}
