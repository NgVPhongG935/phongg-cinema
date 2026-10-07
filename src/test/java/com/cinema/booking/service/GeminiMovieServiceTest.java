package com.cinema.booking.service;

import com.cinema.booking.dto.DuLieuThoPhimDto;
import com.cinema.booking.util.MovieMediaUrl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import java.util.Map;
import java.util.List;

class GeminiMovieServiceTest {
    private final MovieCrawlService crawl = mock(MovieCrawlService.class);
    private final GeminiApiClient client = mock(GeminiApiClient.class);
    private final ObjectMapper mapper = new ObjectMapper();
    private final GeminiMovieService service = new GeminiMovieService(mapper, crawl, client);

    @Test
    void noSourcesDoesNotInventMetadataOrMedia() {
        when(crawl.caoDuLieuPhim("Ratatouille")).thenReturn(DuLieuThoPhimDto.builder().sources(0).build());
        var result = service.taoThongTinPhim("Ratatouille");
        assertThat(result.getPosterUrl()).isNull();
        assertThat(result.getTrailerUrl()).isNull();
        assertThat(result.getDuration()).isNull();
        assertThat(result.getGenre()).isNull();
        assertThat(result.getDirector()).isNull();
        assertThat(result.getActors()).isNull();
        assertThat(result.getDescription()).isNull();
        assertThat(result.getAgeRating()).isNull();
        assertThat(result.getCanhBao()).contains("TMDB_API_KEY", "poster", "trailer");
    }

    @Test
    void usesLookupMediaAndDoesNotGuessTrailerBySimilarMovieName() {
        when(crawl.tmdbSanSang()).thenReturn(true);
        when(crawl.caoDuLieuPhim("Deadpool 2")).thenReturn(DuLieuThoPhimDto.builder()
                .tomTat("Plot").posterUrl("https://image.tmdb.org/t/p/w500/real.jpg")
                .trailerUrl("https://youtu.be/abcdefghijk?si=shared").ngonNgu("Tiếng Anh").build());
        var result = service.taoThongTinPhim("Deadpool 2");
        assertThat(result.getTrailerUrl()).isEqualTo("https://www.youtube.com/watch?v=abcdefghijk");
        assertThat(result.getPosterUrl()).endsWith("/real.jpg");
        assertThat(result.getLanguage()).isEqualTo("Tiếng Anh");
        assertThat(service.chuanHoaTrailerUrl("https://www.youtube.com/results?search_query=Deadpool", "Deadpool")).isNull();
        verifyNoInteractions(client);
    }

    @Test
    void ignoresHallucinatedMediaFromAiAndReadsAgeRatingAndArrays() throws Exception {
        ReflectionTestUtils.setField(service, "geminiBat", true);
        when(client.coKhoaHopLe()).thenReturn(true);
        String json = mapper.writeValueAsString(Map.of("description", "AI plot", "ageRating", "T13", "genre", List.of("Animation", "Comedy"),
                "actors", List.of("Actor A", "Actor B"), "posterUrl", "https://image.tmdb.org/t/p/w500/invented.jpg", "trailerUrl", "https://youtu.be/abcdefghijk"));
        when(client.generateContent(anyMap())).thenReturn(mapper.writeValueAsString(Map.of("candidates", List.of(Map.of("content", Map.of("parts", List.of(Map.of("text", json))))))));
        var result = service.taoThongTinPhim("Ratatouille");
        assertThat(result.getAgeRating()).isEqualTo("T13");
        assertThat(result.getGenre()).isEqualTo("Animation, Comedy");
        assertThat(result.getActors()).isEqualTo("Actor A, Actor B");
        assertThat(result.getPosterUrl()).isNull();
        assertThat(result.getTrailerUrl()).isNull();
        assertThat(result.getCanhBao()).contains("AI soạn", "poster", "trailer");
    }

    @Test
    void validatesWholeYoutubeHostAndIdAndRejectsPlaceholderPosters() {
        for (String value : List.of("https://fakeyoutube.com/watch?v=abcdefghijk", "https://example.com/?v=abcdefghijk", "https://youtube.com/watch?v=abcdefghijkMORE", "https://youtube.com/results?search_query=trailer"))
            assertThat(MovieMediaUrl.trailer(value)).isNull();
        assertThat(MovieMediaUrl.trailer("https://www.youtube-nocookie.com/embed/abcdefghijk")).endsWith("v=abcdefghijk");
        assertThat(MovieMediaUrl.poster("https://picsum.photos/seed/cinema322/300/450")).isNull();
    }
}
