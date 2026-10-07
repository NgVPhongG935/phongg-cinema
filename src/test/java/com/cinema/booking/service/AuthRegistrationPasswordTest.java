package com.cinema.booking.service;

import com.cinema.booking.config.JwtUtil;
import com.cinema.booking.dto.DangKyRequest;
import com.cinema.booking.repository.UserRepository;
import com.cinema.booking.util.MatKhauDangKy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class AuthRegistrationPasswordTest {
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"Ab1!abc", "abcdefgh1!", "ABCDEFGH1!", "Abcdefgh!", "Abcdefgh1", "Abcdef1! ", "Abcdef1!\n", "Abcdef1!\u00a0", "Abcdef1!\ufeff"})
    void rejectsInvalidPasswordsForBothRequestFieldsBeforeSaving(String password) {
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AuthServiceImpl service = new AuthServiceImpl(users, encoder, mock(JwtUtil.class), mock(GoogleTokenXacThuc.class));
        for (boolean alias : new boolean[]{false, true}) {
            DangKyRequest request = DangKyRequest.builder().email("test@example.com").hoTen("Test User")
                    .matKhau(alias ? null : password).password(alias ? password : null).build();
            assertThatThrownBy(() -> service.dangKy(request))
                    .isInstanceOfSatisfying(ResponseStatusException.class,
                            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        }
        verifyNoInteractions(users, encoder);
    }

    @Test
    void acceptsValidPasswordsAndRespectsBcryptByteLimit() {
        assertThat(MatKhauDangKy.layLoi("Abcdef1!")).isEmpty();
        assertThat(MatKhauDangKy.layLoi("Abc1!" + "x".repeat(67))).isEmpty();
        assertThat(MatKhauDangKy.layLoi("Abc1!" + "x".repeat(68))).contains("72 byte");
        assertThat(MatKhauDangKy.layLoi("Abc1!" + "é".repeat(34))).contains("72 byte");
        for (char special : "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~".toCharArray()) {
            assertThat(MatKhauDangKy.layLoi("Abcdef1" + special)).isEmpty();
        }
    }
}
