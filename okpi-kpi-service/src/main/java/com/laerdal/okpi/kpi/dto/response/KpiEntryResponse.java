package com.laerdal.okpi.kpi.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class KpiEntryResponse {
    private Long id;
    private Long kpiDefinitionId;
    private BigDecimal value;
    private Instant recordedAt;
    private String note;
}
