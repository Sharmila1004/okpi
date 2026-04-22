package com.laerdal.okpi.kpi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class CreateKpiEntryRequest {
    @NotNull
    private BigDecimal value;
    @NotNull
    private Instant recordedAt;
    private String note;
}
