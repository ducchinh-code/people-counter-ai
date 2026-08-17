package com.peoplecounter.core.module.counter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class StreamService {

    private final Map<Long, byte[]> frames = new ConcurrentHashMap<>();

    private final Map<Long, AtomicInteger> viewerCounts = new ConcurrentHashMap<>();
    private static final int MAX_VIEWERS_PER_CAMERA = 50;

    public void updateFrame(Long cameraId, byte[] frameBytes) {
        frames.put(cameraId, frameBytes);
    }

    public byte[] getLatestFrame(Long cameraId) {
        return frames.get(cameraId);
    }

    public boolean hasFrame(Long cameraId) {
        return frames.containsKey(cameraId);
    }

    public boolean tryAcquireViewer(Long cameraId) {
        AtomicInteger count = viewerCounts.computeIfAbsent(cameraId, id -> new AtomicInteger(0));
        return acquireIfRoom(count);
    }

    private boolean acquireIfRoom(AtomicInteger count) {
        while (true) {
            int current = count.get();
            if (current >= MAX_VIEWERS_PER_CAMERA) {
                return false;
            }
            if (count.compareAndSet(current, current + 1)) {
                return true;
            }
        }
    }

    public void releaseViewer(Long cameraId) {
        AtomicInteger count = viewerCounts.get(cameraId);
        if (count != null) {
            count.updateAndGet(current -> Math.max(0, current - 1));
        }
    }
}