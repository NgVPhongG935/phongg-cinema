package com.cinema.booking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class TmdbMovieServiceTest {
    @Test
    void franchiseQueryReturnsIndividualMovieChoicesInsteadOfRejectingPartialTitles() {
        setup("test-key");
        server.expect(request -> assertThat(request.getURI().getQuery()).contains("query=harry potter"))
                .andRespond(withSuccess("{\"results\":[{\"id\":671,\"title\":\"Harry Potter and the Philosopher's Stone\",\"original_title\":\"Harry Potter and the Philosopher's Stone\",\"release_date\":\"2001-11-16\",\"poster_path\":\"/poster.jpg\"},{\"id\":672,\"title\":\"Harry Potter and the Chamber of Secrets\",\"release_date\":\"2002-11-13\"}]}", MediaType.APPLICATION_JSON));
        var options = service.timLuaChonPhim("harry potter");
        assertThat(options).hasSize(2);
        assertThat(options.get(0).id()).isEqualTo(671);
        assertThat(options.get(0).year()).isEqualTo("2001");
        assertThat(options.get(0).posterUrl()).endsWith("/poster.jpg");
        server.verify();
    }

    @Test
    void selectedMovieIdRetrievesThatMovieWithoutSearchingAgain() {
        setup("test-key");
        server.expect(path("/movie/672?")).andRespond(withSuccess(VI, MediaType.APPLICATION_JSON));
        server.expect(path("/movie/672?")).andRespond(withSuccess(VI, MediaType.APPLICATION_JSON));
        assertThat(service.timPhimTheoId(672).getThoiLuongPhut()).isEqualTo(111);
        server.verify();
    }

    @Test
    void badApiKeyIsReportedAsAProviderErrorNotAsNoMoviesFound() {
        setup("invalid-key");
        server.expect(path("/search/movie")).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.timLuaChonPhim("harry potter"))
                .isInstanceOfSatisfying(org.springframework.web.server.ResponseStatusException.class, error -> {
                    assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(error.getReason()).contains("401", "TMDB_API_KEY");
                });
        server.verify();
    }
    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final TmdbMovieService service = new TmdbMovieService(new ObjectMapper(), builder.build());
    private static final String SEARCH = "{\"results\":[{\"id\":1,\"title\":\"Ratatouille\",\"original_title\":\"Ratatouille\"}]}";
    private static final String VI = "{\"title\":\"Ratatouille\",\"overview\":\"Plot\",\"runtime\":111,\"poster_path\":\"/real.jpg\",\"original_language\":\"en\",\"videos\":{\"results\":[]}}";

    private void setup(String key) {
        ReflectionTestUtils.setField(service, "tmdbBat", true);
        ReflectionTestUtils.setField(service, "khoaApi", key);
    }
    private org.springframework.test.web.client.RequestMatcher path(String value) {
        return request -> assertThat(request.getURI().toString()).contains(value);
    }
    @Test
    void retrievesEnglishTrailerEvenWhenVietnameseDescriptionExists() {
        setup("test-key");
        server.expect(path("/search/movie")).andRespond(withSuccess(SEARCH, MediaType.APPLICATION_JSON));
        server.expect(path("language=vi-VN")).andRespond(withSuccess(VI, MediaType.APPLICATION_JSON));
        server.expect(path("language=en-US")).andRespond(withSuccess("{\"overview\":\"English\",\"videos\":{\"results\":[{\"site\":\"YouTube\",\"type\":\"Clip\",\"key\":\"abcdefghij1\"},{\"site\":\"YouTube\",\"type\":\"Trailer\",\"key\":\"abcdefghij2\"},{\"site\":\"YouTube\",\"type\":\"Trailer\",\"official\":true,\"key\":\"abcdefghij3\"}]}}", MediaType.APPLICATION_JSON));
        var result = service.timPhim("Ratatouille");
        assertThat(result.getTrailerUrl()).endsWith("v=abcdefghij3");
        assertThat(result.getTomTat()).isEqualTo("Plot");
        assertThat(result.getPosterUrl()).endsWith("/real.jpg");
        assertThat(result.getThoiLuongPhut()).isEqualTo(111);
        assertThat(result.getNgonNgu()).isEqualTo("Tiếng Anh");
        assertThat(result.getGioiHanTuoi()).isNull();
        server.verify();
    }
    @Test
    void englishLookupFailurePreservesVietnamesePoster() {
        setup("test-key");
        server.expect(path("/search/movie")).andRespond(withSuccess(SEARCH, MediaType.APPLICATION_JSON));
        server.expect(path("language=vi-VN")).andRespond(withSuccess(VI, MediaType.APPLICATION_JSON));
        server.expect(path("language=en-US")).andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        var result = service.timPhim("Ratatouille");
        assertThat(result.getPosterUrl()).endsWith("/real.jpg");
        assertThat(result.getTomTat()).isEqualTo("Plot");
        server.verify();
    }
    @Test
    void doesNotUseUnrelatedFirstSearchResult() {
        setup("test-key");
        server.expect(path("language=vi-VN")).andRespond(withSuccess(SEARCH, MediaType.APPLICATION_JSON));
        server.expect(path("language=en-US")).andRespond(withSuccess(SEARCH, MediaType.APPLICATION_JSON));
        assertThat(service.timPhim("Different Movie").getSources()).isZero();
        server.verify();
    }
    @Test
    void supportsBearerTokenWithoutSendingItAsAnApiKey() {
        setup("eyJ.test-token");
        server.expect(request -> {
            assertThat(request.getHeaders().getFirst("Authorization")).isEqualTo("Bearer eyJ.test-token");
            assertThat(request.getURI().toString()).doesNotContain("api_key");
        }).andRespond(withSuccess("{\"results\":[]}", MediaType.APPLICATION_JSON));
        server.expect(path("language=en-US")).andRespond(withSuccess("{\"results\":[]}", MediaType.APPLICATION_JSON));
        assertThat(service.timPhim("Ratatouille").getSources()).isZero();
        server.verify();
    }
}
