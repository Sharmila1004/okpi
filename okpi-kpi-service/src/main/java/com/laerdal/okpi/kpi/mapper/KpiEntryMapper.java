package com.laerdal.okpi.kpi.mapper;

import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.entity.KpiEntry;
import org.springframework.stereotype.Component;

import java.time.ZoneOffset;

@Component
public class KpiEntryMapper {

    public KpiEntryResponse toResponse(KpiEntry entry) {
        return KpiEntryResponse.builder()
                .id(entry.getId())
                .kpiDefinitionId(entry.getKpiDefinition() != null ? entry.getKpiDefinition().getId() : null)
                .value(entry.getValue())
                .recordedAt(entry.getRecordedAt() != null
                        ? entry.getRecordedAt().atZone(ZoneOffset.UTC).toLocalDate()
                        : null)
                .note(entry.getNote())
                .build();
    }
}
