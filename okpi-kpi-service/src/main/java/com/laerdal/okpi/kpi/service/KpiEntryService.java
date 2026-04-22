package com.laerdal.okpi.kpi.service;

import com.laerdal.okpi.kpi.dto.request.CreateKpiEntryRequest;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;

import java.util.List;

public interface KpiEntryService {
    KpiEntryResponse create(Long kpiId, CreateKpiEntryRequest request);
    List<KpiEntryResponse> getByKpiId(Long kpiId);
    void delete(Long entryId);
}
