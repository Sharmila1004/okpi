package com.laerdal.okpi.objective.dto.request;

import com.laerdal.okpi.objective.enums.MetricType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateKeyResultRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private MetricType metricType;
    private BigDecimal startValue;
    private BigDecimal targetValue;
}
