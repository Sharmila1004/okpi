package com.laerdal.okpi.kpi.service;

import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;

import java.util.List;

public interface KpiService {
    KpiResponse create(CreateKpiRequest request);
    List<KpiResponse> getAllForCurrentUser();
    KpiDetailResponse getById(Long kpiId);
    KpiResponse update(Long kpiId, UpdateKpiRequest request);
    void delete(Long kpiId);
}
