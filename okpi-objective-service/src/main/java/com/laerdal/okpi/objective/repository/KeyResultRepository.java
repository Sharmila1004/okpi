package com.laerdal.okpi.objective.repository;

import com.laerdal.okpi.objective.entity.KeyResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KeyResultRepository extends JpaRepository<KeyResult, Long> {
    List<KeyResult> findAllByObjective_Id(Long objectiveId);

    @Query("""
            SELECT COUNT(kr)
            FROM KeyResult kr
            WHERE kr.objective.isDeleted = false
              AND (:ownerId IS NULL OR kr.objective.ownerId = :ownerId)
            """)
    long countForDashboard(@Param("ownerId") Long ownerId);
}
