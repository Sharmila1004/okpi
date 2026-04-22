package com.laerdal.okpi.objective.dto.response;

import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.enums.MetricType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class KeyResultResponse {
    private Long id;
    private Long objectiveId;
    private String title;
    private String description;
    private MetricType metricType;
    private BigDecimal startValue;
    private BigDecimal currentValue;
    private BigDecimal targetValue;
    private KeyResultStatus status;
}
