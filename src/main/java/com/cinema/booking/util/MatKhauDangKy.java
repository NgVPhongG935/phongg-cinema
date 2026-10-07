package com.cinema.booking.util;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

public final class MatKhauDangKy {
    private MatKhauDangKy() {}

    // Match JavaScript whitespace, including non-breaking spaces and BOM.
    private static final Pattern KHOANG_TRANG = Pattern.compile("[\\t-\\r \\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000\\ufeff]");
    private static final Pattern CHU_HOA = Pattern.compile("[A-Z]");
    private static final Pattern CHU_THUONG = Pattern.compile("[a-z]");
    private static final Pattern CHU_SO = Pattern.compile("[0-9]");
    private static final Pattern KY_TU_DAC_BIET = Pattern.compile("[!-/:-@\\[-`{-~]");

    public static String layLoi(String matKhau) {
        if (matKhau == null || matKhau.length() < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
        // BCrypt supports at most 72 bytes; never silently truncate passwords.
        if (matKhau.getBytes(StandardCharsets.UTF_8).length > 72) return "Mật khẩu quá dài (tối đa 72 byte UTF-8).";
        if (KHOANG_TRANG.matcher(matKhau).find()) return "Mật khẩu không được chứa khoảng trắng.";
        if (!CHU_HOA.matcher(matKhau).find()) return "Mật khẩu phải có ít nhất một chữ hoa (A–Z).";
        if (!CHU_THUONG.matcher(matKhau).find()) return "Mật khẩu phải có ít nhất một chữ thường (a–z).";
        if (!CHU_SO.matcher(matKhau).find()) return "Mật khẩu phải có ít nhất một chữ số (0–9).";
        if (!KY_TU_DAC_BIET.matcher(matKhau).find()) return "Mật khẩu phải có ít nhất một ký tự đặc biệt (ví dụ: @, #, !).";
        return "";
    }
}
