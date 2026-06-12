package com.laerdal.okpi.objective.service.impl;

import com.laerdal.okpi.objective.dto.request.CreateKeyResultRequest;
import com.laerdal.okpi.objective.dto.request.UpdateKeyResultRequest;
import com.laerdal.okpi.objective.dto.response.JiraIssueDto;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.entity.JiraIssue;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.entity.KrJiraMapping;
import com.laerdal.okpi.objective.entity.Notification;
import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.exception.AccessDeniedException;
import com.laerdal.okpi.objective.exception.ResourceNotFoundException;
import com.laerdal.okpi.objective.mapper.KeyResultMapper;
import com.laerdal.okpi.objective.repository.JiraIssueRepository;
import com.laerdal.okpi.objective.repository.KeyResultRepository;
import com.laerdal.okpi.objective.repository.KrJiraMappingRepository;
import com.laerdal.okpi.objective.repository.NotificationRepository;
import com.laerdal.okpi.objective.repository.ObjectiveRepository;
import com.laerdal.okpi.objective.security.RequestContext;
import com.laerdal.okpi.objective.service.KeyResultService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * CHANGED from previous version:
 *  - calculateProgress(...) now uses the average Jira ticket progress for any KR
 *    that has linked tickets in kr_jira_mapping, instead of the manual
 *    currentValue/targetValue ratio. KRs with no linked tickets still use the
 *    manual ratio as before.
 *  - This makes the Objective's overall progressPercentage (shown on the
 *    Dashboard) match what's shown on the Objective Detail page ("from Jira" %).
 *  - getByObjectiveId now ALSO triggers recalculateObjectiveProgress so that
 *    simply opening/viewing a goal refreshes the stored objective progress —
 *    useful because your KR 1.4 currentValue was set directly via SQL and
 *    never went through recalculation.
 */
@Service
public class KeyResultServiceImpl implements KeyResultService {

    private final KeyResultRepository keyResultRepository;
    private final ObjectiveRepository objectiveRepository;
    private final KeyResultMapper keyResultMapper;
    private final RequestContext requestContext;
    private final NotificationRepository notificationRepository;
    private final AuthNotificationClient authNotificationClient;
    private final KrJiraMappingRepository krJiraMappingRepository;
    private final JiraIssueRepository jiraIssueRepository;

    public KeyResultServiceImpl(
            KeyResultRepository keyResultRepository,
            ObjectiveRepository objectiveRepository,
            KeyResultMapper keyResultMapper,
            RequestContext requestContext,
            NotificationRepository notificationRepository,
            AuthNotificationClient authNotificationClient,
            KrJiraMappingRepository krJiraMappingRepository,
            JiraIssueRepository jiraIssueRepository) {
        this.keyResultRepository = keyResultRepository;
        this.objectiveRepository = objectiveRepository;
        this.keyResultMapper = keyResultMapper;
        this.requestContext = requestContext;
        this.notificationRepository = notificationRepository;
        this.authNotificationClient = authNotificationClient;
        this.krJiraMappingRepository = krJiraMappingRepository;
        this.jiraIssueRepository = jiraIssueRepository;
    }

    // ── Public API ─────────────────────────────────────────────────────────

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

        String msg = "A new key result has been added to goal \""
                + objective.getTitle() + "\": " + request.getTitle();
        objective.getAssignees().forEach(assignee -> {
            if (assignee.getUserId() != null) {
                notify(assignee.getUserId(), msg);
            }
        });

        return keyResultMapper.toResponse(saved, resolveJiraIssues(saved.getId()));
    }

    @Override
    @Transactional
    public List<KeyResultResponse> getByObjectiveId(Long objectiveId) {
        Objective objective = objectiveRepository.findByIdAndIsDeletedFalse(objectiveId)
                .orElseThrow(() -> new ResourceNotFoundException("Objective not found"));
        requireViewer(objective);

        // CHANGED: refresh the stored objective progress every time the goal is
        // viewed, so Jira-derived progress on KRs is reflected on the Dashboard
        // without requiring an explicit "edit and save" action.
        recalculateObjectiveProgress(objective);

        return keyResultRepository.findAllByObjective_Id(objectiveId).stream()
                .map(kr -> keyResultMapper.toResponse(kr, resolveJiraIssues(kr.getId())))
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

        return keyResultMapper.toResponse(saved, resolveJiraIssues(saved.getId()));
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

    // ── Jira helper ────────────────────────────────────────────────────────

    private List<JiraIssueDto> resolveJiraIssues(Long krId) {
        List<String> issueKeys = krJiraMappingRepository.findAllByKrId(krId)
                .stream()
                .map(KrJiraMapping::getIssueKey)
                .toList();

        if (issueKeys.isEmpty()) {
            return List.of();
        }

        return jiraIssueRepository.findAllByIssueKeyIn(issueKeys)
                .stream()
                .map(ji -> JiraIssueDto.builder()
                        .issueKey(ji.getIssueKey())
                        .summary(ji.getSummary())
                        .status(ji.getStatus())
                        .progressPercent(ji.getProgressPercent())
                        .build())
                .toList();
    }

    /**
     * NEW: returns the average Jira progress (0-100) for a KR, or null if it
     * has no linked tickets / no tickets with a progress value.
     */
    private Integer resolveJiraProgressPercent(Long krId) {
        List<JiraIssueDto> issues = resolveJiraIssues(krId);
        long count = issues.stream().filter(i -> i.getProgressPercent() != null).count();
        if (count == 0) return null;
        int sum = issues.stream()
                .filter(i -> i.getProgressPercent() != null)
                .mapToInt(JiraIssueDto::getProgressPercent)
                .sum();
        return (int) Math.round((double) sum / count);
    }

    // ── Existing helpers ──────────────────────────────────────────────────

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

    /**
     * CHANGED: now also auto-derives objective.status from the recalculated
     * progress percentage (same thresholds used for KR computedStatus):
     *   100%   -> COMPLETED
     *   >= 70% -> ON_TRACK
     *   >= 30% -> AT_RISK
     *   <  30% -> OFF_TRACK
     *   0% and currently DRAFT -> stays DRAFT (goal not started yet)
     *
     * This means a goal that was sitting in "Draft" with manually-set KR
     * progress (e.g. via Jira tickets) will automatically move to
     * ON_TRACK / AT_RISK / etc. the next time its key results are viewed or
     * modified — no manual "publish" step required.
     */
    private void recalculateObjectiveProgress(Objective objective) {
        List<KeyResult> keyResults =
                keyResultRepository.findAllByObjective_Id(objective.getId());
        BigDecimal progress = calculateProgress(keyResults);
        objective.setProgressPercentage(progress);
        objective.setStatus(deriveObjectiveStatus(progress, objective.getStatus()));
        objectiveRepository.save(objective);
    }

    /** NEW: maps a 0-100 progress percentage to an ObjectiveStatus. */
    private com.laerdal.okpi.objective.enums.ObjectiveStatus deriveObjectiveStatus(
            BigDecimal progress,
            com.laerdal.okpi.objective.enums.ObjectiveStatus currentStatus) {

        if (progress == null) {
            return currentStatus;
        }

        int percent = progress.intValue();

        if (percent == 0) {
            // No progress yet — leave DRAFT goals as DRAFT, but don't force
            // an already-active goal back into DRAFT.
            return currentStatus == com.laerdal.okpi.objective.enums.ObjectiveStatus.DRAFT
                    ? com.laerdal.okpi.objective.enums.ObjectiveStatus.DRAFT
                    : com.laerdal.okpi.objective.enums.ObjectiveStatus.OFF_TRACK;
        }
        if (percent == 100) {
            return com.laerdal.okpi.objective.enums.ObjectiveStatus.COMPLETED;
        }
        if (percent >= 70) {
            return com.laerdal.okpi.objective.enums.ObjectiveStatus.ON_TRACK;
        }
        if (percent >= 30) {
            return com.laerdal.okpi.objective.enums.ObjectiveStatus.AT_RISK;
        }
        return com.laerdal.okpi.objective.enums.ObjectiveStatus.OFF_TRACK;
    }

    /**
     * CHANGED: For each KR, if it has linked Jira tickets, use the average
     * Jira progress (0-100) as its ratio. Otherwise fall back to the manual
     * currentValue/targetValue ratio, exactly as before.
     */
    private BigDecimal calculateProgress(List<KeyResult> keyResults) {
        if (keyResults.isEmpty()) return BigDecimal.ZERO;
        BigDecimal sum = BigDecimal.ZERO;
        for (KeyResult kr : keyResults) {
            BigDecimal ratio;

            Integer jiraPercent = resolveJiraProgressPercent(kr.getId());
            if (jiraPercent != null) {
                // Use Jira-derived progress (0-100 -> 0-1)
                ratio = BigDecimal.valueOf(jiraPercent)
                        .divide(BigDecimal.valueOf(100), 6, java.math.RoundingMode.HALF_UP);
            } else {
                BigDecimal start = kr.getStartValue() == null ? BigDecimal.ZERO : kr.getStartValue();
                BigDecimal current = kr.getCurrentValue() == null
                        ? BigDecimal.ZERO : kr.getCurrentValue();
                BigDecimal target = kr.getTargetValue() == null
                        ? BigDecimal.ZERO : kr.getTargetValue();
                BigDecimal denom = target.subtract(start);
                if (denom.compareTo(BigDecimal.ZERO) == 0) {
                    ratio = current.compareTo(target) >= 0 ? BigDecimal.ONE : BigDecimal.ZERO;
                } else {
                    ratio = current.subtract(start)
                            .divide(denom, 6, java.math.RoundingMode.HALF_UP);
                }
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
