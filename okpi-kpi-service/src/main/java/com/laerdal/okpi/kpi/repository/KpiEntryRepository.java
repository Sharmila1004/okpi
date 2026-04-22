package com.laerdal.okpi.kpi.repository;

import com.laerdal.okpi.kpi.entity.KpiEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KpiEntryRepository extends JpaRepository<KpiEntry, Long> {
    List<KpiEntry> findAllByKpiDefinition_Id(Long kpiDefinitionId);
}
