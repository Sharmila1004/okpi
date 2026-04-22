package com.laerdal.okpi.kpi.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KpiDetailResponse {
    private KpiResponse kpi;
    private List<KpiEntryResponse> entries;
}
