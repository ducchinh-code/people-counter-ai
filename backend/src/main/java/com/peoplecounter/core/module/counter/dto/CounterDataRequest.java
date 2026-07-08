package com.peoplecounter.core.module.counter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CounterDataRequest {

    @NotNull(message = "Camera ID is required")
    private Long cameraId;

    @NotBlank(message = "Hour is required")
    private String hour;

    @PositiveOrZero(message = "In count must be >= 0")
    private int inCount;

    @PositiveOrZero(message = "Out count must be >= 0")
    private int outCount;

    private boolean partial = false;
}