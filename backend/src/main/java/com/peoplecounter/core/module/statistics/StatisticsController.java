package com.peoplecounter.core.module.statistics;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.statistics.dto.StatisticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    // GET /api/stats
    @GetMapping
    public ResponseEntity<BaseResponse<List<StatisticsResponse>>> getAll(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(
                BaseResponse.ok(statisticsService.getAll(date))
        );
    }

    // GET /api/stats/{cameraId}
    @GetMapping("/{cameraId}")
    public ResponseEntity<BaseResponse<StatisticsResponse>> getByCamera(
            @PathVariable Long cameraId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        if (date == null) date = LocalDate.now();
        return ResponseEntity.ok(
                BaseResponse.ok(statisticsService.getByCamera(cameraId, date))
        );
    }

    // GET /api/stats/{cameraId}/range
    // Thống kê 1 camera theo khoảng ngày
    @GetMapping("/{cameraId}/range")
    public ResponseEntity<BaseResponse<List<StatisticsResponse>>> getByCameraAndRange(
            @PathVariable Long cameraId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(
                BaseResponse.ok(
                        statisticsService.getByCameraAndRange(cameraId, from, to)
                )
        );
    }
}