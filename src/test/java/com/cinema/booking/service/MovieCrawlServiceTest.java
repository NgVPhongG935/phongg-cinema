package com.cinema.booking.service;

import com.cinema.booking.dto.DuLieuThoPhimDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class MovieCrawlServiceTest {
    @Test
    void returnsTmdbDescriptionWithoutWaitingForFallbackServices() {
        TmdbMovieService tmdb = mock(TmdbMovieService.class);
        RestClient http = mock(RestClient.class);
        when(tmdb.timPhim("Example")).thenReturn(DuLieuThoPhimDto.builder()
                .sources(1).tomTat("A description").posterUrl("https://example.com/poster.jpg").build());
        MovieCrawlService service = new MovieCrawlService(new ObjectMapper(), tmdb, http);
        ReflectionTestUtils.setField(service, "searxngUrl", "http://127.0.0.1:8888");

        var result = service.caoDuLieuPhim(" Example ");

        assertThat(result.getTomTat()).isEqualTo("A description");
        assertThat(result.getPosterUrl()).isEqualTo("https://example.com/poster.jpg");
        verifyNoInteractions(http);
    }

    @Test
    void doesNotRepeatWikipediaSearchOrCallDisabledSearxng() {
        TmdbMovieService tmdb = mock(TmdbMovieService.class);
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        for (String language : new String[]{"vi", "en"}) {
            for (String suffix : new String[]{language.equals("vi") ? "%20phim" : "%20film", ""}) {
                server.expect(requestTo("https://" + language
                                + ".wikipedia.org/w/api.php?action=query&list=search&search=Example"
                                + suffix + "&format=json&srlimit=5"))
                        .andRespond(withSuccess("{\"query\":{\"search\":[]}}", MediaType.APPLICATION_JSON));
            }
        }
        MovieCrawlService service = new MovieCrawlService(new ObjectMapper(), tmdb, builder.build());
        ReflectionTestUtils.setField(service, "searxngUrl", "");

        assertThat(service.caoDuLieuPhim("Example").getSources()).isZero();
        server.verify();
    }
}
