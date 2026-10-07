package com.cinema.booking.service;

import com.cinema.booking.config.ExternalHttpConfig;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.web.client.RestClient;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.assertj.core.api.Assertions.assertThat;

/** Opt-in public-source integration test. Never reads/sends TMDB or Gemini credentials. */
@EnabledIfEnvironmentVariable(named = "MOVIE_LOOKUP_LIVE", matches = "true")
class LiveMovieLookupTest {
    @Test
    void readsTheThreeMoviesFromTheReportedBatchFailure() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(ExternalHttpConfig.class)) {
            RestClient http = context.getBean("movieMetadataClient", RestClient.class);
            ObjectMapper json = new ObjectMapper();
            MovieCrawlService crawl = new MovieCrawlService(json, new TmdbMovieService(json, http), http);
            GeminiMovieService movies = new GeminiMovieService(json, crawl, null);
            java.util.List<java.util.Map<String, Object>> results = new java.util.ArrayList<>();
            for (String title : java.util.List.of("Mission: Impossible - The Final Reckoning", "Snow White", "Mickey 17")) {
                var data = movies.taoThongTinPhim(title);
                assertThat(data.getDirector()).as("director of %s: %s", title, json.writeValueAsString(data)).isNotBlank();
                assertThat(data.getPosterUrl()).startsWith("https://upload.wikimedia.org/");
                assertThat(data.getDuration()).isPositive();
                var poster = http.get().uri(URI.create(data.getPosterUrl())).retrieve().toEntity(byte[].class);
                assertThat(poster.getStatusCode().is2xxSuccessful()).as("poster of %s", title).isTrue();
                assertThat(poster.getHeaders().getContentType().toString()).startsWith("image/");
                assertThat(poster.getBody()).hasSizeGreaterThan(1000);
                results.add(java.util.Map.of("title", title, "info", data));
                System.out.println("LIVE_BATCH_MOVIE_VERIFIED " + title + "; duration=" + data.getDuration() + "; director=" + data.getDirector());
            }
            Files.write(Path.of("target", "live-batch-movie-data.json"), json.writeValueAsBytes(results));
        }
    }
    @Test
    void harryPotterOffersRealFilmChoicesWithoutTmdbAndLoadsTheSelectedFilm() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(ExternalHttpConfig.class)) {
            RestClient http = context.getBean("movieMetadataClient", RestClient.class);
            ObjectMapper json = new ObjectMapper();
            MovieCrawlService crawl = new MovieCrawlService(json, new TmdbMovieService(json, http), http);
            var options = crawl.timLuaChonPhim("harry potter");
            assertThat(options.size()).isGreaterThanOrEqualTo(2);
            assertThat(options.get(0).source()).isEqualTo("wikipedia");
            assertThat(options.get(0).originalTitle()).contains("Philosopher");
            var movie = new GeminiMovieService(json, crawl, null).taoThongTinPhim(options.get(0).originalTitle());
            assertThat(movie.getDuration()).isEqualTo(152);
            assertThat(movie.getDirector()).isEqualTo("Chris Columbus");
            assertThat(movie.getGenre()).contains("Giả tưởng");
            assertThat(movie.getPosterUrl()).startsWith("https://upload.wikimedia.org/");
            var poster = http.get().uri(URI.create(movie.getPosterUrl())).retrieve().toEntity(byte[].class);
            assertThat(poster.getStatusCode().is2xxSuccessful()).isTrue();
            Files.write(Path.of("target", "live-harry-potter-options.json"), json.writeValueAsBytes(options));
            Files.write(Path.of("target", "live-harry-potter-result.json"), json.writeValueAsBytes(movie));
            System.out.println("LIVE_HARRY_POTTER_VERIFIED choices=" + options.size() + "; selected=" + options.get(0).originalTitle() + "; duration=152; poster=HTTP200");
        }
    }
    @Test
    void actualMovieDataAndPosterCanBeReadFromPublicSource() throws Exception {
        try (var context = new AnnotationConfigApplicationContext(ExternalHttpConfig.class)) {
            RestClient http = context.getBean("movieMetadataClient", RestClient.class);
            ObjectMapper json = new ObjectMapper();
            TmdbMovieService tmdb = new TmdbMovieService(json, http);
            MovieCrawlService crawl = new MovieCrawlService(json, tmdb, http);
            ((ch.qos.logback.classic.Logger) org.slf4j.LoggerFactory.getLogger(MovieCrawlService.class)).setLevel(ch.qos.logback.classic.Level.DEBUG);
            GeminiMovieService movies = new GeminiMovieService(json, crawl, null);
            ThongTinPhimAiDto data = movies.taoThongTinPhim("The Incredibles 2");
            assertThat(data.getDuration()).isEqualTo(118);
            assertThat(data.getDirector()).isEqualTo("Brad Bird");
            assertThat(data.getActors()).contains("Holly Hunter", "Craig T. Nelson");
            assertThat(data.getPosterUrl()).startsWith("https://upload.wikimedia.org/");
            assertThat(data.getDescription()).contains("Incredibles 2");
            assertThat(data.getTrailerUrl()).isEqualTo("https://www.youtube.com/watch?v=i5qOzqD9Rms");
            var poster = http.get().uri(URI.create(data.getPosterUrl())).retrieve().toEntity(byte[].class);
            assertThat(poster.getStatusCode().is2xxSuccessful()).isTrue();
            assertThat(poster.getHeaders().getContentType().toString()).startsWith("image/");
            assertThat(poster.getBody().length).isGreaterThan(1000);
            Files.write(Path.of("target", "live-movie-result.json"), json.writeValueAsBytes(data));
            System.out.println("LIVE_PUBLIC_MOVIE_VERIFIED: duration=118; director=Brad Bird; poster=HTTP200+image; trailer=official Pixar verified by YouTube");
        }
    }
}
