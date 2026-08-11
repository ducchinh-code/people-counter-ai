package com.peoplecounter.core.module.camera;

import com.peoplecounter.base.web.BaseResponse;
import com.peoplecounter.core.module.audit.AuditAction;
import com.peoplecounter.core.module.audit.AuditLogService;
import com.peoplecounter.core.module.camera.dto.CameraBulkRequest;
import com.peoplecounter.core.module.camera.dto.CameraRequest;
import com.peoplecounter.core.module.camera.dto.CameraResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import java.util.List;

@RestController
@RequestMapping("/api/cameras")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService cameraService;
    private final AuditLogService auditLogService;

    @Value("${app.api-key}")
    private String apiKey;

    // GET /api/cameras
    @GetMapping
    public ResponseEntity<BaseResponse<List<CameraResponse>>> getAll() {
        return ResponseEntity.ok(BaseResponse.ok(cameraService.getAll()));
    }

    // GET /api/cameras/enabled
    @GetMapping("/enabled")
    public ResponseEntity<BaseResponse<List<CameraResponse>>> getAllEnabled(
            @RequestHeader("X-Api-Key") String requestApiKey
    ) {
        if (!apiKey.equals(requestApiKey)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(BaseResponse.error("Invalid API key"));
        }
        return ResponseEntity.ok(BaseResponse.ok(cameraService.getAllEnabled()));
    }

    // GET /api/cameras/{id}
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<CameraResponse>> getById(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(BaseResponse.ok(cameraService.getById(id)));
    }

    // POST /api/cameras
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<CameraResponse>> create(
            @Valid @RequestBody CameraRequest request,
            org.springframework.security.core.Authentication auth,
            HttpServletRequest httpRequest
    ) {
        CameraResponse response = cameraService.create(request);
        auditLogService.log(
                auth.getName(), AuditAction.CREATE_CAMERA,
                "CAMERA", String.valueOf(response.getId()), request.getName(),
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(BaseResponse.ok("Camera created", response));
    }

    // POST /api/cameras/bulk
    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<List<CameraResponse>>> createBulk(
            @Valid @RequestBody CameraBulkRequest request,
            org.springframework.security.core.Authentication auth,
            HttpServletRequest httpRequest
    ) {
        List<CameraResponse> responses = cameraService.createBulk(request.getCameras());
        auditLogService.log(
                auth.getName(), AuditAction.BULK_CREATE_CAMERA,
                "CAMERA", null, "count=" + responses.size(),
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(BaseResponse.ok("Cameras created", responses));
    }


    // PUT /api/cameras/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<CameraResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody CameraRequest request,
            org.springframework.security.core.Authentication auth,
            HttpServletRequest httpRequest
    ) {
        CameraResponse response = cameraService.update(id, request);
        auditLogService.log(
                auth.getName(), AuditAction.UPDATE_CAMERA,
                "CAMERA", String.valueOf(id), request.getName(),
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok("Camera updated", response));
    }

    // PATCH /api/cameras/{id}/toggle
    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<CameraResponse>> toggle(
            @PathVariable Long id,
            org.springframework.security.core.Authentication auth,
            HttpServletRequest httpRequest
    ) {
        CameraResponse response = cameraService.toggleEnabled(id);
        auditLogService.log(
                auth.getName(), AuditAction.TOGGLE_CAMERA,
                "CAMERA", String.valueOf(id), "enabled=" + response.getEnabled(),
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok("Camera toggled", response));
    }

    // DELETE /api/cameras/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BaseResponse<Void>> delete(
            @PathVariable Long id,
            org.springframework.security.core.Authentication auth,
            HttpServletRequest httpRequest
    ) {
        cameraService.delete(id);
        auditLogService.log(
                auth.getName(), AuditAction.DELETE_CAMERA,
                "CAMERA", String.valueOf(id), null,
                auditLogService.extractIp(httpRequest)
        );
        return ResponseEntity.ok(BaseResponse.ok("Camera deleted", null));
    }

    // PUT /api/cameras/{id}/resolution
    @PutMapping("/{id}/resolution")
    public ResponseEntity<BaseResponse<CameraResponse>> updateResolution(
            @RequestHeader("X-Api-Key") String requestApiKey,
            @PathVariable Long id,
            @RequestParam Integer width,
            @RequestParam Integer height
    ) {
        if (!apiKey.equals(requestApiKey)) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(BaseResponse.error("Invalid API key"));
        }

        CameraResponse response = cameraService.updateResolution(id, width, height);
        return ResponseEntity.ok(BaseResponse.ok("Resolution updated", response));
    }
}