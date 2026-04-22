package com.laerdal.okpi.auth.service;

import com.laerdal.okpi.auth.dto.request.LoginRequest;
import com.laerdal.okpi.auth.dto.request.RefreshTokenRequest;
import com.laerdal.okpi.auth.dto.request.RegisterRequest;
import com.laerdal.okpi.auth.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refresh(RefreshTokenRequest request);
    void logout(RefreshTokenRequest request);
}

