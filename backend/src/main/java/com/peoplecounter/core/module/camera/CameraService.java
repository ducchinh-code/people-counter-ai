package com.peoplecounter.core.module.camera;

import com.peoplecounter.core.module.camera.dto.CameraRequest;
import com.peoplecounter.core.module.camera.dto.CameraResponse;
import com.peoplecounter.core.web.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraRepository cameraRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<CameraResponse> getAll() {
        return cameraRepository.findAllByOrderByIdAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<CameraResponse> getAllEnabled() {
        return cameraRepository.findByEnabledTrueOrderByIdAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CameraResponse getById(Long id) {
        return toResponse(findById(id));
    }


    @Transactional
    public CameraResponse update(Long id, CameraRequest request) {

        Camera camera = findById(id);

        if (!camera.getName().equals(request.getName())
                && cameraRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException(
                    "Camera name already exists: " + request.getName()
            );
        }

        camera.setName(request.getName());
        camera.setSource(request.getSource());
        camera.setRegion(request.getRegion());
        camera.setTracker(request.getTracker());
        camera.setEnabled(request.getEnabled());

        Camera saved = cameraRepository.save(camera);
        CameraResponse response = toResponse(saved);

        messagingTemplate.convertAndSend("/topic/cameras", response);

        return response;
    }

    @Transactional
    public CameraResponse toggleEnabled(Long id) {
        Camera camera = findById(id);
        camera.setEnabled(!camera.getEnabled());
        CameraResponse response = toResponse(cameraRepository.save(camera));

        messagingTemplate.convertAndSend("/topic/cameras", response);

        return response;
    }

    @Transactional
    public CameraResponse updateResolution(Long id, Integer width, Integer height) {
        Camera camera = findById(id);
        camera.setVideoWidth(width);
        camera.setVideoHeight(height);

        Camera saved = cameraRepository.save(camera);
        return toResponse(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!cameraRepository.existsById(id)) {
            throw new ResourceNotFoundException("Camera", id);
        }
        cameraRepository.deleteById(id);

        messagingTemplate.convertAndSend("/topic/cameras",
                CameraResponse.builder()
                        .id(id)
                        .enabled(false)
                        .build()
        );
    }

    public Camera findById(Long id) {
        return cameraRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Camera", id));
    }

    private CameraResponse toResponse(Camera camera) {
        return CameraResponse.builder()
                .id(camera.getId())
                .name(camera.getName())
                .source(camera.getSource())
                .videoWidth(camera.getVideoWidth())
                .videoHeight(camera.getVideoHeight())
                .region(camera.getRegion())
                .tracker(camera.getTracker())
                .enabled(camera.getEnabled())
                .createdAt(camera.getCreatedAt())
                .updatedAt(camera.getUpdatedAt())
                .build();
    }

    public CameraResponse create(CameraRequest request) {
        return doCreate(request);
    }

    public List<CameraResponse> createBulk(List<CameraRequest> requests) {
        return requests.stream()
                .map(this::doCreate)
                .toList();
    }

    private CameraResponse doCreate(CameraRequest request) {

        if (cameraRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException(
                    "Camera name already exists: " + request.getName()
            );
        }

        Camera camera = Camera.builder()
                .name(request.getName())
                .source(request.getSource())
                .region(request.getRegion())
                .tracker(request.getTracker())
                .enabled(request.getEnabled())
                .build();

        Camera saved = cameraRepository.save(camera);
        CameraResponse response = toResponse(saved);

        messagingTemplate.convertAndSend("/topic/cameras", response);

        return response;
    }
}