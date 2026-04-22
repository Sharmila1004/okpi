package com.laerdal.okpi.objective.dto.request;

import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateObjectiveRequest {
    private String title;
    private String description;
    private ObjectiveStatus status;
    private LocalDate startDate;
    private LocalDate endDate;
}
