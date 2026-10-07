package com.cinema.booking.controller;

import com.cinema.booking.dto.LuaChonPhimAiDto;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.cinema.booking.service.AiService;
import com.cinema.booking.service.GeminiMovieService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MovieAiLookupControllerTest {
    @Test
    void returnsMovieChoicesAndPassesSelectedIdIntoMetadataLookup() throws Exception {
        GeminiMovieService movies = mock(GeminiMovieService.class);
        var mvc = MockMvcBuilders.standaloneSetup(new AiChatController(mock(AiService.class), movies)).build();
        when(movies.timLuaChonPhim("harry potter")).thenReturn(List.of(new LuaChonPhimAiDto(672,
                "Harry Potter and the Chamber of Secrets", "Harry Potter and the Chamber of Secrets", "2002", null)));
        when(movies.taoThongTinPhim("Harry Potter and the Chamber of Secrets", 672L))
                .thenReturn(ThongTinPhimAiDto.builder().title("Harry Potter and the Chamber of Secrets").duration(161).build());
        mvc.perform(get("/api/v1/ai/movie-options").param("title", "harry potter"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(672)).andExpect(jsonPath("$[0].year").value("2002"));
        mvc.perform(post("/api/v1/ai/generate-movie-info").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Harry Potter and the Chamber of Secrets\",\"tmdbId\":672}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.duration").value(161));
        verify(movies).taoThongTinPhim("Harry Potter and the Chamber of Secrets", 672L);
    }
}
