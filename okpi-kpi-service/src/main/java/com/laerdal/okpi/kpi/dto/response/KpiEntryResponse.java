package com.laerdal.okpi.kpi.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class KpiEntryResponse {
    private Long id;
    private Long kpiDefinitionId;
    private BigDecimal value;
    private LocalDate recordedAt;
    private String note;
}
