package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.dto.MovieDto;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.cinema.booking.repository.MovieRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import java.util.List;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class MovieMediaUpdateTest {
    private final MovieRepository repository = mock(MovieRepository.class);
    private final GeminiMovieService ai = mock(GeminiMovieService.class);
    private final MovieServiceImpl service = new MovieServiceImpl(repository, ai);
    private Movie movie() {
        Movie movie = Movie.builder().id("movie1").title("Ratatouille").duration(111)
                .genres(List.of("Animation")).actors(List.of("Actor"))
                .posterUrl("https://image.tmdb.org/t/p/w500/poster.jpg")
                .trailerUrl("https://www.youtube.com/watch?v=abcdefghijk").build();
        when(repository.findById("movie1")).thenReturn(Optional.of(movie));
        when(repository.save(any())).thenAnswer(call -> call.getArgument(0));
        return movie;
    }
    @Test
    void explicitlyClearsBadMediaButDoesNotClearOmittedFields() {
        Movie movie = movie();
        service.capNhatPhim("movie1", new MovieDto());
        assertThat(movie.getPosterUrl()).endsWith("poster.jpg");
        assertThat(movie.getTrailerUrl()).endsWith("abcdefghijk");
        MovieDto update = new MovieDto(); update.setPosterUrl(""); update.setTrailerUrl("");
        service.capNhatPhim("movie1", update);
        assertThat(movie.getPosterUrl()).isEmpty();
        assertThat(movie.getTrailerUrl()).isEmpty();
    }
    @Test
    void rejectsRandomPostersAndSearchTrailersBeforeSave() {
        movie();
        MovieDto update = new MovieDto(); update.setPosterUrl("https://picsum.photos/300/450");
        assertThatThrownBy(() -> service.capNhatPhim("movie1", update)).isInstanceOf(ResponseStatusException.class);
        update.setPosterUrl(null); update.setTrailerUrl("https://youtube.com/results?search_query=Ratatouille");
        assertThatThrownBy(() -> service.capNhatPhim("movie1", update)).isInstanceOf(ResponseStatusException.class);
        verify(repository, never()).save(any());
    }
    @Test
    void emptyAiResultPreservesDataAndDoesNotSave() {
        Movie movie = movie();
        when(ai.taoThongTinPhim("Ratatouille")).thenReturn(ThongTinPhimAiDto.builder().title("Ratatouille").canhBao("Not found").build());
        assertThat(service.dongBoAiChoPhim("movie1")).isSameAs(movie);
        assertThat(movie.getGenres()).containsExactly("Animation");
        assertThat(movie.getActors()).containsExactly("Actor");
        verify(repository, never()).save(any());
    }
}
