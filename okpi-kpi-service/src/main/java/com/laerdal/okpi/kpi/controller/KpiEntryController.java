package com.laerdal.okpi.kpi.controller;

import com.laerdal.okpi.kpi.dto.request.CreateKpiEntryRequest;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.service.KpiEntryService;
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
public class KpiEntryController {

    private final KpiEntryService kpiEntryService;

    public KpiEntryController(KpiEntryService kpiEntryService) {
        this.kpiEntryService = kpiEntryService;
    }

    @PostMapping
    public KpiEntryResponse create(@PathVariable Long kpiId,
                                   @Valid @RequestBody CreateKpiEntryRequest request) {
        return kpiEntryService.create(kpiId, request);
    }

    @GetMapping
    public List<KpiEntryResponse> getAll(@PathVariable Long kpiId) {
        return kpiEntryService.getByKpiId(kpiId);
    }

    @DeleteMapping("/{entryId}")
    public void delete(@PathVariable Long entryId) {
        kpiEntryService.delete(entryId);
    }
}
