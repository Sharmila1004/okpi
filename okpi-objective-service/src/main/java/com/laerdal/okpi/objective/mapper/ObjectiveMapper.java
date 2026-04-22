package com.laerdal.okpi.objective.mapper;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ObjectiveMapper {

    public Objective toEntity(CreateObjectiveRequest request) {
        return Objective.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(ObjectiveStatus.DRAFT)
                .progressPercentage(BigDecimal.ZERO)
                .build();
    }

    public ObjectiveResponse toResponse(Objective objective) {
        return ObjectiveResponse.builder()
                .id(objective.getId())
                .title(objective.getTitle())
                .description(objective.getDescription())
                .status(objective.getStatus())
                .startDate(objective.getStartDate())
                .endDate(objective.getEndDate())
                .progressPercentage(objective.getProgressPercentage())
                .build();
    }
}
