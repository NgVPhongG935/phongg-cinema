package com.cinema.booking.service;

import com.cinema.booking.document.SeatAvailability;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.dto.CreateTicketRequest;
import com.cinema.booking.dto.HoldSeatsRequest;
import com.cinema.booking.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookingHoldDeadlineTest {
    private final ShowtimeRepository shows = mock(ShowtimeRepository.class);
    private final CinemaRepository cinemas = mock(CinemaRepository.class);
    private final TicketRepository tickets = mock(TicketRepository.class);
    private final BookingServiceImpl service = new BookingServiceImpl(shows, cinemas, tickets,
            mock(VoucherService.class), mock(TicketService.class), mock(TicketPaidService.class), mock(EmailService.class));
    private Showtime show(Showtime.SeatStatus... seats) {
        var show = Showtime.builder().id("show").seats(List.of(seats)).build();
        when(shows.findById("show")).thenReturn(Optional.of(show)); return show;
    }
    private Showtime.SeatStatus seat(String number) {
        return Showtime.SeatStatus.builder().seatNumber(number).status(SeatAvailability.AVAILABLE).build();
    }
    private HoldSeatsRequest request(String... seats) {
        var dto = new HoldSeatsRequest(); dto.setMaSuatChieu("show"); dto.setDanhSachGheChon(List.of(seats)); return dto;
    }
    @Test
    void firstHoldLastsFiveMinutesAndReturnsTimezoneIndependentDeadline() {
        var seat = seat("A1"); show(seat);
        long before = System.currentTimeMillis();
        var result = service.giuGheTamThoi(request("A1"), "user");
        assertThat(result.getThoiGianHetHanEpochMs()).isBetween(before + 300000, System.currentTimeMillis() + 300000);
        assertThat(result.getThoiGianHetHanEpochMs()).isEqualTo(result.getThoiGianHetHan().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        assertThat(seat.getHeldExpiresAt()).isEqualTo(result.getThoiGianHetHan());
        assertThat(seat.getStatus()).isEqualTo(SeatAvailability.HELD);
        assertThat(seat.getHeldBy()).isEqualTo("user");
    }
    @Test
    void repeatedHoldAndAddingSeatsKeepOriginalDeadline() {
        var a = seat("A1"); var b = seat("A2"); show(a, b);
        a.setStatus(SeatAvailability.HELD); a.setHeldBy("user");
        var deadline = LocalDateTime.now().plusMinutes(2); a.setHeldExpiresAt(deadline);
        assertThat(service.giuGheTamThoi(request("A1"), "user").getThoiGianHetHan()).isEqualTo(deadline);
        assertThat(service.giuGheTamThoi(request("A1", "A2"), "user").getThoiGianHetHan()).isEqualTo(deadline);
        assertThat(b.getHeldExpiresAt()).isEqualTo(deadline);
    }
    @Test
    void expiredSessionCanStartAgainButCannotTakeAnotherUsersActiveSeat() {
        var a = seat("A1"); show(a); a.setStatus(SeatAvailability.HELD); a.setHeldBy("user"); a.setHeldExpiresAt(LocalDateTime.now().minusMinutes(1));
        assertThat(service.giuGheTamThoi(request("A1"), "user").getThoiGianHetHan()).isAfter(LocalDateTime.now().plusMinutes(4));
        clearInvocations(shows);
        assertThatThrownBy(() -> service.giuGheTamThoi(request("A1"), "other")).isInstanceOf(ResponseStatusException.class);
        verify(shows, never()).save(any());
    }
    @Test
    void checkoutConvertsHoldToBookedAndCancellingPendingTicketReleasesSeat() {
        var a = seat("A1"); var show = show(a); show.setCinemaId("cinema"); show.setPrice(BigDecimal.valueOf(69000));
        service.giuGheTamThoi(request("A1"), "user");
        when(cinemas.findById("cinema")).thenReturn(Optional.of(Cinema.builder().id("cinema").build()));
        when(tickets.findByMaSuatChieu("show")).thenReturn(List.of());
        when(tickets.save(any())).thenAnswer(call -> call.getArgument(0));
        var dto = new CreateTicketRequest(); dto.setShowtimeId("show"); dto.setUserId("user"); dto.setSeats(List.of("A1"));
        dto.setSeatAmount(BigDecimal.valueOf(69000)); dto.setPaymentMethod("BANK_TRANSFER");
        Ticket ticket = service.taoVeSauThanhToan(dto);
        assertThat(a.getStatus()).isEqualTo(SeatAvailability.BOOKED);
        assertThat(a.getHeldExpiresAt()).isNull();
        ticket.setId("ticket"); ticket.setStatus(TicketStatus.PENDING);
        when(tickets.findById("ticket")).thenReturn(Optional.of(ticket));
        service.huyVeTam("ticket", "user");
        assertThat(a.getStatus()).isEqualTo(SeatAvailability.AVAILABLE);
        assertThat(a.getHeldBy()).isNull();
    }
}
