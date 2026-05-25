package com.laerdal.okpi.objective.mapper;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

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
        List<Long> assigneeIds = objective.getAssignees().stream()
                .map(a -> a.getUserId())
                .toList();

        int keyResultCount = objective.getKeyResults() != null
                ? objective.getKeyResults().size()
                : 0;

        KeyResult latestKeyResult = objective.getKeyResults() == null || objective.getKeyResults().isEmpty()
                ? null
                : objective.getKeyResults().stream()
                        .max(Comparator.comparing(KeyResult::getUpdatedAt))
                        .orElse(null);

        return ObjectiveResponse.builder()
                .id(objective.getId())
                .ownerId(objective.getOwnerId())
                .title(objective.getTitle())
                .description(objective.getDescription())
                .status(objective.getStatus())
                .startDate(objective.getStartDate())
                .endDate(objective.getEndDate())
                .progressPercentage(objective.getProgressPercentage())
                .assigneeIds(assigneeIds)
                .keyResultCount(keyResultCount)
                .lastUpdatedAt(objective.getUpdatedAt())
                .lastUpdatedByUserId(latestKeyResult != null
                        ? latestKeyResult.getUpdatedByUserId()
                        : null)
                .build();
    }
}
