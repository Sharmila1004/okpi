package com.laerdal.okpi.objective.repository;

import com.laerdal.okpi.objective.entity.Objective;
import com.laerdal.okpi.objective.enums.ObjectiveStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.criteria.JoinType;
import java.util.List;
import java.util.Locale;

public interface ObjectiveRepository extends JpaRepository<Objective, Long>, JpaSpecificationExecutor<Objective> {
    default Page<Objective> findVisibleWithFilters(ObjectiveStatus status,
                                                   Long ownerId,
                                                   String search,
                                                   Pageable pageable) {
        Specification<Objective> specification = (root, query, criteriaBuilder) ->
                criteriaBuilder.isFalse(root.get("isDeleted"));

        if (status != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (ownerId != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("ownerId"), ownerId));
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern));
        }

        return findAll(specification, pageable);
    }

    default Page<Objective> findAssignedOrOwnedWithFilters(Long userId,
                                                           ObjectiveStatus status,
                                                           String search,
                                                           Pageable pageable) {
        Specification<Objective> specification = (root, query, criteriaBuilder) -> {
            query.distinct(true);
            var assignees = root.join("assignees", JoinType.LEFT);
            return criteriaBuilder.and(
                    criteriaBuilder.isFalse(root.get("isDeleted")),
                    criteriaBuilder.or(
                            criteriaBuilder.equal(root.get("ownerId"), userId),
                            criteriaBuilder.equal(assignees.get("userId"), userId)
                    )
            );
        };

        if (status != null) {
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("status"), status));
        }

        if (search != null && !search.isBlank()) {
            String pattern = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern));
        }

        return findAll(specification, pageable);
    }

    @Query("SELECT DISTINCT o FROM Objective o LEFT JOIN o.assignees a WHERE o.isDeleted = false AND (o.ownerId = :userId OR a.userId = :userId) ORDER BY o.createdAt DESC")
    java.util.List<Objective> findAllVisibleToUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(DISTINCT o) FROM Objective o LEFT JOIN o.assignees a WHERE o.isDeleted = false AND (o.ownerId = :userId OR a.userId = :userId)")
    long countVisibleToUser(@Param("userId") Long userId);

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
