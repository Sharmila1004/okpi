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
        Page<Objective> objectivePage = objectiveRepository.findWithFilters(
                normalizedStatus, ownerId, search, pageable);
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
        Long userId = requestContext.getUserId() != null ? requestContext.getUserId() : 0L;
        return objectiveRepository.findAllByOwnerIdAndIsDeletedFalse(userId).stream()
                .map(objectiveMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ObjectiveDetailResponse getById(Long objectiveId) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

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

        if (request.getTitle() != null) {
            objective.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            objective.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            objective.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            objective.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            objective.setEndDate(request.getEndDate());
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
        Long effectiveOwnerId = ownerId != null ? ownerId : requestContext.getUserId();

        long objectiveCount = effectiveOwnerId == null
                ? objectiveRepository.findWithFilters(null, null, null, PageRequest.of(0, 1)).getTotalElements()
                : objectiveRepository.countByOwnerId(effectiveOwnerId);
        long keyResultCount = keyResultRepository.countForDashboard(effectiveOwnerId);

        List<ObjectiveResponse> objectives = (effectiveOwnerId == null
                ? objectiveRepository.findWithFilters(null, null, null,
                    PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent()
                : objectiveRepository.findWithFilters(null, effectiveOwnerId, null,
                    PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"))).getContent())
                .stream()
                .map(objectiveMapper::toResponse)
                .toList();

        return OkrDashboardResponse.builder()
                .objectiveCount(objectiveCount)
                .keyResultCount(keyResultCount)
                .objectives(objectives)
                .build();
    }

    private void requireOwnerOrAdmin(Objective objective) {
        Long userId = requestContext.getUserId();
        String role = requestContext.getUserRole();
        if (userId == null || role == null) {
            throw new AccessDeniedException("Missing authentication headers");
        }
        if ("ADMIN".equals(role)) {
            return;
        }
        if (!userId.equals(objective.getOwnerId())) {
            throw new AccessDeniedException("Only the owner or admin can modify this objective");
        }
    }
}
