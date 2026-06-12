package com.laerdal.okpi.objective.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Maps to the jira_issues table.
 * Populated by your Jira CSV import process.
 */
@Entity
@Table(name = "jira_issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JiraIssue {

    /** e.g. "RQI-100" */
    @Id
    @Column(name = "issue_key", length = 50)
    private String issueKey;

    @Column(length = 500)
    private String summary;

    /** e.g. "Done", "In Progress", "To Do" */
    @Column(length = 100)
    private String status;

    @Column(name = "progress_percent")
    private Integer progressPercent;
}
