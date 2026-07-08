package com.peoplecounter.core.module.counter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CounterDataResponse {

    private Long id;
    private Long cameraId;
    private String cameraName;
    private String hour;
    private int inCount;
    private int outCount;
    private int total;
    private boolean partial;
    private LocalDateTime recordedAt;
}