package com.cinema.booking.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_REGIONS = "regions";
    public static final String CACHE_CINEMAS = "cinemas";
    public static final String CACHE_PAYMENT_METHODS = "paymentMethods";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(CACHE_REGIONS, CACHE_CINEMAS, CACHE_PAYMENT_METHODS);
    }
}
