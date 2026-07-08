package com.peoplecounter.core.module.counter;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.counter.dto.CounterDataRequest;
import com.peoplecounter.core.module.counter.dto.CounterDataResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/counter")
@RequiredArgsConstructor
public class CounterController {

    private final CounterService counterService;

    @Value("${app.api-key}")
    private String apiKey;

    // POST /api/counter/hourly — AI service push hourly stats
    @PostMapping("/hourly")
    public ResponseEntity<BaseResponse<CounterDataResponse>> receiveHourlyStats(
            @RequestHeader("X-Api-Key") String requestApiKey,
            @Valid @RequestBody CounterDataRequest request
    ) {
        if (!apiKey.equals(requestApiKey)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(BaseResponse.error("Invalid API key"));
        }

        CounterDataResponse response = counterService.saveHourlyStats(request);
        return ResponseEntity.ok(BaseResponse.ok("Stats saved", response));
    }

    // PUT /api/counter/snapshot — AI service push realtime snapshot
    @PutMapping("/snapshot")
    public ResponseEntity<BaseResponse<Void>> receiveSnapshot(
            @RequestHeader("X-Api-Key") String requestApiKey,
            @RequestParam Long cameraId,
            @RequestParam int currentIn,
            @RequestParam int currentOut
    ) {
        if (!apiKey.equals(requestApiKey)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(BaseResponse.error("Invalid API key"));
        }

        counterService.updateSnapshot(cameraId, currentIn, currentOut);
        return ResponseEntity.ok(BaseResponse.ok("Snapshot updated", null));
    }

    // GET /api/counter/snapshot — Frontend lấy tất cả snapshot
    @GetMapping("/snapshot")
    public ResponseEntity<BaseResponse<List<CounterDataResponse>>> getAllSnapshots() {
        return ResponseEntity.ok(BaseResponse.ok(counterService.getAllSnapshots()));
    }

    // GET /api/counter/snapshot/{cameraId} — Frontend lấy snapshot 1 camera
    @GetMapping("/snapshot/{cameraId}")
    public ResponseEntity<BaseResponse<CounterDataResponse>> getSnapshot(
            @PathVariable Long cameraId
    ) {
        CounterDataResponse snapshot = counterService.getSnapshot(cameraId);
        if (snapshot == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(BaseResponse.error("No snapshot for camera: " + cameraId));
        }
        return ResponseEntity.ok(BaseResponse.ok(snapshot));
    }
}