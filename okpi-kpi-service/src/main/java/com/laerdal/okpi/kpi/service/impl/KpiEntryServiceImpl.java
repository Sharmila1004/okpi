package com.laerdal.okpi.kpi.service.impl;

import com.laerdal.okpi.kpi.dto.request.CreateKpiEntryRequest;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.entity.KpiDefinition;
import com.laerdal.okpi.kpi.entity.KpiEntry;
import com.laerdal.okpi.kpi.exception.ResourceNotFoundException;
import com.laerdal.okpi.kpi.mapper.KpiEntryMapper;
import com.laerdal.okpi.kpi.repository.KpiDefinitionRepository;
import com.laerdal.okpi.kpi.repository.KpiEntryRepository;
import com.laerdal.okpi.kpi.service.KpiEntryService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class KpiEntryServiceImpl implements KpiEntryService {

    private final KpiEntryRepository kpiEntryRepository;
    private final KpiDefinitionRepository kpiDefinitionRepository;
    private final KpiEntryMapper kpiEntryMapper;

    public KpiEntryServiceImpl(KpiEntryRepository kpiEntryRepository,
                               KpiDefinitionRepository kpiDefinitionRepository,
                               KpiEntryMapper kpiEntryMapper) {
        this.kpiEntryRepository = kpiEntryRepository;
        this.kpiDefinitionRepository = kpiDefinitionRepository;
        this.kpiEntryMapper = kpiEntryMapper;
    }

    @Override
    public KpiEntryResponse create(Long kpiId, CreateKpiEntryRequest request) {
        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));

        KpiEntry entry = KpiEntry.builder()
                .kpiDefinition(definition)
                .value(request.getValue())
                .recordedAt(request.getRecordedAt())
                .note(request.getNote())
                .createdAt(Instant.now())
                .build();

        return kpiEntryMapper.toResponse(kpiEntryRepository.save(entry));
    }

    @Override
    public List<KpiEntryResponse> getByKpiId(Long kpiId) {
        return kpiEntryRepository.findAllByKpiDefinition_Id(kpiId).stream()
                .map(kpiEntryMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long entryId) {
        if (!kpiEntryRepository.existsById(entryId)) {
            throw new ResourceNotFoundException("KPI entry not found");
        }
        kpiEntryRepository.deleteById(entryId);
    }
}
