package com.cinema.booking.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class MaVeQrUtil {
    private static final Pattern UUID =
            Pattern.compile("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}");
    private static final Pattern MONGO_ID = Pattern.compile("\\b[0-9a-fA-F]{24}\\b");

    private MaVeQrUtil() {}

    public static String taoMaQr(String maVe) {
        return "PHONGG:" + maVe;
    }

    public static String chuanHoaMaQuet(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        if (s.isEmpty()) return "";
        if (s.startsWith("PHONGG:")) return s.substring(7).trim();
        if (s.regionMatches(true, 0, "PHONGG-", 0, 7)) {
            s = s.substring(7).replaceFirst("^VE[-:]?", "");
        }
        Matcher url = Pattern.compile("ticket[s]?/([a-fA-F0-9-]+)", Pattern.CASE_INSENSITIVE).matcher(s);
        if (url.find()) return url.group(1);
        Matcher uuid = UUID.matcher(s);
        if (uuid.find()) return uuid.group();
        Matcher mongo = MONGO_ID.matcher(s);
        if (mongo.find()) return mongo.group();
        return s;
    }
}
