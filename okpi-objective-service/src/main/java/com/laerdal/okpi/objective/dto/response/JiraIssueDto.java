package com.laerdal.okpi.objective.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single Jira ticket linked to a key result.
 * Included in KeyResultResponse.jiraIssues.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JiraIssueDto {
    private String issueKey;
    private String summary;
    private String status;
    private Integer progressPercent;
}
