package com.cinema.booking.config;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.ResourceAccessException;

import java.net.InetSocketAddress;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

class ExternalHttpConfigTest {
    @Test
    void slowUpstreamCannotBlockMetadataRequestIndefinitely() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/slow", exchange -> {
            try {
                Thread.sleep(2000);
                exchange.sendResponseHeaders(200, -1);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
            } finally {
                exchange.close();
            }
        });
        server.start();
        try {
            ExternalHttpConfig config = new ExternalHttpConfig();
            var client = config.movieMetadataClient(config.externalHttpClient(), 200);
            assertTimeoutPreemptively(Duration.ofSeconds(3), () ->
                    assertThatThrownBy(() -> client.get()
                            .uri("http://127.0.0.1:" + server.getAddress().getPort() + "/slow")
                            .retrieve().toBodilessEntity()).isInstanceOf(ResourceAccessException.class));
        } finally {
            server.stop(0);
        }
    }
}
