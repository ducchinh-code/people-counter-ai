package com.peoplecounter.core.module.counter;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CounterDataRepository extends JpaRepository<CounterData, Long> {

    List<CounterData> findByCameraIdAndRecordedAtBetweenAndPartialFalse(
            Long cameraId,
            LocalDateTime from,
            LocalDateTime to
    );

    List<CounterData> findByRecordedAtBetweenAndPartialFalse(
            LocalDateTime from,
            LocalDateTime to
    );

    @Query("""
            SELECT SUM(c.inCount), SUM(c.outCount)
            FROM CounterData c
            WHERE c.camera.id = :cameraId
            AND c.recordedAt BETWEEN :from AND :to
            AND c.partial = false
            """)
    List<Object[]> sumInOutByCameraAndDateRange(
            @Param("cameraId") Long cameraId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    @Query("""
            SELECT c FROM CounterData c
            WHERE c.camera.id = :cameraId
            AND c.recordedAt BETWEEN :from AND :to
            AND c.partial = false
            ORDER BY c.total DESC
            LIMIT 1
            """)
    CounterData findPeakHour(
            @Param("cameraId") Long cameraId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    List<CounterData> findByCameraIdAndRecordedAtBetween(
            Long cameraId,
            LocalDateTime from,
            LocalDateTime to
    );

    List<CounterData> findByRecordedAtBetween(
            LocalDateTime from,
            LocalDateTime to
    );
}