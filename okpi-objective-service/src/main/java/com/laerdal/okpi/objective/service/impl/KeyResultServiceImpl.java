package com.laerdal.okpi.objective.service.impl;

import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.entity.Notification;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.exception.AccessDeniedException;
import com.laerdal.okpi.objective.exception.ResourceNotFoundException;
import com.laerdal.okpi.objective.mapper.KeyResultMapper;
import com.laerdal.okpi.objective.repository.KeyResultRepository;
import com.laerdal.okpi.objective.repository.NotificationRepository;
import com.laerdal.okpi.objective.repository.ObjectiveRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.KeyResultService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class KeyResultServiceImpl implements KeyResultService {

    private final KeyResultRepository keyResultRepository;
    private final ObjectiveRepository objectiveRepository;
    private final KeyResultMapper keyResultMapper;
    private final RequestContext requestContext;
    private final NotificationRepository notificationRepository;
    private final AuthNotificationClient authNotificationClient;

    public KeyResultServiceImpl(KeyResultRepository keyResultRepository,
                                ObjectiveRepository objectiveRepository,
                                KeyResultMapper keyResultMapper,
                                RequestContext requestContext,
                                NotificationRepository notificationRepository,
                                AuthNotificationClient authNotificationClient) {
        this.keyResultRepository = keyResultRepository;
        this.objectiveRepository = objectiveRepository;
        this.keyResultMapper = keyResultMapper;
        this.requestContext = requestContext;
        this.notificationRepository = notificationRepository;
        this.authNotificationClient = authNotificationClient;
    }

    @Override
    @Transactional
    public KeyResultResponse create(Long objectiveId, CreateKeyResultRequest request) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireOwnerOrAdmin(objective);

        BigDecimal startValue = request.getStartValue() != null
                ? request.getStartValue() : BigDecimal.ZERO;
        BigDecimal targetValue = request.getTargetValue() != null
                ? request.getTargetValue() : BigDecimal.valueOf(100);

        KeyResult keyResult = KeyResult.builder()
                .objective(objective)
                .title(request.getTitle())
                .description(request.getDescription())
                .metricType(request.getMetricType())
                .startValue(startValue)
                .currentValue(startValue)
                .targetValue(targetValue)
                .status(KeyResultStatus.NOT_STARTED)
                .updatedByUserId(requestContext.getUserId())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        KeyResult saved = keyResultRepository.save(keyResult);
        recalculateObjectiveProgress(objective);

        // Notify all assignees of this objective that a new key result was added
        String msg = "A new key result has been added to goal \""
                + objective.getTitle() + "\": " + request.getTitle();
        objective.getAssignees().forEach(assignee -> {
            if (assignee.getUserId() != null) {
                notify(assignee.getUserId(), msg);
            }
        });

        return keyResultMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<KeyResultResponse> getByObjectiveId(Long objectiveId) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireViewer(objective);
        return keyResultRepository.findAllByObjective_Id(objectiveId).stream()
                .map(keyResultMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public KeyResultResponse update(Long keyResultId, UpdateKeyResultRequest request) {
        requireAuthenticated();
        KeyResult keyResult = keyResultRepository.findById(keyResultId)
                .orElseThrow(() -> new ResourceNotFoundException("Key result not found"));
        Objective objective = keyResult.getObjective();
        boolean canManage = canManage(objective);
        boolean canUpdateProgress = canManage || isAssignedToObjective(objective);
        if (!canUpdateProgress) {
            throw new AccessDeniedException(
                    "Only the owner, admin, or assigned users can update this key result");
        }
        if (!canManage && (request.getTitle() != null
                || request.getDescription() != null
                || request.getTargetValue() != null)) {
            throw new AccessDeniedException(
                    "Assigned members can only update progress and status");
        }
        if (canManage && request.getTitle() != null) keyResult.setTitle(request.getTitle());
        if (canManage && request.getDescription() != null)
            keyResult.setDescription(request.getDescription());
        if (request.getCurrentValue() != null) keyResult.setCurrentValue(request.getCurrentValue());
        if (canManage && request.getTargetValue() != null)
            keyResult.setTargetValue(request.getTargetValue());
        if (request.getStatus() != null) keyResult.setStatus(request.getStatus());
        keyResult.setUpdatedByUserId(requestContext.getUserId());
        keyResult.setUpdatedAt(Instant.now());
        KeyResult saved = keyResultRepository.save(keyResult);
        recalculateObjectiveProgress(saved.getObjective());
        return keyResultMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void delete(Long keyResultId) {
        KeyResult keyResult = keyResultRepository.findById(keyResultId)
                .orElseThrow(() -> new ResourceNotFoundException("Key result not found"));
        requireOwnerOrAdmin(keyResult.getObjective());
        Objective objective = keyResult.getObjective();
        keyResultRepository.delete(keyResult);
        recalculateObjectiveProgress(objective);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void notify(Long userId, String message) {
        notificationRepository.save(Notification.builder()
                .userId(userId)
                .message(message)
                .read(false)
                .createdAt(Instant.now())
                .build());
        authNotificationClient.createNotifications(java.util.Map.of(userId, message));
    }

    private void requireAuthenticated() {
        if (requestContext.getUserId() == null || requestContext.getUserRole() == null) {
            throw new AccessDeniedException("Missing authentication headers");
        }
    }

    private void requireOwnerOrAdmin(Objective objective) {
        requireAuthenticated();
        if (!canManage(objective)) {
            throw new AccessDeniedException(
                    "Only the owner or admin can modify this objective");
        }
    }

    private void requireViewer(Objective objective) {
        requireAuthenticated();
        if (canManage(objective) || isAssignedToObjective(objective)) return;
        throw new AccessDeniedException(
                "Only the owner, admin, or assigned users can view this objective");
    }

    private boolean canManage(Objective objective) {
        String role = requestContext.getUserRole();
        if ("ADMIN".equals(role) || "MANAGER".equals(role)) return true;
        return requestContext.getUserId() != null
                && requestContext.getUserId().equals(objective.getOwnerId());
    }

    private boolean isAssignedToObjective(Objective objective) {
        Long userId = requestContext.getUserId();
        return userId != null && objective.getAssignees().stream()
                .anyMatch(a -> userId.equals(a.getUserId()));
    }

    private void recalculateObjectiveProgress(Objective objective) {
        List<KeyResult> keyResults =
                keyResultRepository.findAllByObjective_Id(objective.getId());
        objective.setProgressPercentage(calculateProgress(keyResults));
        objectiveRepository.save(objective);
    }

    private BigDecimal calculateProgress(List<KeyResult> keyResults) {
        if (keyResults.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = BigDecimal.ZERO;
        for (KeyResult kr : keyResults) {
            BigDecimal start = kr.getStartValue() == null ? BigDecimal.ZERO : kr.getStartValue();
            BigDecimal current = kr.getCurrentValue() == null
                    ? BigDecimal.ZERO : kr.getCurrentValue();
            BigDecimal target = kr.getTargetValue() == null
                    ? BigDecimal.ZERO : kr.getTargetValue();
            BigDecimal denom = target.subtract(start);
            BigDecimal ratio;
            if (denom.compareTo(BigDecimal.ZERO) == 0) {
                ratio = current.compareTo(target) >= 0 ? BigDecimal.ONE : BigDecimal.ZERO;
            } else {
                ratio = current.subtract(start)
                        .divide(denom, 6, java.math.RoundingMode.HALF_UP);
            }
            ratio = ratio.max(BigDecimal.ZERO).min(BigDecimal.ONE);
            sum = sum.add(ratio);
        }
        return sum.divide(BigDecimal.valueOf(keyResults.size()), 6,
                        java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
