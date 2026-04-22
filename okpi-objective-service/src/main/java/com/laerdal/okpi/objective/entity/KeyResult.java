package com.laerdal.okpi.objective.entity;

import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.enums.MetricType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "key_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeyResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objective_id", nullable = false)
    private Objective objective;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MetricType metricType;

    @Column(precision = 19, scale = 4)
    private BigDecimal startValue;

    @Column(precision = 19, scale = 4)
    private BigDecimal currentValue;

    @Column(precision = 19, scale = 4)
    private BigDecimal targetValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private KeyResultStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;

}
