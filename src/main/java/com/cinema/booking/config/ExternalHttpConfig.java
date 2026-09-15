package com.cinema.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration(proxyBeanMethods = false)
public class ExternalHttpConfig {
    @Bean
    HttpClient externalHttpClient() {
        return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL).build();
    }

    @Bean
    @Primary
    RestClient movieMetadataClient(HttpClient externalHttpClient,
            @Value("${app.http.metadata-timeout-ms:8000}") int timeoutMs) {
        return client(externalHttpClient, timeoutMs);
    }

    @Bean
    RestClient geminiRestClient(HttpClient externalHttpClient,
            @Value("${app.http.gemini-timeout-ms:45000}") int timeoutMs) {
        return client(externalHttpClient, timeoutMs);
    }

    private RestClient client(HttpClient httpClient, int timeoutMs) {
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(timeoutMs);
        return RestClient.builder().requestFactory(factory).build();
    }
}
