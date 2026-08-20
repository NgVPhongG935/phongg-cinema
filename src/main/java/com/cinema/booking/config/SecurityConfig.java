package com.cinema.booking.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final BoLocJwt boLocJwt;

    @Bean
    PasswordEncoder boMaHoaMatKhau() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource nguonCors() {
        CorsConfiguration cauHinh = new CorsConfiguration();
        // Vite web + Expo Metro (8081-8083) + LAN dev
        cauHinh.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://192.168.*.*:*",
                "https://*.ngrok-free.dev",
                "https://*.ngrok-free.app",
                "http://*.ngrok-free.dev",
                "http://*.ngrok-free.app",
                "https://*.ngrok.io",
                "http://*.ngrok.io",
                "https://*.ngrok.app",
                "http://*.ngrok.app"
        ));
        cauHinh.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        cauHinh.setAllowedHeaders(List.of("*"));
        cauHinh.setExposedHeaders(List.of("*"));
        cauHinh.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource nguon = new UrlBasedCorsConfigurationSource();
        nguon.registerCorsConfiguration("/**", cauHinh);
        return nguon;
    }

    @Bean
    SecurityFilterChain boLocBaoMat(HttpSecurity baoMat) throws Exception {
        return baoMat
                .cors(cauHinh -> cauHinh.configurationSource(nguonCors()))
                .csrf(cauHinh -> cauHinh.disable())
                .addFilterBefore(boLocJwt, UsernamePasswordAuthenticationFilter.class)
                .authorizeHttpRequests(cauHinh -> cauHinh.anyRequest().permitAll())
                .build();
    }
}
