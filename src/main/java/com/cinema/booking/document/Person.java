package com.cinema.booking.document;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "persons")
public class Person {
    @Id
    private String id;

    @JsonAlias({"ten", "tenNgheSi", "hoTen"})
    private String name;

    @JsonAlias({"ngaySinh"})
    private String birthDate;

    /** Vai trò: ACTOR, DIRECTOR, BOTH */
    @JsonAlias({"vaiTro", "role"})
    private String roleType;

    @JsonAlias({"anhDaiDien", "avatar"})
    private String avatarUrl;

    @JsonAlias({"moTa", "tieuSu"})
    private String bio;
}
