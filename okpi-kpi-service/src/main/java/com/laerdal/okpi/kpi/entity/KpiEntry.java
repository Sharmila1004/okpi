package com.laerdal.okpi.kpi.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "kpi_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KpiEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kpi_definition_id", nullable = false)
    private KpiDefinition kpiDefinition;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal value;

    @Column(nullable = false)
    private Instant recordedAt;

    @Column(length = 1000)
    private String note;

    @Column(nullable = false)
    private Instant createdAt;
}
