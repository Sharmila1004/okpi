package com.laerdal.okpi.kpi.dto.response;

import com.laerdal.okpi.kpi.enums.KpiFrequency;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class KpiResponse {
    private Long id;
    private String name;
    private String description;
    private String unit;
    private KpiFrequency frequency;
}
