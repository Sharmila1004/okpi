package com.laerdal.okpi.kpi.service.impl;

import com.laerdal.okpi.kpi.dto.request.CreateKpiRequest;
import com.laerdal.okpi.kpi.dto.request.UpdateKpiRequest;
import com.laerdal.okpi.kpi.dto.response.KpiDetailResponse;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.dto.response.KpiResponse;
import com.laerdal.okpi.kpi.entity.KpiDefinition;
import com.laerdal.okpi.kpi.exception.AccessDeniedException;
import com.laerdal.okpi.kpi.exception.ResourceNotFoundException;
import com.laerdal.okpi.kpi.mapper.KpiEntryMapper;
import com.laerdal.okpi.kpi.mapper.KpiMapper;
import com.laerdal.okpi.kpi.repository.KpiDefinitionRepository;
import com.laerdal.okpi.kpi.security.RequestContext;
import com.laerdal.okpi.kpi.service.KpiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
public class KpiServiceImpl implements KpiService {

    private final KpiDefinitionRepository kpiDefinitionRepository;
    private final KpiMapper kpiMapper;
    private final KpiEntryMapper kpiEntryMapper;
    private final RequestContext requestContext;
    private final AuthNotificationClient authNotificationClient;
    private final AuthUserClient authUserClient;

    public KpiServiceImpl(KpiDefinitionRepository kpiDefinitionRepository,
                          KpiMapper kpiMapper,
                          KpiEntryMapper kpiEntryMapper,
                          RequestContext requestContext,
                          AuthNotificationClient authNotificationClient,
                          AuthUserClient authUserClient) {
        this.kpiDefinitionRepository = kpiDefinitionRepository;
        this.kpiMapper = kpiMapper;
        this.kpiEntryMapper = kpiEntryMapper;
        this.requestContext = requestContext;
        this.authNotificationClient = authNotificationClient;
        this.authUserClient = authUserClient;
    }

    @Override
    public KpiResponse create(CreateKpiRequest request) {
        requireAuthenticated();
        Long userId = requestContext.getUserId();

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

        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            List<Long> assigneeIds = request.getAssigneeIds().stream()
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            List<AuthUserClient.UserSummary> summaries =
                    authUserClient.getUsersSummary(assigneeIds);

            Map<Long, AuthUserClient.UserSummary> byId = summaries.stream()
                    .filter(Objects::nonNull)
                    .filter(summary -> summary.id != null)
                    .collect(Collectors.toMap(
                            summary -> summary.id,
                            summary -> summary,
                            (left, right) -> left
                    ));

            if (byId.size() != assigneeIds.size()) {
                throw new ResourceNotFoundException("One or more assignees not found");
            }

            String currentRole = requestContext.getUserRole();

            if ("MANAGER".equals(currentRole)) {
                for (Long uid : assigneeIds) {
                    AuthUserClient.UserSummary s = byId.get(uid);
                    if (s == null || s.role == null || !s.role.equalsIgnoreCase("MEMBER")) {
                        throw new AccessDeniedException("Managers can only assign KPIs to their members");
                    }
                    if (!Objects.equals(s.managerId, requestContext.getUserId())) {
                        throw new AccessDeniedException("Cannot assign KPI to a member not in your team");
                    }
                }
            }

            Map<Long, String> notifications = new java.util.LinkedHashMap<>();
            for (Long assignedUserId : assigneeIds) {
                notifications.put(assignedUserId, "You have been assigned KPI: " + request.getName());
            }

            authNotificationClient.createNotifications(notifications);
        }

        return kpiMapper.toResponse(saved);
    }

    @Override
    public List<KpiResponse> getAllForCurrentUser() {
        requireAuthenticated();

        Long currentUserId = requestContext.getUserId();
        String currentRole = requestContext.getUserRole();

        AuthUserClient.UserSummary currentUser =
                loadCurrentUserSummary(currentUserId);

        List<KpiDefinition> allKpis = kpiDefinitionRepository.findAll();

        List<Long> ownerIds = allKpis.stream()
                .map(KpiDefinition::getOwnerId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, AuthUserClient.UserSummary> ownersById =
                loadUserSummaries(ownerIds);

        return allKpis.stream()
                .filter(definition -> {
                    try {
                        return isVisibleToCurrentUser(
                                definition,
                                currentUserId,
                                currentRole,
                                currentUser,
                                ownersById
                        );
                    } catch (Exception e) {
                        return false;
                    }
                })
                .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
                .map(kpiMapper::toResponse)
                .toList();
    }

    @Override
    public KpiDetailResponse getById(Long kpiId) {
        requireAuthenticated();

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));

        Long currentUserId = requestContext.getUserId();
        String currentRole = requestContext.getUserRole();

        AuthUserClient.UserSummary currentUser = loadCurrentUserSummary(currentUserId);

        Map<Long, AuthUserClient.UserSummary> ownersById =
                loadUserSummaries(List.of(definition.getOwnerId()));

        if (!isVisibleToCurrentUser(definition, currentUserId, currentRole, currentUser, ownersById)) {
            throw new AccessDeniedException("You do not have access to this insight");
        }

        List<KpiEntryResponse> entries = definition.getEntries().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(kpiEntryMapper::toResponse)
                .toList();

        return KpiDetailResponse.builder()
                .kpi(kpiMapper.toResponse(definition))
                .entries(entries)
                .build();
    }

    @Override
    public KpiResponse update(Long kpiId, UpdateKpiRequest request) {
        requireAuthenticated();

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));

        Long userId = requestContext.getUserId();
        String userRole = requestContext.getUserRole();

        if (userId == null || (!userId.equals(definition.getOwnerId()) && !"ADMIN".equals(userRole))) {
            throw new AccessDeniedException("Only the owner or admin can update this KPI");
        }

        if (request.getName() != null) definition.setName(request.getName());
        if (request.getDescription() != null) definition.setDescription(request.getDescription());
        if (request.getUnit() != null) definition.setUnit(request.getUnit());
        if (request.getFrequency() != null) definition.setFrequency(request.getFrequency());

        definition.setUpdatedAt(Instant.now());

        return kpiMapper.toResponse(kpiDefinitionRepository.save(definition));
    }

    @Override
    public void delete(Long kpiId) {
        requireAuthenticated();

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));

        Long userId = requestContext.getUserId();
        String userRole = requestContext.getUserRole();

        if (userId == null || (!userId.equals(definition.getOwnerId()) && !"ADMIN".equals(userRole))) {
            throw new AccessDeniedException("Only the owner or admin can delete this KPI");
        }

        kpiDefinitionRepository.deleteById(kpiId);
    }

    private AuthUserClient.UserSummary loadCurrentUserSummary(Long currentUserId) {
        if (currentUserId == null) {
            return null; // ✅ FIX
        }

        List<AuthUserClient.UserSummary> summaries =
                authUserClient.getUsersSummary(List.of(currentUserId));

        return summaries.stream()
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null); // ✅ FIX
    }

    private Map<Long, AuthUserClient.UserSummary> loadUserSummaries(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        List<AuthUserClient.UserSummary> summaries =
                authUserClient.getUsersSummary(userIds);

        return summaries.stream()
                .filter(Objects::nonNull)
                .filter(summary -> summary.id != null)
                .collect(Collectors.toMap(
                        summary -> summary.id,
                        summary -> summary,
                        (left, right) -> left
                ));
    }

    private boolean isVisibleToCurrentUser(KpiDefinition definition,
                                           Long currentUserId,
                                           String currentRole,
                                           AuthUserClient.UserSummary currentUser,
                                           Map<Long, AuthUserClient.UserSummary> ownersById) {

        if ("ADMIN".equals(currentRole)) return true;
        if (currentUserId == null) return false;

        if (Objects.equals(definition.getOwnerId(), currentUserId)) return true;

        AuthUserClient.UserSummary owner = ownersById.get(definition.getOwnerId());
        if (owner == null || owner.role == null) return false;

        if ("MANAGER".equals(currentRole)) {
            return "MEMBER".equalsIgnoreCase(owner.role)
                    && Objects.equals(owner.managerId, currentUserId);
        }

        if ("MEMBER".equals(currentRole)) {
            return "MEMBER".equalsIgnoreCase(owner.role)
                    && currentUser != null
                    && currentUser.managerId != null
                    && Objects.equals(owner.managerId, currentUser.managerId);
        }

        return false;
    }

    private void requireAuthenticated() {
        if (requestContext.getUserId() == null || requestContext.getUserRole() == null) {
            throw new AccessDeniedException("Missing authentication headers");
        }
    }
}
