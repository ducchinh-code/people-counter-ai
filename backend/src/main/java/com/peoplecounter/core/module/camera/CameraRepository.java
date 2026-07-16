package com.peoplecounter.core.module.camera;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CameraRepository extends JpaRepository<Camera, Long> {

    List<Camera> findAllByOrderByIdAsc();

    List<Camera> findByEnabledTrueOrderByIdAsc();

    boolean existsByName(String name);
}