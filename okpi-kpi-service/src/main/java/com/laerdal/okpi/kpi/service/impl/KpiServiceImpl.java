package com.laerdal.okpi.kpi.service.impl;

import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.entity.KpiDefinition;
import com.laerdal.okpi.kpi.entity.Notification;
import com.laerdal.okpi.kpi.exception.AccessDeniedException;
import com.laerdal.okpi.kpi.exception.ResourceNotFoundException;
import com.laerdal.okpi.kpi.mapper.KpiEntryMapper;
import com.laerdal.okpi.kpi.mapper.KpiMapper;
import com.laerdal.okpi.kpi.repository.KpiDefinitionRepository;
import com.laerdal.okpi.kpi.repository.NotificationRepository;
import com.laerdal.okpi.kpi.security.RequestContext;
import com.laerdal.okpi.kpi.service.KpiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@Slf4j
public class KpiServiceImpl implements KpiService {

    private final KpiDefinitionRepository kpiDefinitionRepository;
    private final KpiMapper kpiMapper;
    private final KpiEntryMapper kpiEntryMapper;
    private final RequestContext requestContext;
    private final NotificationRepository notificationRepository;

    public KpiServiceImpl(KpiDefinitionRepository kpiDefinitionRepository,
                          KpiMapper kpiMapper,
                          KpiEntryMapper kpiEntryMapper,
                          RequestContext requestContext,
                          NotificationRepository notificationRepository) {
        this.kpiDefinitionRepository = kpiDefinitionRepository;
        this.kpiMapper = kpiMapper;
        this.kpiEntryMapper = kpiEntryMapper;
        this.requestContext = requestContext;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public KpiResponse create(CreateKpiRequest request) {
        Long userId = requestContext.getUserId() != null ? requestContext.getUserId() : 0L;
        log.info("Creating KPI '{}' for user {}", request.getName(), userId);

        KpiDefinition definition = KpiDefinition.builder()
                .ownerId(userId)
                .name(request.getName())
                .description(request.getDescription())
                .unit(request.getUnit())
                .frequency(request.getFrequency())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        KpiDefinition saved = kpiDefinitionRepository.save(definition);
        log.info("KPI created with id {}", saved.getId());

        // NOTIFICATION LOGIC
        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            for (Long assignedUserId : request.getAssigneeIds()) {

                Notification notification = Notification.builder()
                        .userId(assignedUserId)
                        .message("You have been assigned KPI: " + request.getName())
                        .read(false)
                        .createdAt(Instant.now())
                        .build();

                notificationRepository.save(notification);
            }
        }

        return kpiMapper.toResponse(saved);
    }

    @Override
    public List<KpiResponse> getAllForCurrentUser() {
        Long userId = requestContext.getUserId() != null ? requestContext.getUserId() : 0L;
        log.info("Fetching all KPIs for user {}", userId);

        return kpiDefinitionRepository.findAllByOwnerId(userId).stream()
                .map(kpiMapper::toResponse)
                .toList();
    }

    @Override
    public KpiDetailResponse getById(Long kpiId) {
        log.info("Fetching KPI with id {}", kpiId);

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> {
                    log.error("KPI not found with id {}", kpiId);
                    return new ResourceNotFoundException("KPI not found");
                });

        String userRole = requestContext.getUserRole();
        Long userId = requestContext.getUserId();

        if ("MEMBER".equals(userRole) && !userId.equals(definition.getOwnerId())) {
            log.warn("Access denied: User {} attempted to access KPI {}", userId, kpiId);
            throw new AccessDeniedException("Members can only view their own KPIs");
        }

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
        log.info("Updating KPI with id {}", kpiId);

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> {
                    log.error("KPI not found with id {}", kpiId);
                    return new ResourceNotFoundException("KPI not found");
                });

        Long userId = requestContext.getUserId();
        String userRole = requestContext.getUserRole();

        if (!userId.equals(definition.getOwnerId()) && !"ADMIN".equals(userRole)) {
            log.warn("Access denied: User {} attempted to update KPI {}", userId, kpiId);
            throw new AccessDeniedException("Only the owner or admin can update this KPI");
        }

        if (request.getName() != null) definition.setName(request.getName());
        if (request.getDescription() != null) definition.setDescription(request.getDescription());
        if (request.getUnit() != null) definition.setUnit(request.getUnit());
        if (request.getFrequency() != null) definition.setFrequency(request.getFrequency());

        definition.setUpdatedAt(Instant.now());

        KpiDefinition saved = kpiDefinitionRepository.save(definition);
        log.info("KPI {} updated successfully", kpiId);

        return kpiMapper.toResponse(saved);
    }

    @Override
    public void delete(Long kpiId) {
        log.info("Deleting KPI with id {}", kpiId);

        if (!kpiDefinitionRepository.existsById(kpiId)) {
            log.error("KPI not found with id {}", kpiId);
            throw new ResourceNotFoundException("KPI not found");
        }

        kpiDefinitionRepository.deleteById(kpiId);
        log.info("KPI {} deleted successfully", kpiId);
    }
}