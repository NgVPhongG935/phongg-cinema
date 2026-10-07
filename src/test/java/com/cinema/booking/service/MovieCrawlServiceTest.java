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
    void englishInfoboxFillsMissingFieldsEvenWhenVietnamesePageHasPoster() throws Exception {
        var tmdb = mock(TmdbMovieService.class);
        var json = new ObjectMapper();
        var builder = RestClient.builder();
        var server = MockRestServiceServer.bindTo(builder).build();
        for (String lang : new String[]{"vi", "en"}) {
            server.expect(request -> assertThat(request.getURI().getHost()).isEqualTo(lang + ".wikipedia.org"))
                    .andRespond(withSuccess("{\"query\":{\"search\":[{\"title\":\"Mickey 17\"}]}}", MediaType.APPLICATION_JSON));
            String wiki = lang.equals("en") ? "{{Infobox film\n| director = [[Bong Joon Ho]]\n| runtime = 137 minutes\n| language = English\n}}" : "";
            String page = json.writeValueAsString(java.util.Map.of("query", java.util.Map.of("pages", java.util.Map.of("1", java.util.Map.of(
                    "extract", "Mickey 17 is a science fiction comedy film.",
                    "terms", java.util.Map.of("description", java.util.List.of("2025 film")),
                    "original", java.util.Map.of("source", "https://upload.wikimedia.org/wikipedia/en/poster.png"),
                    "revisions", java.util.List.of(java.util.Map.of("slots", java.util.Map.of("main", java.util.Map.of("*", wiki)))))))));
            server.expect(request -> assertThat(request.getURI().getQuery()).contains("titles=Mickey 17"))
                    .andRespond(withSuccess(page, MediaType.APPLICATION_JSON));
        }
        var result = new MovieCrawlService(json, tmdb, builder.build()).caoDuLieuPhim("Mickey 17");
        assertThat(result.getDaoDien()).isEqualTo("Bong Joon Ho");
        assertThat(result.getThoiLuongPhut()).isEqualTo(137);
        assertThat(result.getPosterUrl()).endsWith("poster.png");
        server.verify();
    }
    @Test
    void tmdbFailureStillReturnsIndividualWikipediaFilmsForFranchiseSearch() {
        TmdbMovieService tmdb = mock(TmdbMovieService.class);
        when(tmdb.timLuaChonPhim("harry potter")).thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, "Connection failed"));
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("srsearch=harry potter film"))
                .andRespond(withSuccess("{\"query\":{\"search\":[{\"title\":\"Harry Potter (film series)\"},{\"title\":\"Harry Potter and the Philosopher's Stone (film)\"}]}}", MediaType.APPLICATION_JSON));
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("pageterms", "pageimages"))
                .andRespond(withSuccess("{\"query\":{\"pages\":{\"1\":{\"pageid\":1,\"title\":\"Harry Potter (film series)\",\"terms\":{\"description\":[\"British film series\"]}},\"2\":{\"pageid\":2,\"title\":\"Harry Potter and the Philosopher's Stone (film)\",\"terms\":{\"description\":[\"2001 fantasy film\"]}}}}}", MediaType.APPLICATION_JSON));
        var result = new MovieCrawlService(new ObjectMapper(), tmdb, builder.build()).timLuaChonPhim("harry potter");
        assertThat(result).hasSize(1);
        assertThat(result.get(0).source()).isEqualTo("wikipedia");
        assertThat(result.get(0).originalTitle()).isEqualTo("Harry Potter and the Philosopher's Stone");
        assertThat(result.get(0).year()).isEqualTo("2001");
        server.verify();
    }
    @Test
    void alternateMovieNameUsesCorrectWikipediaParameterAndIgnoresUnrelatedStudioVideos() throws Exception {
        TmdbMovieService tmdb = mock(TmdbMovieService.class);
        when(tmdb.timPhim("The Incredibles 2")).thenReturn(DuLieuThoPhimDto.builder().sources(0).build());
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        for (int i = 0; i < 2; i++) server.expect(request -> {
            assertThat(request.getURI().getHost()).isEqualTo("vi.wikipedia.org");
            assertThat(request.getURI().getQuery()).contains("srsearch=");
        }).andRespond(withSuccess("{\"query\":{\"search\":[]}}", MediaType.APPLICATION_JSON));
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("srsearch=The Incredibles 2 film"))
                .andRespond(withSuccess("{\"query\":{\"search\":[{\"title\":\"Incredibles 2 (soundtrack)\"},{\"title\":\"Incredibles 2\"}]}}", MediaType.APPLICATION_JSON));
        ObjectMapper json = new ObjectMapper();
        String wiki = "{{Infobox film\n| director = [[Brad Bird]]\n| starring = {{Plainlist|\n* [[Holly Hunter]]\n* [[Craig T. Nelson]]\n}}\n| production_companies = [[Pixar Animation Studios]]\n| runtime = 118 minutes<ref name=\"runtime\"/>\n| language = English\n}}";
        String page = json.writeValueAsString(java.util.Map.of("query", java.util.Map.of("pages", java.util.Map.of("1", java.util.Map.of(
                "extract", "Incredibles 2 is a 2018 American animated superhero film.", "terms", java.util.Map.of("description", java.util.List.of("2018 animated film")),
                "original", java.util.Map.of("source", "https://upload.wikimedia.org/wikipedia/en/1/1f/Incredibles_2.jpg"),
                "revisions", java.util.List.of(java.util.Map.of("slots", java.util.Map.of("main", java.util.Map.of("*", wiki)))))))));
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("titles=Incredibles 2", "revisions", "pilicense=any"))
                .andRespond(withSuccess(page, MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://www.pixar.com/incredibles-2"))
                .andRespond(withSuccess("<iframe src=\"https://www.youtube.com/embed/ETVi5_cnnaE\"></iframe><iframe src=\"https://www.youtube.com/embed/i5qOzqD9Rms\"></iframe>", MediaType.TEXT_HTML));
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("ETVi5_cnnaE"))
                .andRespond(withSuccess("{\"title\":\"Elio Official Trailer\",\"author_name\":\"Pixar\"}", MediaType.APPLICATION_JSON));
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("i5qOzqD9Rms"))
                .andRespond(withSuccess("{\"title\":\"Incredibles 2 Official Trailer\",\"author_name\":\"Pixar\"}", MediaType.APPLICATION_JSON));
        MovieCrawlService service = new MovieCrawlService(json, tmdb, builder.build());
        ReflectionTestUtils.setField(service, "searxngUrl", "");
        var result = service.caoDuLieuPhim("The Incredibles 2");
        assertThat(result.getThoiLuongPhut()).isEqualTo(118);
        assertThat(result.getDaoDien()).isEqualTo("Brad Bird");
        assertThat(result.getDienVien()).isEqualTo("Holly Hunter, Craig T. Nelson");
        assertThat(result.getTrailerUrl()).isEqualTo("https://www.youtube.com/watch?v=i5qOzqD9Rms");
        server.verify();
    }
    @Test
    void retrievesActualFilmPosterFromWikipediaWithoutTmdbKey() {
        TmdbMovieService tmdb = mock(TmdbMovieService.class);
        when(tmdb.timPhim("The Dark Knight")).thenReturn(DuLieuThoPhimDto.builder().sources(0).build());
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        for (int i = 0; i < 2; i++) server.expect(request -> assertThat(request.getURI().getHost()).isEqualTo("vi.wikipedia.org"))
                .andRespond(withSuccess("{\"query\":{\"search\":[]}}", MediaType.APPLICATION_JSON));
        server.expect(request -> assertThat(request.getURI().getHost()).isEqualTo("en.wikipedia.org"))
                .andRespond(withSuccess("{\"query\":{\"search\":[{\"title\":\"The Dark Knight\"}]}}", MediaType.APPLICATION_JSON));
        server.expect(request -> {
            assertThat(request.getURI().getQuery()).contains("prop=extracts|pageimages|pageterms", "pilicense=any");
        }).andRespond(withSuccess("{\"query\":{\"pages\":{\"1\":{\"extract\":\"The Dark Knight is a superhero film.\",\"terms\":{\"description\":[\"2008 superhero film\"]},\"original\":{\"source\":\"https://upload.wikimedia.org/wikipedia/en/8/8a/Dark_Knight.jpg\"}}}}}", MediaType.APPLICATION_JSON));
        MovieCrawlService service = new MovieCrawlService(new ObjectMapper(), tmdb, builder.build());
        ReflectionTestUtils.setField(service, "searxngUrl", "");
        var result = service.caoDuLieuPhim("The Dark Knight");
        assertThat(result.getPosterUrl()).isEqualTo("https://upload.wikimedia.org/wikipedia/en/8/8a/Dark_Knight.jpg");
        assertThat(result.getTomTat()).contains("superhero film");
        server.verify();
    }
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
                                + ".wikipedia.org/w/api.php?action=query&list=search&srsearch=Example"
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
