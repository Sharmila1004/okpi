package com.laerdal.okpi.kpi.service.impl;

import com.laerdal.okpi.kpi.dto.request.CreateKpiEntryRequest;
import com.laerdal.okpi.kpi.dto.response.KpiEntryResponse;
import com.laerdal.okpi.kpi.entity.KpiDefinition;
import com.laerdal.okpi.kpi.entity.KpiEntry;
import com.laerdal.okpi.kpi.exception.AccessDeniedException;
import com.laerdal.okpi.kpi.exception.ResourceNotFoundException;
import com.laerdal.okpi.kpi.mapper.KpiEntryMapper;
import com.laerdal.okpi.kpi.repository.KpiDefinitionRepository;
import com.laerdal.okpi.kpi.repository.KpiEntryRepository;
import com.laerdal.okpi.kpi.security.RequestContext;
import com.laerdal.okpi.kpi.service.KpiEntryService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class KpiEntryServiceImpl implements KpiEntryService {

    private final KpiEntryRepository kpiEntryRepository;
    private final KpiDefinitionRepository kpiDefinitionRepository;
    private final KpiEntryMapper kpiEntryMapper;
    private final RequestContext requestContext;
    private final AuthUserClient authUserClient;

    public KpiEntryServiceImpl(KpiEntryRepository kpiEntryRepository,
                               KpiDefinitionRepository kpiDefinitionRepository,
                               KpiEntryMapper kpiEntryMapper,
                               RequestContext requestContext,
                               AuthUserClient authUserClient) {
        this.kpiEntryRepository = kpiEntryRepository;
        this.kpiDefinitionRepository = kpiDefinitionRepository;
        this.kpiEntryMapper = kpiEntryMapper;
        this.requestContext = requestContext;
        this.authUserClient = authUserClient;
    }

    @Override
    public KpiEntryResponse create(Long kpiId, CreateKpiEntryRequest request) {
        requireAuthenticated();

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));
        if (!canView(definition)) {
            throw new AccessDeniedException("You do not have access to this insight");
        }

        KpiEntry entry = KpiEntry.builder()
                .kpiDefinition(definition)
                .value(request.getValue())
                .recordedAt(request.getRecordedAt().atStartOfDay(ZoneOffset.UTC).toInstant())
                .note(request.getNote())
                .createdAt(Instant.now())
                .build();

        return kpiEntryMapper.toResponse(kpiEntryRepository.save(entry));
    }

    @Override
    public List<KpiEntryResponse> getByKpiId(Long kpiId) {
        requireAuthenticated();

        KpiDefinition definition = kpiDefinitionRepository.findById(kpiId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI not found"));
        if (!canView(definition)) {
            throw new AccessDeniedException("You do not have access to this insight");
        }

        return kpiEntryRepository.findAllByKpiDefinition_Id(kpiId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(kpiEntryMapper::toResponse)
                .toList();
    }

    @Override
    public void delete(Long entryId) {
        requireAuthenticated();

        KpiEntry entry = kpiEntryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("KPI entry not found"));
        if (!canManage(entry.getKpiDefinition())) {
            throw new AccessDeniedException("Only the owner or admin can delete this KPI entry");
        }

        kpiEntryRepository.deleteById(entryId);
    }

    private boolean canView(KpiDefinition definition) {
        Long currentUserId = requestContext.getUserId();
        String currentRole = requestContext.getUserRole();
        if ("ADMIN".equals(currentRole)) {
            return true;
        }
        if (currentUserId == null) {
            return false;
        }
        if (Objects.equals(definition.getOwnerId(), currentUserId)) {
            return true;
        }

        AuthUserClient.UserSummary currentUser = loadCurrentUserSummary(currentUserId);
        AuthUserClient.UserSummary owner = loadOwnerSummary(definition.getOwnerId());
        if (owner == null || owner.role == null) {
            return false;
        }

        if ("MANAGER".equals(currentRole)) {
            return "MEMBER".equalsIgnoreCase(owner.role)
                    && Objects.equals(owner.managerId, currentUserId);
        }

        if ("MEMBER".equals(currentRole)) {
            return "MEMBER".equalsIgnoreCase(owner.role)
                    && currentUser.managerId != null
                    && Objects.equals(owner.managerId, currentUser.managerId);
        }

        return false;
    }

    private boolean canManage(KpiDefinition definition) {
        String currentRole = requestContext.getUserRole();
        Long currentUserId = requestContext.getUserId();
        return "ADMIN".equals(currentRole)
                || (currentUserId != null && currentUserId.equals(definition.getOwnerId()));
    }

    private AuthUserClient.UserSummary loadCurrentUserSummary(Long currentUserId) {
        return loadUserSummary(currentUserId);
    }

    private AuthUserClient.UserSummary loadOwnerSummary(Long ownerId) {
        return loadUserSummary(ownerId);
    }

    private AuthUserClient.UserSummary loadUserSummary(Long userId) {
        if (userId == null) {
            return null;
        }

        List<AuthUserClient.UserSummary> summaries = authUserClient.getUsersSummary(List.of(userId));
        return summaries.stream().filter(Objects::nonNull).findFirst().orElse(null);
    }

    private void requireAuthenticated() {
        if (requestContext.getUserId() == null || requestContext.getUserRole() == null) {
            throw new AccessDeniedException("Missing authentication headers");
        }
    }
}
