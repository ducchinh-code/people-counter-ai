package com.peoplecounter.core.module.counter;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.peoplecounter.base.domain.BaseEntity;
import com.peoplecounter.core.module.camera.Camera;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "hourly_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CounterData extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camera_id", nullable = false)
    private Camera camera;

    @Column(name = "hour", nullable = false, length = 50)
    private String hour;

    @Column(name = "in_count", nullable = false)
    private int inCount;

    @Column(name = "out_count", nullable = false)
    private int outCount;

    @Column(name = "total", nullable = false)
    private int total;

    @Column(name = "is_partial")
    private boolean partial;

    @CreationTimestamp
    @Column(name = "recorded_at", updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    @PreUpdate
    void updateTotal() {
        this.total = this.inCount + this.outCount;
    }
}
