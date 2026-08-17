package com.peoplecounter.core.module.counter;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
public class StreamController {

    private final StreamService streamService;

    @Value("${app.api-key}")
    private String apiKey;

    private static final String BOUNDARY = "frame";
    private static final byte[] BOUNDARY_BYTES =
            ("--" + BOUNDARY + "\r\nContent-Type: image/jpeg\r\n\r\n").getBytes();
    private static final byte[] NEWLINE_BYTES = "\r\n".getBytes();

    private static final long MAX_STREAM_DURATION_MS = 5 * 60 * 1000;

    // POST /api/cameras/{id}/frame
    @PostMapping("/{id}/frame")
    public ResponseEntity<Void> receiveFrame(
            @PathVariable Long id,
            @RequestHeader("X-Api-Key") String requestApiKey,
            @RequestBody byte[] frameBytes
    ) {
        if (!apiKey.equals(requestApiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        streamService.updateFrame(id, frameBytes);
        return ResponseEntity.ok().build();
    }

    // GET /api/cameras/{id}/stream
    @GetMapping("/{id}/stream")
    public ResponseEntity<StreamingResponseBody> streamVideo(
            @PathVariable Long id
    ) {
        if (!streamService.hasFrame(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        if (!streamService.tryAcquireViewer(id)) {
            log.warn("Camera {} đã đạt giới hạn số client xem đồng thời", id);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }

        StreamingResponseBody body = outputStream -> {
            long startedAt = System.currentTimeMillis();
            try {
                while (true) {
                    if (System.currentTimeMillis() - startedAt > MAX_STREAM_DURATION_MS) {
                        log.debug(
                                "Camera {}: chủ động đóng kết nối stream sau {} phút để giải phóng viewer slot",
                                id, MAX_STREAM_DURATION_MS / 60_000
                        );
                        break;
                    }

                    byte[] frame = streamService.getLatestFrame(id);

                    if (frame != null) {
                        try {
                            outputStream.write(BOUNDARY_BYTES);
                            outputStream.write(frame);
                            outputStream.write(NEWLINE_BYTES);
                            outputStream.flush();
                        } catch (IOException e) {
                            log.debug("Stream client disconnected: camera {}", id);
                            break;
                        }
                    }

                    try {
                        Thread.sleep(66);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            } finally {
                streamService.releaseViewer(id);
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "multipart/x-mixed-replace;boundary=" + BOUNDARY
                ))
                .body(body);
    }
}