package com.laerdal.okpi.kpi.repository;

import com.laerdal.okpi.kpi.entity.KpiDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KpiDefinitionRepository extends JpaRepository<KpiDefinition, Long> {
    List<KpiDefinition> findAllByOwnerId(Long ownerId);
}
