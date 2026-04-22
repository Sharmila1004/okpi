package com.laerdal.okpi.objective.dto.request;

import com.laerdal.okpi.objective.enums.KeyResultStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateKeyResultRequest {
    private String title;
    private String description;
    private BigDecimal currentValue;
    private BigDecimal targetValue;
    private KeyResultStatus status;
}
