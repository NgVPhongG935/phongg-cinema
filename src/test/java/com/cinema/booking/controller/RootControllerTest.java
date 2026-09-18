package com.cinema.booking.controller;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RootControllerTest {
    @Test
    void rootExplainsThatTheBackendIsRunning() {
        var body = new RootController().root();

        assertThat(body.get("service")).isEqualTo("PhongG Cinema API");
        assertThat(body.get("status")).isEqualTo("UP");
        assertThat(body.get("health")).isEqualTo("/api/v1/health");
    }
}
