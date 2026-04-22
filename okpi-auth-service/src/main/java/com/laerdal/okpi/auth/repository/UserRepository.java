package com.laerdal.okpi.auth.repository;

import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
            """)
    Page<User> findAllByRole(@Param("role") Role role, Pageable pageable);
}

