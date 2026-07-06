package com.peoplecounter.core.module.camera;

import com.peoplecounter.base.domain.BaseEntity;
import com.peoplecounter.core.module.counter.CounterData;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "cameras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Camera extends BaseEntity {

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "source", nullable = false, columnDefinition = "TEXT")
    private String source;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "region", columnDefinition = "jsonb", nullable = false)
    private List<List<Integer>> region;

    @Column(name = "tracker", length = 50)
    private String tracker = "botsort.yaml";

    @Column(name = "enabled")
    private Boolean enabled = true;

    @OneToMany(mappedBy = "camera", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CounterData> stats;
}