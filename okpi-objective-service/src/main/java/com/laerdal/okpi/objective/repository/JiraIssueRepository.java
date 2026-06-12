package com.laerdal.okpi.objective.repository;

import com.laerdal.okpi.objective.entity.JiraIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JiraIssueRepository extends JpaRepository<JiraIssue, String> {

    /**
     * Fetch multiple Jira issues by their keys in one query.
     * Used to hydrate the jiraIssues list on a KeyResultResponse.
     */
    List<JiraIssue> findAllByIssueKeyIn(List<String> issueKeys);
}
