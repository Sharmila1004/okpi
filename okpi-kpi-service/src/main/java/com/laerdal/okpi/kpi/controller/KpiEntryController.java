package com.laerdal.okpi.kpi.controller;

import com.laerdal.okpi.kpi.dto.request.CreateKpiEntryRequest;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.service.KpiEntryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/kpis/{kpiId}/entries")
@Tag(name = "KPI Entries", description = "KPI measurement entry APIs")
@SecurityRequirement(name = "bearerAuth")
public class KpiEntryController {

    private final KpiEntryService kpiEntryService;

    public KpiEntryController(KpiEntryService kpiEntryService) {
        this.kpiEntryService = kpiEntryService;
    }

    @PostMapping
    @Operation(summary = "Create a KPI entry")
    public KpiEntryResponse create(@PathVariable("kpiId") Long kpiId,
                                   @Valid @RequestBody CreateKpiEntryRequest request) {
        return kpiEntryService.create(kpiId, request);
    }

    @GetMapping
    @Operation(summary = "List KPI entries")
    public List<KpiEntryResponse> getAll(@PathVariable("kpiId") Long kpiId) {
        return kpiEntryService.getByKpiId(kpiId);
    }

    @DeleteMapping("/{entryId}")
    @Operation(summary = "Delete a KPI entry")
    public void delete(@PathVariable("entryId") Long entryId) {
        kpiEntryService.delete(entryId);
    }
}
