package com.laerdal.okpi.kpi.service.impl;

import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.entity.KpiDefinition;
import com.laerdal.okpi.kpi.exception.ResourceNotFoundException;
import com.laerdal.okpi.kpi.mapper.KpiEntryMapper;
import com.laerdal.okpi.kpi.mapper.KpiMapper;
import com.laerdal.okpi.kpi.repository.KpiDefinitionRepository;
import com.laerdal.okpi.kpi.security.RequestContext;
import com.laerdal.okpi.kpi.service.KpiService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class KpiServiceImpl implements KpiService {

    private final KpiDefinitionRepository kpiDefinitionRepository;
    private final KpiMapper kpiMapper;
    private final KpiEntryMapper kpiEntryMapper;
    private final RequestContext requestContext;

    public KpiServiceImpl(KpiDefinitionRepository kpiDefinitionRepository,
                          KpiMapper kpiMapper,
                          KpiEntryMapper kpiEntryMapper,
                          RequestContext requestContext) {
        this.kpiDefinitionRepository = kpiDefinitionRepository;
        this.kpiMapper = kpiMapper;
        this.kpiEntryMapper = kpiEntryMapper;
        this.requestContext = requestContext;
    }

    @Override
    public KpiResponse create(CreateKpiRequest request) {
        KpiDefinition definition = KpiDefinition.builder()
                .ownerId(requestContext.getUserId() != null ? requestContext.getUserId() : 0L)
                .name(request.getName())
                .description(request.getDescription())
                .unit(request.getUnit())
                .frequency(request.getFrequency())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        return kpiMapper.toResponse(kpiDefinitionRepository.save(definition));
    }

    @Override
    public List<KpiResponse> getAllForCurrentUser() {
        Long userId = requestContext.getUserId() != null ? requestContext.getUserId() : 0L;
        return kpiDefinitionRepository.findAllByOwnerId(userId).stream()
                .map(kpiMapper::toResponse)
                .toList();
    }

    @Override
    public KpiDetailResponse getById(Long kpiId) {
        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));

        List<KpiEntryResponse> entries = definition.getEntries().stream()
                .map(kpiEntryMapper::toResponse)
                .toList();

        return KpiDetailResponse.builder()
                .kpi(kpiMapper.toResponse(definition))
                .entries(entries)
                .build();
    }

    @Override
    public KpiResponse update(Long kpiId, UpdateKpiRequest request) {
        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));

        if (request.getName() != null) {
            definition.setName(request.getName());
        }
        if (request.getDescription() != null) {
            definition.setDescription(request.getDescription());
        }
        if (request.getUnit() != null) {
            definition.setUnit(request.getUnit());
        }
        if (request.getFrequency() != null) {
            definition.setFrequency(request.getFrequency());
        }
        definition.setUpdatedAt(Instant.now());
        return kpiMapper.toResponse(kpiDefinitionRepository.save(definition));
    }

    @Override
    public void delete(Long kpiId) {
        if (!kpiDefinitionRepository.existsById(kpiId)) {
            throw new ResourceNotFoundException("KPI not found");
        }
        kpiDefinitionRepository.deleteById(kpiId);
    }
}
