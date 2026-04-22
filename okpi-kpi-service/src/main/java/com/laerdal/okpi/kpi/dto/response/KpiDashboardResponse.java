package com.laerdal.okpi.kpi.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KpiDashboardResponse {
    private long kpiCount;
    private long entryCount;
    private List<KpiResponse> kpis;
}
