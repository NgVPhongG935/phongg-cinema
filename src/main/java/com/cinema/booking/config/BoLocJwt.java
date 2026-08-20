package com.cinema.booking.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Base64;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BoLocJwt extends OncePerRequestFilter {
    private final ObjectMapper boJson;

    @Override
    protected void doFilterInternal(HttpServletRequest yeuCau, HttpServletResponse phanHoi, FilterChain chuoi) throws ServletException, IOException {
        String header = yeuCau.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String[] phan = header.substring(7).split("\\.");
                if (phan.length >= 2) {
                    JsonNode payload = boJson.readTree(Base64.getUrlDecoder().decode(phan[1]));
                    String email = payload.has("sub") ? payload.get("sub").asText() : payload.path("email").asText();
                    String vaiTro = payload.path("role").asText("CUSTOMER");
                    var quyen = List.of(new SimpleGrantedAuthority("ROLE_" + vaiTro));
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(email, null, quyen));
                }
            } catch (Exception ignored) { }
        }
        chuoi.doFilter(yeuCau, phanHoi);
    }
}
