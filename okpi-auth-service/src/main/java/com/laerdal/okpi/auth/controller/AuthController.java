package com.laerdal.okpi.auth.controller;

import com.laerdal.okpi.auth.dto.request.LoginRequest;
import com.laerdal.okpi.auth.dto.request.RefreshTokenRequest;
import com.laerdal.okpi.auth.dto.request.RegisterRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.AuthResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.service.AuthService;
import com.laerdal.okpi.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        return userService.getCurrentUser(authentication.getName());
    }

    @PutMapping("/me")
    public UserResponse updateMe(Authentication authentication,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateCurrentUser(authentication.getName(), request);
    }
}
