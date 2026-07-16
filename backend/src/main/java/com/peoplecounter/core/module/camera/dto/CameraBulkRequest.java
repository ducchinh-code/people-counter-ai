package com.peoplecounter.core.module.camera.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;


@Getter
@Setter
public class CameraBulkRequest {

    @Valid
    @NotEmpty(message = "Danh sách camera không được rỗng")
    private List<CameraRequest> cameras;
}