package com.laerdal.okpi.objective.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "objective_assignees", indexes = {
        @Index(name = "idx_objective_assignee_objective_id", columnList = "objective_id"),
        @Index(name = "idx_objective_assignee_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ObjectiveAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "objective_id", nullable = false)
    private Objective objective;

    public ObjectiveAssignee(Long userId, Objective objective) {
        this.userId = userId;
        this.objective = objective;
    }
}
