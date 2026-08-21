package com.cinema.booking.controller;

import com.cinema.booking.dto.AiChatRequestDto;
import com.cinema.booking.dto.NgauCanhChatAi;
import com.cinema.booking.dto.TaoThongTinPhimAiRequest;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.cinema.booking.service.AiService;
import com.cinema.booking.service.GeminiMovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/v1/ai", "/ai"})
public class AiChatController {
    private final AiService dichVuAi;
    private final GeminiMovieService dichVuPhimAi;

    @PostMapping(value = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> guiCauHoiToiAi(@RequestBody AiChatRequestDto noiDung) {
        String cauHoi = noiDung.getUserMessage();
        if (cauHoi == null || cauHoi.isBlank())
            cauHoi = noiDung.getMessage();
        NgauCanhChatAi ngauCanh = new NgauCanhChatAi();
        ngauCanh.setViDo(noiDung.getViDo());
        ngauCanh.setKinhDo(noiDung.getKinhDo());
        ngauCanh.setCheDo(noiDung.getCheDo());
        ngauCanh.setKhuVuc(noiDung.getKhuVuc());
        return ResponseEntity.ok(Map.of("answer", dichVuAi.tuVanKhachHang(cauHoi, ngauCanh)));
    }

    @RequestMapping(
            value = {"/generate-movie-info", "/tao-thong-tin-phim"},
            method = {RequestMethod.POST, RequestMethod.PUT, RequestMethod.GET},
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ThongTinPhimAiDto> taoThongTinPhimAi(
            @RequestBody(required = false) TaoThongTinPhimAiRequest yeuCau,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String title) {
        String tenPhim = "";
        if (yeuCau != null) {
            if (yeuCau.getTitle() != null && !yeuCau.getTitle().isBlank()) tenPhim = yeuCau.getTitle();
            else if (yeuCau.getTenPhim() != null && !yeuCau.getTenPhim().isBlank()) tenPhim = yeuCau.getTenPhim();
        }
        if (tenPhim.isBlank() && title != null && !title.isBlank()) tenPhim = title;
        if (tenPhim.isBlank() && keyword != null && !keyword.isBlank()) tenPhim = keyword;

        ThongTinPhimAiDto ketQua = dichVuPhimAi.taoThongTinPhim(tenPhim);
        return ResponseEntity.ok(ketQua);
    }
}
