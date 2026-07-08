package com.peoplecounter.core.module.counter;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class StreamService {

    private final Map<Long, byte[]> frames = new ConcurrentHashMap<>();

    public void updateFrame(Long cameraId, byte[] frameBytes) {
        frames.put(cameraId, frameBytes);
    }

    public byte[] getLatestFrame(Long cameraId) {
        return frames.get(cameraId);
    }

    public boolean hasFrame(Long cameraId) {
        return frames.containsKey(cameraId);
    }
}