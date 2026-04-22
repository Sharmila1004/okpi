package com.laerdal.okpi.objective.repository;

import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ObjectiveRepository extends JpaRepository<Objective, Long> {
    @Query("""
            SELECT o
            FROM Objective o
            WHERE o.isDeleted = false
              AND (:status IS NULL OR o.status = :status)
              AND (:ownerId IS NULL OR o.ownerId = :ownerId)
              AND (
                    :search IS NULL
                    OR LOWER(o.title) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            ORDER BY o.createdAt DESC
            """)
    Page<Objective> findWithFilters(@Param("status") ObjectiveStatus status,
                                    @Param("ownerId") Long ownerId,
                                    @Param("search") String search,
                                    Pageable pageable);

    @Query("SELECT COUNT(o) FROM Objective o WHERE o.ownerId = :ownerId AND o.isDeleted = false")
    long countByOwnerId(@Param("ownerId") Long ownerId);

    @Query("""
            SELECT COUNT(o) FROM Objective o
            WHERE o.ownerId = :ownerId AND o.status = :status AND o.isDeleted = false
            """)
    long countByOwnerIdAndStatus(@Param("ownerId") Long ownerId, @Param("status") ObjectiveStatus status);

    List<Objective> findAllByOwnerIdAndIsDeletedFalse(Long ownerId);

    java.util.Optional<Objective> findByIdAndIsDeletedFalse(Long id);
}
