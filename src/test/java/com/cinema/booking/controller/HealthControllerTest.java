package com.cinema.booking.controller;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.data.mongodb.core.MongoTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class HealthControllerTest {
    private final ApplicationAvailability availability = mock(ApplicationAvailability.class);
    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final HealthController controller = new HealthController(availability, mongo);

    @Test
    void healthDoesNotQueryDatabaseAndWaitsForApplicationReadiness() {
        when(availability.getReadinessState()).thenReturn(ReadinessState.REFUSING_TRAFFIC);
        assertThat(controller.health().getStatusCode().value()).isEqualTo(503);
        when(availability.getReadinessState()).thenReturn(ReadinessState.ACCEPTING_TRAFFIC);
        assertThat(controller.health().getStatusCode().value()).isEqualTo(200);
        verifyNoInteractions(mongo);
    }

    @Test
    void databaseHealthPingsMongo() {
        when(mongo.executeCommand(new Document("ping", 1))).thenReturn(new Document("ok", 1));
        assertThat(controller.database().getStatusCode().value()).isEqualTo(200);
        verify(mongo).executeCommand(new Document("ping", 1));
    }

    @Test
    void databaseFailureDoesNotExposeConnectionDetails() {
        when(mongo.executeCommand(new Document("ping", 1)))
                .thenThrow(new IllegalStateException("private connection details"));
        var response = controller.database();
        assertThat(response.getStatusCode().value()).isEqualTo(503);
        assertThat(response.getBody()).containsEntry("status", "DOWN").hasSize(1);
    }
}
