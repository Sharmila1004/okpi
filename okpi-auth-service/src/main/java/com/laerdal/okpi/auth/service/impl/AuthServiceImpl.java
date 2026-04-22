package com.laerdal.okpi.auth.service.impl;

import com.laerdal.okpi.auth.dto.request.LoginRequest;
import com.laerdal.okpi.auth.dto.request.RefreshTokenRequest;
import com.laerdal.okpi.auth.dto.request.RegisterRequest;
import com.laerdal.okpi.auth.dto.response.AuthResponse;
import com.laerdal.okpi.auth.entity.RefreshToken;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.exception.AuthenticationException;
import com.laerdal.okpi.auth.exception.DuplicateResourceException;
import com.laerdal.okpi.auth.mapper.UserMapper;
import com.laerdal.okpi.auth.repository.RefreshTokenRepository;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.security.JwtTokenProvider;
import com.laerdal.okpi.auth.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final long REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final JwtTokenProvider jwtProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordEncoder passwordEncoder,
                           UserMapper userMapper,
                           JwtTokenProvider jwtProvider) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
        this.jwtProvider = jwtProvider;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        User savedUser = userRepository.save(User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(Role.MEMBER)
                .active(true)
                .build());

        String accessToken = jwtProvider.generateAccessToken(savedUser);
        String refreshToken = createRefreshToken(savedUser);

        return buildAuthResponse(savedUser, accessToken, refreshToken);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new AuthenticationException("User account is disabled");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = createRefreshToken(user);
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthenticationException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthenticationException("Refresh token expired or revoked");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        String accessToken = jwtProvider.generateAccessToken(user);
        String newRefreshToken = createRefreshToken(user);
        return buildAuthResponse(user, accessToken, newRefreshToken);
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtProvider.getAccessTokenExpirationSeconds())
                .user(userMapper.toResponse(user))
                .build();
    }

    private String createRefreshToken(User user) {
        refreshTokenRepository.deleteAllByExpiresAtBefore(Instant.now());
        refreshTokenRepository.deleteAllByUser_Id(user.getId());

        String tokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(tokenValue)
                .expiresAt(Instant.now().plusSeconds(REFRESH_TOKEN_TTL_SECONDS))
                .revoked(false)
                .createdAt(Instant.now())
                .build();
        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }
}

