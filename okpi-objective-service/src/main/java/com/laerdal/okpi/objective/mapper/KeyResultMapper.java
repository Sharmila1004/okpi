package com.laerdal.okpi.objective.mapper;

import com.laerdal.okpi.objective.dto.response.JiraIssueDto;
import com.laerdal.okpi.objective.dto.response.KeyResultResponse;
import com.laerdal.okpi.objective.entity.KeyResult;
import com.laerdal.okpi.objective.enums.KeyResultStatus;
import org.springframework.stereotype.Component;
import java.util.List;

/**
 * CHANGED:
 *  - toResponse now accepts jiraIssues and computes jiraProgressPercent + computedStatus
 *  - Status auto-logic:
 *      no tickets          → keep stored status
 *      avg == 100          → COMPLETED
 *      avg >= 70           → ON_TRACK
 *      avg >= 30           → AT_RISK
 *      avg <  30           → NOT_STARTED
 */
@Component
public class KeyResultMapper {

    /** 1-arg fallback — no Jira data, returns stored status unchanged. */
    public KeyResultResponse toResponse(KeyResult keyResult) {
        return toResponse(keyResult, List.of());
    }

    /**
     * Full mapping with Jira tickets attached.
     * Computes jiraProgressPercent and computedStatus automatically.
     */
    public KeyResultResponse toResponse(KeyResult keyResult, List<JiraIssueDto> jiraIssues) {

        // ── Compute average Jira progress ──────────────────────────────────
        Integer jiraProgressPercent = null;
        KeyResultStatus computedStatus = keyResult.getStatus();

        if (jiraIssues != null && !jiraIssues.isEmpty()) {
            long count = jiraIssues.stream()
                    .filter(ji -> ji.getProgressPercent() != null)
                    .count();
            if (count > 0) {
                int sum = jiraIssues.stream()
                        .filter(ji -> ji.getProgressPercent() != null)
                        .mapToInt(JiraIssueDto::getProgressPercent)
                        .sum();
                jiraProgressPercent = (int) Math.round((double) sum / count);
            }

            // ── Auto-derive status from average ───────────────────────────
            if (jiraProgressPercent != null) {
                if (jiraProgressPercent == 100) {
                    computedStatus = KeyResultStatus.COMPLETED;
                } else if (jiraProgressPercent >= 70) {
                    computedStatus = KeyResultStatus.ON_TRACK;
                } else if (jiraProgressPercent >= 30) {
                    computedStatus = KeyResultStatus.AT_RISK;
                } else {
                    computedStatus = KeyResultStatus.NOT_STARTED;
                }
            }
        }

        return KeyResultResponse.builder()
                .id(keyResult.getId())
                .objectiveId(keyResult.getObjective() != null
                        ? keyResult.getObjective().getId() : null)
                .title(keyResult.getTitle())
                .description(keyResult.getDescription())
                .metricType(keyResult.getMetricType())
                .startValue(keyResult.getStartValue())
                .currentValue(keyResult.getCurrentValue())
                .targetValue(keyResult.getTargetValue())
                .status(keyResult.getStatus())             // raw stored status
                .computedStatus(computedStatus)           // auto-derived status
                .jiraProgressPercent(jiraProgressPercent) // avg ticket %
                .updatedByUserId(keyResult.getUpdatedByUserId())
                .updatedAt(keyResult.getUpdatedAt())
                .jiraIssues(jiraIssues != null ? jiraIssues : List.of())
                .build();
    }
}
