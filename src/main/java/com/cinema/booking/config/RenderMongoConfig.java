package com.cinema.booking.config;

import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.concurrent.TimeUnit;

@Configuration(proxyBeanMethods = false)
@Profile("render")
public class RenderMongoConfig {
    @Bean
    MongoClientSettingsBuilderCustomizer renderMongoSettings() {
        return builder -> builder
                .applyToConnectionPoolSettings(pool -> pool.maxSize(10).minSize(0)
                        .maxWaitTime(5, TimeUnit.SECONDS)
                        .maxConnectionIdleTime(30, TimeUnit.SECONDS))
                .applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS))
                .applyToSocketSettings(socket -> socket.connectTimeout(5, TimeUnit.SECONDS)
                        .readTimeout(15, TimeUnit.SECONDS));
    }
}
