package com.laerdal.okpi.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.auth.config.SecurityConfig;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.security.CustomUserDetailsService;
import com.laerdal.okpi.auth.security.JwtAuthenticationFilter;
import com.laerdal.okpi.auth.security.JwtTokenProvider;
import com.laerdal.okpi.auth.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc
@Import(SecurityConfig.class)
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private UserService userService;

    @org.springframework.boot.test.mock.mockito.MockBean
    private JwtTokenProvider jwtTokenProvider;

    @org.springframework.boot.test.mock.mockito.MockBean
    private CustomUserDetailsService customUserDetailsService;

    @TestConfiguration
    static class JwtFilterConfig {

        @Bean
        JwtAuthenticationFilter jwtAuthenticationFilter(
                JwtTokenProvider jwtTokenProvider,
                CustomUserDetailsService customUserDetailsService
        ) {
            return new JwtAuthenticationFilter(jwtTokenProvider, customUserDetailsService);
        }
    }

    @Test
    @WithMockUser(roles = "MEMBER")
    void getUsersIsForbiddenForNonAdmins() throws Exception {
        mockMvc.perform(get("/api/v1/auth/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void getUsersSummaryIsAllowedForManagers() throws Exception {
        when(userService.getUsersSummary(List.of(1L, 2L))).thenReturn(emptyUsersSummary());

        mockMvc.perform(get("/api/v1/auth/users/summary")
                        .param("ids", "1", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("admin@example.com"));

        verify(userService).getUsersSummary(List.of(1L, 2L));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUsersIsAllowedForAdmins() throws Exception {
        when(userService.getUsers(0, 10, null)).thenReturn(emptyUsersPage());

        mockMvc.perform(get("/api/v1/auth/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("admin@example.com"));

        verify(userService).getUsers(0, 10, null);
    }

    @Test
    @WithMockUser(roles = "MEMBER")
    void updateUserIsForbiddenForNonAdmins() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Alicia");
        request.setLastName("Adams");
        request.setEmail("alicia@example.com");

        mockMvc.perform(put("/api/v1/auth/users/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "MEMBER")
    void deleteUserIsForbiddenForNonAdmins() throws Exception {
        mockMvc.perform(delete("/api/v1/auth/users/7"))
                .andExpect(status().isForbidden());
    }

    private static PagedResponse<UserResponse> emptyUsersPage() {
        UserResponse user = UserResponse.builder()
                .id(1L)
                .email("admin@example.com")
                .firstName("Admin")
                .lastName("User")
                .role(Role.ADMIN)
                .active(true)
                .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                .build();

        return PagedResponse.<UserResponse>builder()
                .content(List.of(user))
                .page(0)
                .size(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();
    }

    private static List<UserResponse> emptyUsersSummary() {
        UserResponse user = UserResponse.builder()
                .id(1L)
                .email("admin@example.com")
                .firstName("Admin")
                .lastName("User")
                .role(Role.ADMIN)
                .active(true)
                .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                .build();

        return List.of(user);
    }
}
