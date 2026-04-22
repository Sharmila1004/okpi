package com.laerdal.okpi.auth.repository;

import com.laerdal.okpi.auth.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findAllByUser_Id(Long userId);
    void deleteAllByUser_Id(Long userId);
    void deleteAllByExpiresAtBefore(Instant now);
}

