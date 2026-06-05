package com.laerdal.okpi.auth.repository;

import com.laerdal.okpi.auth.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findByEmailAndOtp(String email, String otp);

    Optional<OtpVerification> findTopByEmailOrderByIdDesc(String email);
}