package com.peoplecounter.core.module.camera;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.camera.dto.CameraBulkRequest;
import com.peoplecounter.core.module.camera.dto.CameraRequest;
import com.peoplecounter.core.module.camera.dto.CameraResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService cameraService;

    // GET /api/cameras
    @GetMapping
    public ResponseEntity<BaseResponse<List<CameraResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.ok(cameraService.getAll()));
    }

    // GET /api/cameras/enabled
    @GetMapping("/enabled")
    public ResponseEntity<BaseResponse<List<CameraResponse>>> getAllEnabled() {
        return ResponseEntity.ok(BaseResponse.ok(cameraService.getAllEnabled()));
    }

    // GET /api/cameras/{id}
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<CameraResponse>> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(BaseResponse.ok(cameraService.getById(id)));
    }

    // POST /api/cameras — tạo 1 camera
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<CameraResponse>> create(
            @Valid @RequestBody CameraRequest request
    ) {
        CameraResponse response = cameraService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(BaseResponse.ok("Camera created", response));
    }

    // POST /api/cameras/bulk — tạo nhiều camera cùng lúc
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<List<CameraResponse>>> createBulk(
            @Valid @RequestBody CameraBulkRequest request
    ) {
        List<CameraResponse> responses = cameraService.createBulk(request.getCameras());
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(BaseResponse.ok("Cameras created", responses));
    }


    // PUT /api/cameras/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<CameraResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CameraRequest request
    ) {
        return ResponseEntity.ok(
                BaseResponse.ok("Camera updated", cameraService.update(id, request))
        );
    }

    // PATCH /api/cameras/{id}/toggle
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<CameraResponse>> toggle(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                BaseResponse.ok("Camera toggled", cameraService.toggleEnabled(id))
        );
    }

    // DELETE /api/cameras/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> delete(
            @PathVariable Long id
    ) {
        cameraService.delete(id);
        return ResponseEntity.ok(BaseResponse.ok("Camera deleted", null));
    }
}