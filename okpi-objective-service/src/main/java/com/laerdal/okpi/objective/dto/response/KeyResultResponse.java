package com.laerdal.okpi.objective.dto.response;

import com.laerdal.okpi.objective.enums.KeyResultStatus;
import com.laerdal.okpi.objective.enums.MetricType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * CHANGED:
 *  - Added jiraProgressPercent  — average % across linked Jira tickets (null = no tickets)
 *  - Added computedStatus       — auto-derived status sent to frontend
 *  - jiraIssues kept for the dropdown
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KeyResultResponse {
    private Long id;
    private Long objectiveId;
    private String title;
    private String description;
    private MetricType metricType;
    private BigDecimal startValue;
    private BigDecimal currentValue;
    private BigDecimal targetValue;
    private KeyResultStatus status;
    private Long updatedByUserId;
    private Instant updatedAt;

    /**
     * Average progress % of all linked Jira tickets.
     * Null when no tickets are linked — frontend falls back to manual KR progress.
     */
    private Integer jiraProgressPercent;

    /**
     * Auto-computed status. Rules (applied only when tickets exist):
     *   100%        → COMPLETED
     *   >= 70%      → ON_TRACK
     *   >= 30%      → AT_RISK
     *   <  30%      → NOT_STARTED
     * When no tickets are linked this equals the stored status.
     */
    private KeyResultStatus computedStatus;

    @Builder.Default
    private List<JiraIssueDto> jiraIssues = new ArrayList<>();
}
