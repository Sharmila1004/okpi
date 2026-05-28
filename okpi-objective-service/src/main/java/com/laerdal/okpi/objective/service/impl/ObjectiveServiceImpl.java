package com.laerdal.okpi.objective.service.impl;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.request.UpdateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveDetailResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.dto.response.OkrDashboardResponse;
import com.laerdal.okpi.objective.dto.response.PagedResponse;
import com.laerdal.okpi.objective.entity.Notification;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import com.laerdal.okpi.objective.exception.AccessDeniedException;
import com.laerdal.okpi.objective.exception.ResourceNotFoundException;
import com.laerdal.okpi.objective.mapper.KeyResultMapper;
import com.laerdal.okpi.objective.mapper.ObjectiveMapper;
import com.laerdal.okpi.objective.repository.KeyResultRepository;
import com.laerdal.okpi.objective.repository.NotificationRepository;
import com.laerdal.okpi.objective.repository.ObjectiveRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.ObjectiveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
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
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public ObjectiveResponse create(CreateObjectiveRequest request, Long userId, String userRole) {
        if (!("MANAGER".equals(userRole) || "ADMIN".equals(userRole))) {
            throw new AccessDeniedException("Only managers and admins can create objectives");
        }

        log.info("Incoming assignees: {}", request.getAssigneeIds());

        Objective objective = objectiveMapper.toEntity(request);
        objective.setOwnerId(userId);
        objective = objectiveRepository.save(objective);

        List<Long> assignees = request.getAssigneeIds();

        if (assignees != null && !assignees.isEmpty()) {
            for (Long uid : assignees) {

                if (uid == null) continue;

                // assign user
                objective.getAssignees().add(
                        new com.laerdal.okpi.objective.entity.ObjectiveAssignee(uid, objective)
                );

                // notification
                Notification notification = Notification.builder()
                        .userId(uid)
                        .message("You have been assigned Objective: " + objective.getTitle())
                        .read(false)
                        .createdAt(Instant.now())
                        .build();

                notificationRepository.save(notification);

                log.info("Notification saved for user {}", uid);
            }

            objective = objectiveRepository.save(objective);
        } else {
            log.warn("No assignees received — notifications skipped");
        }

        return objectiveMapper.toResponse(objective);
    }

    // REQUIRED METHOD (FIXES YOUR ERROR)
    @Override
    @Transactional(readOnly = true)
    public List<ObjectiveResponse> getAllForCurrentUser() {

        Long userId = requestContext.getUserId();

        if (userId == null) {
            return java.util.Collections.emptyList();
        }

        return objectiveRepository.findAllVisibleToUser(userId)
                .stream()
                .map(objectiveMapper::toResponse)
                .toList();
    }

    // LIST
    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ObjectiveResponse> list(int page, int size, String status, Long ownerId, String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        ObjectiveStatus normalizedStatus = status == null || status.isBlank()
                ? null
                : ObjectiveStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));

        Long userId = requestContext.getUserId();
        String role = requestContext.getUserRole();

        Page<Objective> pageResult = "MEMBER".equals(role)
                ? objectiveRepository.findAssignedOrOwnedWithFilters(userId, normalizedStatus, search, pageable)
                : objectiveRepository.findVisibleWithFilters(normalizedStatus, ownerId, search, pageable);

        List<ObjectiveResponse> content = pageResult.getContent()
                .stream()
                .map(objectiveMapper::toResponse)
                .toList();

        return new PagedResponse<>(
                content,
                page,
                size,
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isLast()
        );
    }

    // GET ONE
    @Override
    @Transactional(readOnly = true)
    public ObjectiveDetailResponse getById(Long objectiveId, Long userId, String userRole) {

        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

        if ("MEMBER".equals(userRole) && !canView(objective, userId)) {
            throw new AccessDeniedException("Members can only view assigned or owned objectives");
        }

        List<KeyResultResponse> keyResults = objective.getKeyResults()
                .stream()
                .map(keyResultMapper::toResponse)
                .toList();

        return ObjectiveDetailResponse.builder()
                .objective(objectiveMapper.toResponse(objective))
                .keyResults(keyResults)
                .build();
    }

    // DASHBOARD
    @Override
    @Transactional(readOnly = true)
    public OkrDashboardResponse dashboard(Long ownerId) {

        String role = requestContext.getUserRole();
        Long userId = requestContext.getUserId();

        List<Objective> objectives = "ADMIN".equals(role)
                ? objectiveRepository.findAll()
                : objectiveRepository.findAll().stream()
                  .filter(obj ->
                          obj.getOwnerId().equals(userId) ||
                                  obj.getAssignees().stream().anyMatch(a -> userId.equals(a.getUserId()))
                  )
                  .toList();

        return OkrDashboardResponse.builder()
                .objectiveCount(objectives.size())
                .keyResultCount(objectives.stream().flatMap(o -> o.getKeyResults().stream()).count())
                .objectives(objectives.stream()
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .limit(10)
                        .map(objectiveMapper::toResponse)
                        .toList())
                .build();
    }

    // UPDATE
    @Override
    @Transactional
    public ObjectiveResponse update(Long objectiveId, UpdateObjectiveRequest request) {

        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

        requireOwnerOrAdmin(objective);

        if (request.getTitle() != null) objective.setTitle(request.getTitle());
        if (request.getDescription() != null) objective.setDescription(request.getDescription());
        if (request.getStatus() != null) objective.setStatus(request.getStatus());

        return objectiveMapper.toResponse(objectiveRepository.save(objective));
    }

    // DELETE
    @Override
    @Transactional
    public void delete(Long objectiveId) {
        Objective obj = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));

        requireOwnerOrAdmin(obj);
        obj.setDeleted(true);
        objectiveRepository.save(obj);
    }

    // HELPERS
    private boolean canView(Objective obj, Long userId) {
        if (userId == null) return false;
        if (userId.equals(obj.getOwnerId())) return true;
        return obj.getAssignees().stream().anyMatch(a -> userId.equals(a.getUserId()));
    }

    private void requireOwnerOrAdmin(Objective obj) {
        String role = requestContext.getUserRole();
        if ("ADMIN".equals(role) || "MANAGER".equals(role)) return;

        if (!requestContext.getUserId().equals(obj.getOwnerId())) {
            throw new AccessDeniedException("Not allowed");
        }
    }
}
