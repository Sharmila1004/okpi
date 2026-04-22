package com.laerdal.okpi.objective.dto.response;

import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ObjectiveResponse {
    private Long id;
    private String title;
    private String description;
    private ObjectiveStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal progressPercentage;
}
