package com.cinema.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonAiResponseDto {
    private String name;
    private String birthDate;
    private String roleType; // ACTOR, DIRECTOR, BOTH
    private String avatarUrl;
    private String bio;
}
