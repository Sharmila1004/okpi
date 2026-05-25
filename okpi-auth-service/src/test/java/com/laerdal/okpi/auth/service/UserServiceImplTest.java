package com.laerdal.okpi.auth.service;

import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.exception.AccessDeniedException;
import com.laerdal.okpi.auth.mapper.UserMapper;
import com.laerdal.okpi.auth.repository.RefreshTokenRepository;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.service.impl.UserServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void updateCurrentUserRejectsManagers() {
        User manager = user(2L, "manager@example.com", Role.MANAGER);
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));

        UpdateProfileRequest request = updateProfileRequest(
                "New",
                "Name",
                "new.manager@example.com"
        );

        assertThrows(
                AccessDeniedException.class,
                () -> userService.updateCurrentUser("manager@example.com", request)
        );

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateCurrentUserAllowsAdminToEditOwnProfile() {
        User admin = user(1L, "admin@example.com", Role.ADMIN);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(userRepository.findByEmail("new.admin@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        UpdateProfileRequest request = updateProfileRequest(
                "New",
                "Admin",
                "new.admin@example.com"
        );

        UserResponse response = userService.updateCurrentUser("admin@example.com", request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User saved = userCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo("new.admin@example.com");
        assertThat(saved.getFirstName()).isEqualTo("New");
        assertThat(saved.getLastName()).isEqualTo("Admin");
        assertThat(response.getEmail()).isEqualTo("new.admin@example.com");
    }

    @Test
    void updateUserByAdminAllowsAdminToEditOtherUsers() {
        User admin = user(1L, "admin@example.com", Role.ADMIN);
        User manager = user(7L, "manager@example.com", Role.MANAGER);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(userRepository.findById(7L)).thenReturn(Optional.of(manager));
        when(userRepository.findByEmail("updated.manager@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toResponse(any(User.class))).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@example.com", "n/a")
        );

        UpdateProfileRequest request = updateProfileRequest(
                "Updated",
                "Manager",
                "updated.manager@example.com"
        );

        UserResponse response = userService.updateUserByAdmin(7L, request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User saved = userCaptor.getValue();
        assertThat(saved.getId()).isEqualTo(7L);
        assertThat(saved.getEmail()).isEqualTo("updated.manager@example.com");
        assertThat(saved.getFirstName()).isEqualTo("Updated");
        assertThat(saved.getLastName()).isEqualTo("Manager");
        assertThat(response.getId()).isEqualTo(7L);
    }

    @Test
    void updateUserByAdminRejectsNonAdmins() {
        User manager = user(2L, "manager@example.com", Role.MANAGER);
        when(userRepository.findByEmail("manager@example.com")).thenReturn(Optional.of(manager));
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("manager@example.com", "n/a")
        );

        assertThrows(
                AccessDeniedException.class,
                () -> userService.updateUserByAdmin(7L, updateProfileRequest("Updated", "Manager", "updated@example.com"))
        );

        verify(userRepository, never()).findById(any());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUserRemovesRefreshTokensAndUser() {
        User manager = user(7L, "manager@example.com", Role.MANAGER);
        when(userRepository.findById(7L)).thenReturn(Optional.of(manager));

        userService.deleteUser(7L);

        verify(refreshTokenRepository).deleteAllByUser_Id(7L);
        verify(userRepository).delete(manager);
    }

    @Test
    void getUsersSummaryPreservesRequestedOrder() {
        User alice = user(1L, "alice@example.com", Role.ADMIN);
        User bob = user(2L, "bob@example.com", Role.MEMBER);
        when(userRepository.findAllById(List.of(2L, 1L, 2L))).thenReturn(List.of(bob, alice));
        when(userMapper.toResponse(any(User.class))).thenAnswer(invocation -> toResponse(invocation.getArgument(0)));

        List<UserResponse> responses = userService.getUsersSummary(List.of(2L, 1L, 2L));

        assertThat(responses).extracting(UserResponse::getEmail)
                .containsExactly("bob@example.com", "alice@example.com");
    }

    private static UpdateProfileRequest updateProfileRequest(
            String firstName,
            String lastName,
            String email
    ) {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName(firstName);
        request.setLastName(lastName);
        request.setEmail(email);
        return request;
    }

    private static User user(Long id, String email, Role role) {
        return User.builder()
                .id(id)
                .email(email)
                .passwordHash("hashed-password")
                .firstName("Old")
                .lastName("Name")
                .role(role)
                .active(true)
                .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                .updatedAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                .build();
    }

    private static UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
