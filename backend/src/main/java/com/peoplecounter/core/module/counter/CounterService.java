package com.peoplecounter.core.module.counter;

import com.peoplecounter.core.module.camera.Camera;
import com.peoplecounter.core.module.camera.CameraService;
import com.peoplecounter.core.module.counter.dto.CounterDataRequest;
import com.peoplecounter.core.module.counter.dto.CounterDataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class CounterService {

    private final CounterDataRepository counterDataRepository;
    private final CameraService cameraService;

    private final Map<Long, CounterDataResponse> snapshots = new ConcurrentHashMap<>();

    @Transactional
    public CounterDataResponse saveHourlyStats(CounterDataRequest request) {

        Camera camera = cameraService.findById(request.getCameraId());

        CounterData counterData = CounterData.builder()
                .camera(camera)
                .hour(request.getHour())
                .inCount(request.getInCount())
                .outCount(request.getOutCount())
                .partial(request.isPartial())
                .build();

        CounterData saved = counterDataRepository.save(counterData);

        log.info("Saved hourly stats — camera: {} | hour: {} | IN: {} | OUT: {} | TOTAL: {}",
                camera.getName(),
                request.getHour(),
                request.getInCount(),
                request.getOutCount(),
                saved.getTotal()
        );

        return toResponse(saved);
    }

    public void updateSnapshot(Long cameraId, int currentIn, int currentOut) {

        Camera camera = cameraService.findById(cameraId);

        CounterDataResponse snapshot = CounterDataResponse.builder()
                .cameraId(cameraId)
                .cameraName(camera.getName())
                .inCount(currentIn)
                .outCount(currentOut)
                .total(currentIn + currentOut)
                .recordedAt(LocalDateTime.now())
                .build();

        snapshots.put(cameraId, snapshot);
    }

    public CounterDataResponse getSnapshot(Long cameraId) {
        return snapshots.get(cameraId);
    }

    public List<CounterDataResponse> getAllSnapshots() {
        return List.copyOf(snapshots.values());
    }

    private CounterDataResponse toResponse(CounterData data) {
        return CounterDataResponse.builder()
                .id(data.getId())
                .cameraId(data.getCamera().getId())
                .cameraName(data.getCamera().getName())
                .hour(data.getHour())
                .inCount(data.getInCount())
                .outCount(data.getOutCount())
                .total(data.getTotal())
                .partial(data.isPartial())
                .recordedAt(data.getRecordedAt())
                .build();
    }
}