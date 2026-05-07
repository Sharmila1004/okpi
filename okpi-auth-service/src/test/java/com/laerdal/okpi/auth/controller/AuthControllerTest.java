package com.laerdal.okpi.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.auth.dto.request.LoginRequest;
import com.laerdal.okpi.auth.dto.request.RefreshTokenRequest;
import com.laerdal.okpi.auth.dto.request.RegisterRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.AuthResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.service.AuthService;
import com.laerdal.okpi.auth.service.UserService;
import com.laerdal.okpi.auth.security.CustomUserDetailsService;
import com.laerdal.okpi.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private AuthService authService;

    @org.springframework.boot.test.mock.mockito.MockBean
    private UserService userService;

    @org.springframework.boot.test.mock.mockito.MockBean
    private JwtTokenProvider jwtTokenProvider;

    @org.springframework.boot.test.mock.mockito.MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void registerReturnsCreatedAuthResponse() throws Exception {
        RegisterRequest request = registerRequest();
        AuthResponse response = authResponse();
        when(authService.register(eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("alice@example.com"));

        verify(authService).register(eq(request));
    }

    @Test
    void loginReturnsTokens() throws Exception {
        LoginRequest request = loginRequest();
        AuthResponse response = authResponse();
        when(authService.login(eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"));

        verify(authService).login(eq(request));
    }

    @Test
    void refreshReturnsNewTokens() throws Exception {
        RefreshTokenRequest request = refreshTokenRequest();
        AuthResponse response = authResponse();
        when(authService.refresh(eq(request))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"));

        verify(authService).refresh(eq(request));
    }

    @Test
    void logoutReturnsNoContent() throws Exception {
        RefreshTokenRequest request = refreshTokenRequest();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(authService).logout(eq(request));
    }

    @Test
    void meReturnsCurrentUserForPrincipalEmail() throws Exception {
        UserResponse response = userResponse();
        when(userService.getCurrentUser("alice@example.com")).thenReturn(response);

        mockMvc.perform(get("/api/v1/auth/me")
                        .principal(new UsernamePasswordAuthenticationToken("alice@example.com", "n/a")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.role").value("MEMBER"));

        verify(userService).getCurrentUser("alice@example.com");
    }

    @Test
    void updateMeUpdatesCurrentUserForPrincipalEmail() throws Exception {
        UpdateProfileRequest request = updateProfileRequest();
        UserResponse response = userResponse();
        when(userService.updateCurrentUser(eq("alice@example.com"), eq(request))).thenReturn(response);

        mockMvc.perform(put("/api/v1/auth/me")
                        .principal(new UsernamePasswordAuthenticationToken("alice@example.com", "n/a"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.firstName").value("Alice"));

        verify(userService).updateCurrentUser(eq("alice@example.com"), eq(request));
    }

    private static RegisterRequest registerRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("alice@example.com");
        request.setPassword("password123");
        request.setFirstName("Alice");
        request.setLastName("Anderson");
        return request;
    }

    private static LoginRequest loginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("password123");
        return request;
    }

    private static RefreshTokenRequest refreshTokenRequest() {
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("refresh-token");
        return request;
    }

    private static UpdateProfileRequest updateProfileRequest() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Alice");
        request.setLastName("Anderson");
        request.setEmail("alice@example.com");
        return request;
    }

    private static AuthResponse authResponse() {
        return AuthResponse.builder()
                .accessToken("access-token")
                .refreshToken("refresh-token")
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(UserResponse.builder()
                        .id(1L)
                        .email("alice@example.com")
                        .firstName("Alice")
                        .lastName("Anderson")
                        .role(Role.MEMBER)
                        .active(true)
                        .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                        .build())
                .build();
    }

    private static UserResponse userResponse() {
        return UserResponse.builder()
                .id(1L)
                .email("alice@example.com")
                .firstName("Alice")
                .lastName("Anderson")
                .role(Role.MEMBER)
                .active(true)
                .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                .build();
    }
}

