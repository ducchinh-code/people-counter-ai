package com.peoplecounter.core.module.statistics;

import com.peoplecounter.core.module.camera.Camera;
import com.peoplecounter.core.module.camera.CameraService;
import com.peoplecounter.core.module.counter.CounterData;
import com.peoplecounter.core.module.counter.CounterDataRepository;
import com.peoplecounter.core.module.statistics.dto.StatisticsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final CounterDataRepository counterDataRepository;
    private final CameraService cameraService;

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ── Thống kê 1 camera theo ngày ─────────────────
    public StatisticsResponse getByCamera(Long cameraId, LocalDate date) {

        Camera camera = cameraService.findById(cameraId);

        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();

        List<CounterData> records =
                counterDataRepository.findByCameraIdAndRecordedAtBetweenAndPartialFalse(
                        cameraId, from, to
                );

        return buildResponse(camera, date, records);
    }

    // ── Thống kê tất cả camera theo ngày ────────────
    public List<StatisticsResponse> getAll(LocalDate date) {

        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();

        List<CounterData> records =
                counterDataRepository.findByRecordedAtBetweenAndPartialFalse(
                        from, to
                );

        // Group theo camera rồi build response cho từng camera
        return records.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        r -> r.getCamera().getId()
                ))
                .values().stream()
                .map(counterData -> {
                    Camera camera = counterData.getFirst().getCamera();
                    return buildResponse(camera, date, counterData);
                })
                .sorted(Comparator.comparing(StatisticsResponse::getCameraId))
                .toList();
    }

    // ── Thống kê 1 camera theo khoảng ngày ──────────
    public List<StatisticsResponse> getByCameraAndRange(
            Long cameraId,
            LocalDate from,
            LocalDate to
    ) {
        Camera camera = cameraService.findById(cameraId);

        // Tạo response cho từng ngày trong khoảng
        return from.datesUntil(to.plusDays(1))
                .map(date -> {
                    LocalDateTime start = date.atStartOfDay();
                    LocalDateTime end = date.plusDays(1).atStartOfDay();

                    List<CounterData> records =
                            counterDataRepository
                                    .findByCameraIdAndRecordedAtBetweenAndPartialFalse(
                                            cameraId, start, end
                                    );

                    return buildResponse(camera, date, records);
                })
                .toList();
    }

    // ── Helper — build StatisticsResponse ───────────
    private StatisticsResponse buildResponse(
            Camera camera,
            LocalDate date,
            List<CounterData> records
    ) {
        // Tính tổng
        int totalIn = records.stream()
                .mapToInt(CounterData::getInCount).sum();
        int totalOut = records.stream()
                .mapToInt(CounterData::getOutCount).sum();

        // Tìm peak hour
        CounterData peak = records.stream()
                .max(Comparator.comparingInt(CounterData::getTotal))
                .orElse(null);

        // Build hourly data list
        List<StatisticsResponse.HourlyData> hourlyData = records.stream()
                .sorted(Comparator.comparing(CounterData::getRecordedAt))
                .map(r -> StatisticsResponse.HourlyData.builder()
                        .hour(r.getHour())
                        .inCount(r.getInCount())
                        .outCount(r.getOutCount())
                        .total(r.getTotal())
                        .partial(r.isPartial())
                        .build()
                )
                .toList();

        return StatisticsResponse.builder()
                .cameraId(camera.getId())
                .cameraName(camera.getName())
                .date(date.format(DATE_FORMAT))
                .totalIn(totalIn)
                .totalOut(totalOut)
                .totalPeople(totalIn + totalOut)
                .peakHour(peak != null ? peak.getHour() : null)
                .peakTotal(peak != null ? peak.getTotal() : 0)
                .hourlyData(hourlyData)
                .build();
    }
}