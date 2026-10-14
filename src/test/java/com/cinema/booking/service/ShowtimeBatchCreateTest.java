package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.SeatAvailability;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.dto.ShowtimeBatchCreateDto;
import com.cinema.booking.dto.ShowtimeSlotDto;
import com.cinema.booking.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class ShowtimeBatchCreateTest {
    private final ShowtimeRepository showtimes = mock(ShowtimeRepository.class);
    private final CinemaRepository cinemas = mock(CinemaRepository.class);
    private final MovieRepository movies = mock(MovieRepository.class);
    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final ShowtimeServiceImpl service = new ShowtimeServiceImpl(showtimes, cinemas,
            movies, mock(TicketRepository.class), mongo, mock(AiService.class), new ObjectMapper());

    private ShowtimeBatchCreateDto request(List<ShowtimeSlotDto> slots) {
        var room = Cinema.Room.builder().maPhong("P01").danhSachGhe(List.of(
                Cinema.Seat.builder().soGhe("A1").loaiGhe("NORMAL").build())).build();
        when(movies.existsById("movie")).thenReturn(true);
        when(cinemas.findById("cinema")).thenReturn(Optional.of(Cinema.builder().id("cinema").danhSachPhong(List.of(room)).build()));
        when(mongo.find(any(Query.class), eq(Showtime.class))).thenReturn(List.of());
        var dto = new ShowtimeBatchCreateDto();
        dto.setMaRap("cinema"); dto.setMaPhong("P01"); dto.setMaPhim("movie"); dto.setDinhDang("2D"); dto.setDanhSachSuat(slots);
        return dto;
    }
    private ShowtimeSlotDto slot(String start, String end) {
        var slot = new ShowtimeSlotDto(); slot.setThoiGianBatDau(LocalDateTime.parse(start));
        slot.setThoiGianKetThuc(LocalDateTime.parse(end)); slot.setGiaVeTu(BigDecimal.valueOf(69000)); return slot;
    }
    @Test
    void singleCreateRejectsInvalidTimesAndPriceBeforeWriting() {
        request(List.of());
        var dto = new com.cinema.booking.dto.ShowtimeDto();
        dto.setMaPhim("movie"); dto.setMaRap("cinema"); dto.setMaPhong("P01"); dto.setDinhDang("2D");
        dto.setThoiGianBatDau(LocalDateTime.now().plusDays(2));
        dto.setThoiGianKetThuc(dto.getThoiGianBatDau().minusHours(1)); dto.setGiaVeTu(BigDecimal.valueOf(69000));
        assertThatThrownBy(() -> service.taoSuatChieuMoi(dto)).isInstanceOf(ResponseStatusException.class);
        dto.setThoiGianKetThuc(dto.getThoiGianBatDau().plusHours(2)); dto.setGiaVeTu(BigDecimal.valueOf(-1));
        assertThatThrownBy(() -> service.taoSuatChieuMoi(dto)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(showtimes);
        verify(mongo, never()).find(any(Query.class), eq(Showtime.class));
    }
    @Test
    void singleCreateDetectsCrossMidnightConflictWithOverlapQuery() {
        request(List.of());
        var dto = new com.cinema.booking.dto.ShowtimeDto();
        dto.setMaPhim("movie"); dto.setMaRap("cinema"); dto.setMaPhong("P01"); dto.setDinhDang("2D");
        var midnight = java.time.LocalDate.now().plusDays(2).atStartOfDay();
        dto.setThoiGianBatDau(midnight); dto.setThoiGianKetThuc(midnight.plusHours(2)); dto.setGiaVeTu(BigDecimal.valueOf(69000));
        when(mongo.find(any(Query.class), eq(Showtime.class))).thenReturn(List.of(Showtime.builder()
                .startTime(midnight.minusHours(1)).endTime(midnight.plusHours(1)).build()));
        assertThatThrownBy(() -> service.taoSuatChieuMoi(dto)).isInstanceOf(ResponseStatusException.class);
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongo).find(query.capture(), eq(Showtime.class));
        assertThat(query.getValue().getQueryObject().toString()).contains("endTime", "$gt", "$lt").doesNotContain("$gte");
        verify(showtimes, never()).save(any());
    }
    @Test
    void previewRejectsZeroRoundingStepInsteadOfCrashing() {
        request(List.of());
        when(movies.findById("movie")).thenReturn(Optional.of(com.cinema.booking.document.Movie.builder().duration(100).build()));
        var dto = new com.cinema.booking.dto.ShowtimeGenerateRequestDto();
        dto.setMaPhim("movie"); dto.setMaRap("cinema"); dto.setMaPhong("P01");
        dto.setTuNgay(java.time.LocalDate.now().plusDays(2)); dto.setDenNgay(dto.getTuNgay());
        dto.setTuGio(java.time.LocalTime.of(9, 0)); dto.setDenGio(java.time.LocalTime.of(23, 0)); dto.setBuocLamTronPhut(0);
        assertThatThrownBy(() -> service.goiYSuatChieu(dto)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(mongo, showtimes);
    }
    @Test
    void createsLargeBatchWithOneReadAndOneInsertAndInitializesSeats() {
        var start = LocalDateTime.parse("2026-11-01T09:00");
        var slots = IntStream.range(0, 100).mapToObj(i -> slot(start.plusDays(i).toString(), start.plusDays(i).plusHours(2).toString())).toList();
        assertThat(service.taoHangLoatSuatChieu(request(slots))).isEqualTo(100);
        verify(mongo, times(1)).find(any(Query.class), eq(Showtime.class));
        ArgumentCaptor<Collection<Showtime>> saved = ArgumentCaptor.forClass(Collection.class);
        verify(mongo, times(1)).insert(saved.capture(), eq(Showtime.class));
        assertThat(saved.getValue()).hasSize(100).allSatisfy(s -> {
            assertThat(s.getMovieId()).isEqualTo("movie"); assertThat(s.getRoomId()).isEqualTo("P01");
            assertThat(s.getSeats()).hasSize(1); assertThat(s.getSeats().get(0).getStatus()).isEqualTo(SeatAvailability.AVAILABLE);
        });
        verifyNoInteractions(showtimes);
    }
    @Test
    void lateConflictDoesNotSaveEarlierSlotsAndIncludesCrossMidnightShows() {
        var dto = request(List.of(slot("2026-11-01T09:00", "2026-11-01T11:00"), slot("2026-11-02T00:00", "2026-11-02T02:00")));
        when(mongo.find(any(Query.class), eq(Showtime.class))).thenReturn(List.of(Showtime.builder()
                .startTime(LocalDateTime.parse("2026-11-01T23:00")).endTime(LocalDateTime.parse("2026-11-02T01:00")).build()));
        assertThatThrownBy(() -> service.taoHangLoatSuatChieu(dto)).isInstanceOf(ResponseStatusException.class);
        verify(mongo, never()).insert(any(Collection.class), eq(Showtime.class));
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongo).find(query.capture(), eq(Showtime.class));
        assertThat(query.getValue().getQueryObject().toString()).contains("endTime", "thoiGianKetThuc", "$gt", "$lt", "maRap", "maPhong");
    }
    @Test
    void overlappingSelectedSlotsAreRejectedBeforeDatabaseReadOrWrite() {
        var dto = request(List.of(slot("2026-11-01T10:00", "2026-11-01T12:00"), slot("2026-11-01T09:00", "2026-11-01T11:00")));
        assertThatThrownBy(() -> service.taoHangLoatSuatChieu(dto)).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(mongo, showtimes);
    }
    @Test
    void adjacentSlotsAreAllowedAndInvalidRangesAreRejected() {
        assertThat(service.taoHangLoatSuatChieu(request(List.of(slot("2026-11-01T11:00", "2026-11-01T13:00"), slot("2026-11-01T09:00", "2026-11-01T11:00"))))).isEqualTo(2);
        clearInvocations(mongo);
        assertThatThrownBy(() -> service.taoHangLoatSuatChieu(request(List.of(slot("2026-11-01T11:00", "2026-11-01T09:00"))))).isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(mongo);
    }
    @Test
    void expiredHoldsAreAvailableInSeatMapWithoutAWrite() {
        var expired = Showtime.SeatStatus.builder().seatNumber("A1").status(SeatAvailability.HELD)
                .heldBy("user").heldExpiresAt(LocalDateTime.now().minusMinutes(1)).build();
        var active = Showtime.SeatStatus.builder().seatNumber("A2").status(SeatAvailability.HELD)
                .heldBy("other").heldExpiresAt(LocalDateTime.now().plusMinutes(1)).build();
        when(showtimes.findById("show")).thenReturn(Optional.of(Showtime.builder().seats(List.of(expired, active)).build()));
        service.laySoDoGheSuatChieu("show");
        assertThat(expired.getStatus()).isEqualTo(SeatAvailability.AVAILABLE);
        assertThat(expired.getHeldBy()).isNull();
        assertThat(active.getStatus()).isEqualTo(SeatAvailability.HELD);
        verify(showtimes, never()).save(any());
    }
    @Test
    void filterIndexIncludesNewlySavedEnglishFieldsAndLegacyFields() {
        var current = Showtime.builder().movieId("movie").cinemaId("cinema").format("3D").build();
        var legacy = new Showtime(); legacy.setMaPhim("legacy"); legacy.setMaRap("old-cinema"); legacy.setDinhDang("2D");
        when(mongo.find(any(Query.class), eq(Showtime.class))).thenReturn(List.of(current, legacy));
        var index = service.layChiSoLocPhim();
        assertThat(index.getRapTheoPhim().get("movie")).containsExactly("cinema");
        assertThat(index.getRapTheoPhim().get("legacy")).containsExactly("old-cinema");
        assertThat(index.getDinhDangTheoPhim().get("movie")).containsExactly("3D");
        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongo).find(query.capture(), eq(Showtime.class));
        assertThat(query.getValue().getQueryObject().toString()).contains("startTime", "thoiGianBatDau");
        assertThat(query.getValue().getFieldsObject().keySet()).contains("movieId", "cinemaId", "format", "maPhim", "maRap", "dinhDang");
    }
    @Test
    void futureScheduleIsPublicEvenForAnUpcomingMovie() {
        var start = java.time.LocalDate.now().plusDays(1).atTime(20, 0);
        var show = Showtime.builder().id("show").movieId("movie").cinemaId("cinema").roomId("P01")
                .startTime(start).endTime(start.plusHours(2)).format("2D").build();
        when(showtimes.findByMaRapAndThoiGianBatDauBetween(eq("cinema"), any(), any())).thenReturn(List.of(show));
        when(movies.findAllById(any())).thenReturn(List.of(com.cinema.booking.document.Movie.builder().id("movie")
                .title("Upcoming film").status(com.cinema.booking.document.MovieStatus.UPCOMING).build()));
        when(cinemas.findAllById(any())).thenReturn(List.of(Cinema.builder().id("cinema").tenRap("Cinema").build()));
        var result = service.layLichChieuHomNayTheoRap("cinema", start.toLocalDate().toString());
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getShowtimes()).extracting(s -> s.getId()).containsExactly("show");
    }
}
