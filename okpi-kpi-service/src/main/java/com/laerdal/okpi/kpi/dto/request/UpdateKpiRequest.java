package com.laerdal.okpi.kpi.dto.request;

import com.laerdal.okpi.kpi.enums.KpiFrequency;
import lombok.Data;

@Data
public class UpdateKpiRequest {
    private String name;
    private String description;
    private String unit;
    private KpiFrequency frequency;
}
