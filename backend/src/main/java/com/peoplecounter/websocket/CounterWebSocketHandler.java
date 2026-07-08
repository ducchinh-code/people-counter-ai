package com.peoplecounter.websocket;

import com.peoplecounter.core.module.counter.dto.CounterDataResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class CounterWebSocketHandler {

    private final SimpMessagingTemplate messagingTemplate;
    private final com.peoplecounter.core.module.counter.CounterService counterService;

    @Scheduled(fixedDelay = 2000)
    public void pushSnapshots() {

        List<CounterDataResponse> snapshots = counterService.getAllSnapshots();

        if (snapshots.isEmpty()) return;

        messagingTemplate.convertAndSend("/topic/snapshots", snapshots);

        snapshots.forEach(snapshot ->
                messagingTemplate.convertAndSend(
                        "/topic/camera/" + snapshot.getCameraId(),
                        snapshot
                )
        );

        log.debug("Pushed {} snapshots via WebSocket", snapshots.size());
    }
}