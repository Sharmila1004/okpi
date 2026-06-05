package com.laerdal.okpi.auth.controller;

import com.laerdal.okpi.auth.dto.request.*;
import com.laerdal.okpi.auth.dto.response.AuthResponse;
import com.laerdal.okpi.auth.entity.OtpVerification;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.repository.OtpRepository;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.service.AuthService;
import com.laerdal.okpi.auth.service.EmailService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication; // ✅ IMPORTANT

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public AuthController(OtpRepository otpRepository,
                          UserRepository userRepository,
                          EmailService emailService,
                          PasswordEncoder passwordEncoder,
                          AuthService authService) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    // ✅ LOGIN
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // ✅ REGISTER (returns token ✅)
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    // ✅ LOGOUT
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
    }

    // ✅ ✅ ✅ FIXED /ME ENDPOINT (CORRECT POSITION)
    @GetMapping("/me")
    public User getCurrentUser(Authentication authentication) {

        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthenticated");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ✅ SEND OTP
    @PostMapping("/send-otp")
    public void sendOtp(@RequestBody EmailRequest request) {

        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);

        otpRepository.save(OtpVerification.builder()
                .email(request.getEmail())
                .otp(otp)
                .expiryTime(Instant.now().plusSeconds(300))
                .build());

        emailService.send(
                request.getEmail(),
                "OTP Verification",
                "Your OTP is: " + otp
        );
    }

    // ✅ VERIFY OTP
    @PostMapping("/verify-otp")
    public void verifyOtp(@RequestBody OtpRequest request) {

        OtpVerification record = otpRepository
                .findByEmailAndOtp(request.getEmail(), request.getOtp())
                .orElseThrow(() -> new RuntimeException("Invalid OTP"));

        if (record.getExpiryTime().isBefore(Instant.now())) {
            throw new RuntimeException("OTP expired");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.save(user);
    }

    // ✅ FORGOT PASSWORD
    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody EmailRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = UUID.randomUUID().toString();

        userRepository.save(user);

        emailService.send(
                request.getEmail(),
                "Reset Password",
                "http://localhost:5173/reset-password?token=" + token
        );
    }

    // ✅ RESET PASSWORD
    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody ResetPasswordRequest request) {

        User user = userRepository.findByResetToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        user.setPasswordHash(
                passwordEncoder.encode(request.getNewPassword())
        );

        userRepository.save(user);
    }
}