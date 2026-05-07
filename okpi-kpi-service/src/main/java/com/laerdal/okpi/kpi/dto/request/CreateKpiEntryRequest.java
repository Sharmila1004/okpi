package com.laerdal.okpi.kpi.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateKpiEntryRequest {
    @NotNull
    private BigDecimal value;
    @NotNull
    private LocalDate recordedAt;
    private String note;
}
