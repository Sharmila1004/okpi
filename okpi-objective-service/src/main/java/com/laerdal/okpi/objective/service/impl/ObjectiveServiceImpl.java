package com.laerdal.okpi.objective.service.impl;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.request.UpdateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveDetailResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.dto.response.OkrDashboardResponse;
import com.laerdal.okpi.objective.dto.response.PagedResponse;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import com.laerdal.okpi.objective.exception.AccessDeniedException;
import com.laerdal.okpi.objective.exception.ResourceNotFoundException;
import com.laerdal.okpi.objective.mapper.KeyResultMapper;
import com.laerdal.okpi.objective.mapper.ObjectiveMapper;
import com.laerdal.okpi.objective.repository.KeyResultRepository;
import com.laerdal.okpi.objective.repository.ObjectiveRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.ObjectiveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class ObjectiveServiceImpl implements ObjectiveService {

    private final ObjectiveRepository objectiveRepository;
    private final ObjectiveMapper objectiveMapper;
    private final KeyResultMapper keyResultMapper;
    private final RequestContext requestContext;
    private final KeyResultRepository keyResultRepository;

    @Override
    @Transactional
    public ObjectiveResponse create(CreateObjectiveRequest request, Long userId, String userRole) {
        log.info("Creating objective '{}' for user {}", request.getTitle(), userId);

        if (!("MANAGER".equals(userRole) || "ADMIN".equals(userRole))) {
            throw new AccessDeniedException("Only managers and admins can create objectives");
        }

        Objective objective = objectiveMapper.toEntity(request);
        objective.setOwnerId(userId);
        objective = objectiveRepository.save(objective);

        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            for (Long uid : request.getAssigneeIds()) {
                if (uid == null) continue;
                objective.getAssignees().add(new com.laerdal.okpi.objective.entity.ObjectiveAssignee(uid, objective));
            }
            objective = objectiveRepository.save(objective);
        }

        log.info("Objective created with id {}", objective.getId());
        return objectiveMapper.toResponse(objective);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ObjectiveResponse> list(int page, int size, String status, Long ownerId, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        ObjectiveStatus normalizedStatus = status == null || status.isBlank()
                ? null
                : ObjectiveStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        Long userId = requestContext.getUserId();
        String userRole = requestContext.getUserRole();
        Page<Objective> objectivePage = "MEMBER".equals(userRole)
                ? objectiveRepository.findAssignedOrOwnedWithFilters(userId, normalizedStatus, search, pageable)
                : objectiveRepository.findVisibleWithFilters(normalizedStatus, ownerId, search, pageable);
        List<ObjectiveResponse> content = objectivePage.getContent().stream()
                .map(objectiveMapper::toResponse)
                .toList();
        return new PagedResponse<>(
                content,
                page,
                size,
                objectivePage.getTotalElements(),
                objectivePage.getTotalPages(),
                objectivePage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ObjectiveResponse> getAllForCurrentUser() {
        Long userId = requestContext.getUserId();
        if (userId == null) {
            return java.util.Collections.emptyList();
        }
        return objectiveRepository.findAllVisibleToUser(userId).stream()
                .map(objectiveMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ObjectiveDetailResponse getById(Long objectiveId, Long userId, String userRole) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

        if ("MEMBER".equals(userRole) && !canUserViewObjective(objective, userId)) {
            throw new AccessDeniedException("Members can only view assigned or owned objectives");
        }

        List<KeyResultResponse> keyResults = objective.getKeyResults().stream()
                .map(keyResultMapper::toResponse)
                .toList();

        return ObjectiveDetailResponse.builder()
                .objective(objectiveMapper.toResponse(objective))
                .keyResults(keyResults)
                .build();
    }

    @Override
    @Transactional
    public ObjectiveResponse update(Long objectiveId, UpdateObjectiveRequest request) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

        requireOwnerOrAdmin(objective);

        if (request.getTitle() != null) objective.setTitle(request.getTitle());
        if (request.getDescription() != null) objective.setDescription(request.getDescription());
        if (request.getStatus() != null) objective.setStatus(request.getStatus());
        if (request.getStartDate() != null) objective.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) objective.setEndDate(request.getEndDate());

        if (request.getAssigneeIds() != null) {
            objective.getAssignees().clear();
            for (Long uid : request.getAssigneeIds()) {
                if (uid == null) continue;
                objective.getAssignees().add(new com.laerdal.okpi.objective.entity.ObjectiveAssignee(uid, objective));
            }
        }

        return objectiveMapper.toResponse(objectiveRepository.save(objective));
    }

    @Override
    @Transactional
    public void delete(Long objectiveId) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireOwnerOrAdmin(objective);
        objective.setDeleted(true);
        objectiveRepository.save(objective);
    }

    @Override
    @Transactional(readOnly = true)
    public OkrDashboardResponse dashboard(Long ownerId) {
        String userRole = requestContext.getUserRole();
        Long userId = requestContext.getUserId();

        boolean isPrivileged = "ADMIN".equals(userRole) || "MANAGER".equals(userRole);
        Long effectiveOwnerId = ownerId != null ? ownerId : isPrivileged ? null : userId;

        long objectiveCount;
        long keyResultCount;
        List<ObjectiveResponse> objectives;

        if ("MEMBER".equals(userRole) && ownerId == null && userId != null) {
            objectiveCount = objectiveRepository.countVisibleToUser(userId);
            keyResultCount = keyResultRepository.countVisibleToUser(userId);
            objectives = objectiveRepository.findAssignedOrOwnedWithFilters(
                            userId, null, null,
                            PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")))
                    .getContent().stream()
                    .map(objectiveMapper::toResponse)
                    .toList();
        } else {
            objectiveCount = objectiveRepository
                    .findVisibleWithFilters(null, effectiveOwnerId, null, PageRequest.of(0, 1))
                    .getTotalElements();
            keyResultCount = keyResultRepository.countForDashboard(effectiveOwnerId);
            objectives = objectiveRepository
                    .findVisibleWithFilters(null, effectiveOwnerId, null,
                            PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")))
                    .getContent().stream()
                    .map(objectiveMapper::toResponse)
                    .toList();
        }

        return OkrDashboardResponse.builder()
                .objectiveCount(objectiveCount)
                .keyResultCount(keyResultCount)
                .objectives(objectives)
                .build();
    }

    private boolean canUserViewObjective(Objective objective, Long userId) {
        if (userId == null) return false;
        if (userId.equals(objective.getOwnerId())) return true;
        return objective.getAssignees().stream().anyMatch(a -> userId.equals(a.getUserId()));
    }

    private void requireOwnerOrAdmin(Objective objective) {
        Long userId = requestContext.getUserId();
        String role = requestContext.getUserRole();
        if (userId == null || role == null) throw new AccessDeniedException("Missing authentication headers");
        if ("ADMIN".equals(role) || "MANAGER".equals(role)) return;
        if (!userId.equals(objective.getOwnerId())) {
            throw new AccessDeniedException("Only the owner, manager, or admin can modify this objective");
        }
    }
}