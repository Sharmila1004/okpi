package com.laerdal.okpi.objective.mapper;

import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import org.springframework.stereotype.Component;

@Component
public class KeyResultMapper {

    public KeyResultResponse toResponse(KeyResult keyResult) {
        return KeyResultResponse.builder()
                .id(keyResult.getId())
                .objectiveId(keyResult.getObjective() != null ? keyResult.getObjective().getId() : null)
                .title(keyResult.getTitle())
                .description(keyResult.getDescription())
                .metricType(keyResult.getMetricType())
                .startValue(keyResult.getStartValue())
                .currentValue(keyResult.getCurrentValue())
                .targetValue(keyResult.getTargetValue())
                .status(keyResult.getStatus())
                .build();
    }
}
