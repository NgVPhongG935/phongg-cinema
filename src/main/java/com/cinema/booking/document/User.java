package com.cinema.booking.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id private String id;

    @Indexed(unique = true)
    private String email;

    private String matKhau;
    private String hoTen;
    /** Ảnh đại diện (ví dụ từ Google) */
    private String anhDaiDien;

    @Indexed(unique = true, sparse = true)
    private String soDienThoai;

    private UserRole vaiTro;
    /** true = tài khoản bị khóa, không đăng nhập được */
    private Boolean biKhoa;
    /** Mã rạp phụ trách (nhân viên STAFF) */
    private String maRapPhuTrach;
}
