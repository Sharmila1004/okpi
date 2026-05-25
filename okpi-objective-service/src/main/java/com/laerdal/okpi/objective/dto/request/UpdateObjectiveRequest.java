package com.laerdal.okpi.objective.dto.request;

import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateObjectiveRequest {
    private String title;
    private String description;
    private ObjectiveStatus status;
    private LocalDate startDate;
    private LocalDate endDate;

    // assign to specific user ids
    private List<Long> assigneeIds;
}
