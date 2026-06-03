package com.laerdal.okpi.objective.service.impl;

import com.laerdal.okpi.objective.dto.request.CreateObjectiveRequest;
import com.laerdal.okpi.objective.dto.request.UpdateObjectiveRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveDetailResponse;
import com.laerdal.okpi.objective.dto.response.ObjectiveResponse;
import com.laerdal.okpi.objective.dto.response.OkrDashboardResponse;
import com.laerdal.okpi.objective.dto.response.PagedResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.entity.Notification;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.entity.ObjectiveAssignee;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

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
    private final AuthNotificationClient authNotificationClient;
    private final AuthUserClient authUserClient;

    @Override
    @Transactional
    public ObjectiveResponse create(CreateObjectiveRequest request, Long userId, String userRole) {
        requireAuthenticated(userId, userRole);
        if (!(isManager(userRole) || isAdmin(userRole))) {
            throw new AccessDeniedException("Only managers and admins can create objectives");
        }

        List<Long> assignees = request.getAssigneeIds() == null
                ? List.of()
                : request.getAssigneeIds().stream().filter(Objects::nonNull).distinct().toList();
        validateObjectiveAssignees(userId, userRole, loadUserSummaries(assignees).values().stream().toList());

        Objective objective = objectiveMapper.toEntity(request);
        objective.setOwnerId(userId);
        objective = objectiveRepository.save(objective);

        if (!assignees.isEmpty()) {
            for (Long uid : assignees) {
                objective.getAssignees().add(new ObjectiveAssignee(uid, objective));
                notify(uid, "You have been assigned a new goal: " + objective.getTitle());
            }
            objective = objectiveRepository.save(objective);
        }

        return objectiveMapper.toResponse(objective);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ObjectiveResponse> getAllForCurrentUser() {
        Long userId = requestContext.getUserId();
        if (userId == null) return Collections.emptyList();
        return objectiveRepository.findAllVisibleToUser(userId)
                .stream()
                .map(objectiveMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<ObjectiveResponse> list(int page, int size, String status,
                                                 Long ownerId, String search) {
        requireAuthenticated(requestContext.getUserId(), requestContext.getUserRole());

        Pageable pageable = PageRequest.of(page, size,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        ObjectiveStatus normalizedStatus = (status == null || status.isBlank())
                ? null
                : ObjectiveStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));

        Long userId = requestContext.getUserId();
        String role = requestContext.getUserRole();

        Page<Objective> pageResult = isManager(role)
                ? objectiveRepository.findAssignedOrOwnedWithFilters(
                userId, normalizedStatus, search, pageable)
                : objectiveRepository.findVisibleWithFilters(
                normalizedStatus, ownerId, search, pageable);

        return new PagedResponse<>(
                pageResult.getContent().stream().map(objectiveMapper::toResponse).toList(),
                page, size,
                pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                pageResult.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ObjectiveDetailResponse getById(Long objectiveId, Long userId, String userRole) {
        requireAuthenticated(userId, userRole);

        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        if (isMember(userRole) && !canView(objective, userId)) {
            throw new AccessDeniedException(
                    "Members can only view assigned or owned objectives");
        }

        List<KeyResultResponse> keyResults = objective.getKeyResults()
                .stream().map(keyResultMapper::toResponse).toList();
        return ObjectiveDetailResponse.builder()
                .objective(objectiveMapper.toResponse(objective))
                .keyResults(keyResults)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OkrDashboardResponse dashboard(Long ownerId) {
        requireAuthenticated(requestContext.getUserId(), requestContext.getUserRole());

        String role = requestContext.getUserRole();
        Long userId = requestContext.getUserId();

        List<Objective> objectives;
        if (isAdmin(role)) {
            objectives = ownerId != null
                    ? objectiveRepository.findAll().stream()
                      .filter(o -> o.getOwnerId().equals(ownerId)).toList()
                    : objectiveRepository.findAll();
        } else {
            objectives = objectiveRepository.findAll().stream()
                    .filter(obj ->
                            obj.getOwnerId().equals(userId) ||
                                    obj.getAssignees().stream().anyMatch(a -> userId.equals(a.getUserId()))
                    ).toList();
        }

        return OkrDashboardResponse.builder()
                .objectiveCount(objectives.size())
                .keyResultCount(objectives.stream()
                        .flatMap(o -> o.getKeyResults().stream()).count())
                .objectives(objectives.stream()
                        .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                        .limit(20)
                        .map(objectiveMapper::toResponse)
                        .toList())
                .build();
    }

    @Override
    @Transactional
    public ObjectiveResponse update(Long objectiveId, UpdateObjectiveRequest request) {
        requireAuthenticated(requestContext.getUserId(), requestContext.getUserRole());

        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireOwnerOrAdmin(objective);

        ObjectiveStatus previousStatus = objective.getStatus();

        if (request.getTitle() != null) objective.setTitle(request.getTitle());
        if (request.getDescription() != null) objective.setDescription(request.getDescription());
        if (request.getStatus() != null) objective.setStatus(request.getStatus());

        Objective saved = objectiveRepository.save(objective);

        if (request.getStatus() != null && request.getStatus() != previousStatus) {
            fireStatusChangeNotifications(saved, previousStatus, request.getStatus());
        }

        return objectiveMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long objectiveId) {
        requireAuthenticated(requestContext.getUserId(), requestContext.getUserRole());

        Objective obj = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireOwnerOrAdmin(obj);
        obj.setDeleted(true);
        objectiveRepository.save(obj);
    }

    private void fireStatusChangeNotifications(Objective objective,
                                               ObjectiveStatus previous,
                                               ObjectiveStatus next) {
        String title = objective.getTitle();
        if (next == ObjectiveStatus.COMPLETED) {
            String msg = "Goal \"" + title + "\" has been marked complete.";
            notifyAdmins(msg);
            notify(objective.getOwnerId(), msg);
        } else if (next == ObjectiveStatus.AT_RISK || next == ObjectiveStatus.OFF_TRACK) {
            String msg = "Goal \"" + title + "\" is now "
                    + next.name().replace("_", " ").toLowerCase() + " - needs attention.";
            notifyAdmins(msg);
            notify(objective.getOwnerId(), msg);
        }
    }

    private void notifyAdmins(String message) {
        try {
            authUserClient.getUsersByRole("ADMIN")
                    .forEach(admin -> notify(admin.id, message));
        } catch (Exception e) {
            log.warn("Could not fetch admins for notification: {}", e.getMessage());
        }
    }

    private void notify(Long userId, String message) {
        if (userId == null) return;
        notificationRepository.save(Notification.builder()
                .userId(userId)
                .message(message)
                .read(false)
                .createdAt(Instant.now())
                .build());
        authNotificationClient.createNotifications(Map.of(userId, message));
    }

    private Map<Long, AuthUserClient.UserSummary> loadUserSummaries(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }

        List<AuthUserClient.UserSummary> summaries = authUserClient.getUsersSummary(userIds);
        Map<Long, AuthUserClient.UserSummary> byId = summaries.stream()
                .filter(Objects::nonNull)
                .filter(summary -> summary.id != null)
                .collect(Collectors.toMap(summary -> summary.id, summary -> summary, (left, right) -> left));

        if (byId.size() != userIds.size()) {
            throw new ResourceNotFoundException("One or more assignees were not found");
        }

        return byId;
    }

    private void validateObjectiveAssignees(Long userId, String userRole, List<AuthUserClient.UserSummary> assignees) {
        if (assignees == null || assignees.isEmpty()) {
            return;
        }

        if (isAdmin(userRole)) {
            for (AuthUserClient.UserSummary assignee : assignees) {
                if (!"MANAGER".equalsIgnoreCase(assignee.role)) {
                    throw new AccessDeniedException("Admins can only assign goals to managers");
                }
            }
            return;
        }

        if (isManager(userRole)) {
            for (AuthUserClient.UserSummary assignee : assignees) {
                if (!"MEMBER".equalsIgnoreCase(assignee.role)) {
                    throw new AccessDeniedException("Managers can only assign goals to members");
                }
                if (!Objects.equals(assignee.managerId, userId)) {
                    throw new AccessDeniedException("Managers can only assign goals to their team members");
                }
            }
        }
    }

    private void requireAuthenticated(Long userId, String userRole) {
        if (userId == null || userRole == null) {
            throw new AccessDeniedException("Missing authentication headers");
        }
    }

    private boolean canView(Objective obj, Long userId) {
        if (userId == null) return false;
        if (userId.equals(obj.getOwnerId())) return true;
        return obj.getAssignees().stream().anyMatch(a -> userId.equals(a.getUserId()));
    }

    private void requireOwnerOrAdmin(Objective obj) {
        String role = requestContext.getUserRole();
        if (isAdmin(role) || isManager(role)) return;
        if (!requestContext.getUserId().equals(obj.getOwnerId())) {
            throw new AccessDeniedException("Not allowed");
        }
    }

    private static boolean isAdmin(String role) { return "ADMIN".equals(role); }
    private static boolean isManager(String role) { return "MANAGER".equals(role); }
    private static boolean isMember(String role) { return "MEMBER".equals(role); }
}
