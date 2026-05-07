package com.laerdal.okpi.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.service.UserService;
import com.laerdal.okpi.auth.security.CustomUserDetailsService;
import com.laerdal.okpi.auth.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

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

    @Test
    void getUsersReturnsPagedResponse() throws Exception {
        PagedResponse<UserResponse> response = pagedUsers();
        when(userService.getUsers(1, 25, "admin")).thenReturn(response);

        mockMvc.perform(get("/api/v1/auth/users")
                        .param("page", "1")
                        .param("size", "25")
                        .param("role", "admin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value("alice@example.com"))
                .andExpect(jsonPath("$.content[1].role").value("MEMBER"))
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(25))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.last").value(true));

        verify(userService).getUsers(1, 25, "admin");
    }

    @Test
    void getUserReturnsSingleUser() throws Exception {
        UserResponse response = userResponse(7L, "alice@example.com", Role.ADMIN, true);
        when(userService.getUserById(7L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/auth/users/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));

        verify(userService).getUserById(7L);
    }

    @Test
    void changeRoleUpdatesRole() throws Exception {
        ChangeRoleRequest request = new ChangeRoleRequest();
        request.setRole(Role.MANAGER);
        UserResponse response = userResponse(7L, "alice@example.com", Role.MANAGER, true);
        when(userService.changeRole(eq(7L), eq(request))).thenReturn(response);

        mockMvc.perform(put("/api/v1/auth/users/7/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"));

        verify(userService).changeRole(eq(7L), eq(request));
    }

    @Test
    void changeStatusUpdatesActiveFlag() throws Exception {
        ChangeStatusRequest request = new ChangeStatusRequest();
        request.setIsActive(false);
        UserResponse response = userResponse(7L, "alice@example.com", Role.MEMBER, false);
        when(userService.changeStatus(eq(7L), eq(request))).thenReturn(response);

        mockMvc.perform(put("/api/v1/auth/users/7/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        verify(userService).changeStatus(eq(7L), eq(request));
    }

    private static PagedResponse<UserResponse> pagedUsers() {
        UserResponse alice = userResponse(1L, "alice@example.com", Role.ADMIN, true);
        UserResponse bob = userResponse(2L, "bob@example.com", Role.MEMBER, true);
        return PagedResponse.<UserResponse>builder()
                .content(List.of(alice, bob))
                .page(1)
                .size(25)
                .totalElements(2)
                .totalPages(1)
                .last(true)
                .build();
    }

    private static UserResponse userResponse(Long id, String email, Role role, boolean active) {
        return UserResponse.builder()
                .id(id)
                .email(email)
                .firstName("Alice")
                .lastName("Anderson")
                .role(role)
                .active(active)
                .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                .build();
    }
}

