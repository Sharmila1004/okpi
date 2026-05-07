package com.laerdal.okpi.kpi.controller;

import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.service.KpiService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpis")
public class KpiController {

    private final KpiService kpiService;

    public KpiController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @PostMapping
    public KpiResponse create(@Valid @RequestBody CreateKpiRequest request) {
        return kpiService.create(request);
    }

    @GetMapping
    public List<KpiResponse> getAll() {
        return kpiService.getAllForCurrentUser();
    }

    @GetMapping("/{kpiId}")
    public KpiDetailResponse getById(@PathVariable("kpiId") Long kpiId) {
        return kpiService.getById(kpiId);
    }

    @PutMapping("/{kpiId}")
    public KpiResponse update(@PathVariable("kpiId") Long kpiId,
                              @RequestBody UpdateKpiRequest request) {
        return kpiService.update(kpiId, request);
    }

    @DeleteMapping("/{kpiId}")
    public void delete(@PathVariable("kpiId") Long kpiId) {
        kpiService.delete(kpiId);
    }
}
