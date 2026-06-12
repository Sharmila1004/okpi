package com.laerdal.okpi.objective.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Maps to the kr_jira_mapping table.
 * Represents the many-to-many relationship between a KeyResult and Jira tickets.
 * One key result can be linked to many Jira issue keys.
 */
@Entity
@Table(name = "kr_jira_mapping")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KrJiraMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK to key_results.id */
    @Column(name = "kr_id", nullable = false)
    private Long krId;

    /** e.g. "RQI-100" — FK to jira_issues.issue_key */
    @Column(name = "issue_key", nullable = false, length = 50)
    private String issueKey;
}
