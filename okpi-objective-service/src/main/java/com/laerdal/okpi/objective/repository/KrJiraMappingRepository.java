package com.laerdal.okpi.objective.repository;

import com.laerdal.okpi.objective.entity.KrJiraMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KrJiraMappingRepository extends JpaRepository<KrJiraMapping, Long> {

    /**
     * Return all Jira ticket mappings for a given key result id.
     */
    List<KrJiraMapping> findAllByKrId(Long krId);
}
