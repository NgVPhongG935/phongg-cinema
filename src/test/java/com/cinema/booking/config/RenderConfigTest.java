package com.cinema.booking.config;

import com.cinema.booking.service.GeminiApiClient;
import com.cinema.booking.service.MovieCrawlService;
import com.cinema.booking.service.TmdbMovieService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.MongoClientSettings;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mock.env.MockEnvironment;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

class RenderConfigTest {
    @Test
    void acceptsEitherDatabaseVariableAndPrefersSpringVariable() throws IOException {
        MockEnvironment env = new MockEnvironment();
        env.getPropertySources().addLast(new YamlPropertySourceLoader()
                .load("render", new ClassPathResource("application-render.yml")).get(0));
        env.setProperty("SPRING_DATA_MONGODB_URI", "mongodb://127.0.0.1/primary");
        assertThat(env.getProperty("spring.data.mongodb.uri")).isEqualTo("mongodb://127.0.0.1/primary");
        env.setProperty("MONGODB_URI", "mongodb://127.0.0.1/alternate");
        assertThat(env.getProperty("spring.data.mongodb.uri")).isEqualTo("mongodb://127.0.0.1/primary");
        MockEnvironment alternate = new MockEnvironment()
                .withProperty("MONGODB_URI", "mongodb://127.0.0.1/alternate");
        alternate.getPropertySources().addLast(env.getPropertySources().get("render"));
        assertThat(alternate.getProperty("spring.data.mongodb.uri")).isEqualTo("mongodb://127.0.0.1/alternate");
        assertThat(env.getProperty("spring.jmx.enabled")).isEqualTo("false");
    }

    @Test
    void mongoPoolAndWaitsAreBounded() {
        var builder = MongoClientSettings.builder();
        new RenderMongoConfig().renderMongoSettings().customize(builder);
        var settings = builder.build();
        assertThat(settings.getConnectionPoolSettings().getMaxSize()).isEqualTo(10);
        assertThat(settings.getClusterSettings().getServerSelectionTimeout(TimeUnit.SECONDS)).isEqualTo(5);
        assertThat(settings.getSocketSettings().getReadTimeout(TimeUnit.SECONDS)).isEqualTo(15);
    }

    @Test
    void springCanWireBothHttpClientsAndMovieServices() {
        new ApplicationContextRunner()
                .withUserConfiguration(ExternalHttpConfig.class)
                .withBean(ObjectMapper.class)
                .withBean(TmdbMovieService.class)
                .withBean(MovieCrawlService.class)
                .withBean(GeminiApiClient.class)
                .run(context -> {
                    assertThat(context).hasNotFailed();
                    assertThat(context).hasSingleBean(MovieCrawlService.class);
                    assertThat(context.getBean(GeminiApiClient.class).coKhoaHopLe()).isFalse();
                });
    }
}
