package com.peoplecounter.core.module.camera.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CameraRequest {

    @NotBlank(message = "Camera name is required")
    private String name;

    @NotBlank(message = "Camera source is required")
    private String source;

    @NotNull(message = "Region is required")
    private List<List<Integer>> region;

    private String tracker = "botsort.yaml";

    private Boolean enabled = true;

    private Integer videoWidth;

    private Integer videoHeight;
}