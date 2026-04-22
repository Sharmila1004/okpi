package com.laerdal.okpi.kpi.mapper;

import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.entity.KpiDefinition;
import org.springframework.stereotype.Component;

@Component
public class KpiMapper {

    public KpiResponse toResponse(KpiDefinition definition) {
        return KpiResponse.builder()
                .id(definition.getId())
                .name(definition.getName())
                .description(definition.getDescription())
                .unit(definition.getUnit())
                .frequency(definition.getFrequency())
                .build();
    }
}
