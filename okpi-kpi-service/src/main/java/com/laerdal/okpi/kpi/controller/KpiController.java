package com.laerdal.okpi.kpi.controller;

import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.service.KpiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "KPIs", description = "KPI definition and entry APIs")
@SecurityRequirement(name = "bearerAuth")
public class KpiController {

    private final KpiService kpiService;

    public KpiController(KpiService kpiService) {
        this.kpiService = kpiService;
    }

    @PostMapping
    @Operation(summary = "Create a KPI definition")
    public KpiResponse create(@Valid @RequestBody CreateKpiRequest request) {
        return kpiService.create(request);
    }

    @GetMapping
    @Operation(summary = "List the current user's KPIs")
    public List<KpiResponse> getAll() {
        return kpiService.getAllForCurrentUser();
    }

    @GetMapping("/{kpiId}")
    @Operation(summary = "Get a KPI with its entries")
    public KpiDetailResponse getById(@PathVariable("kpiId") Long kpiId) {
        return kpiService.getById(kpiId);
    }

    @PutMapping("/{kpiId}")
    @Operation(summary = "Update a KPI definition")
    public KpiResponse update(@PathVariable("kpiId") Long kpiId,
                              @RequestBody UpdateKpiRequest request) {
        return kpiService.update(kpiId, request);
    }

    @DeleteMapping("/{kpiId}")
    @Operation(summary = "Delete a KPI definition")
    public void delete(@PathVariable("kpiId") Long kpiId) {
        kpiService.delete(kpiId);
    }
}
