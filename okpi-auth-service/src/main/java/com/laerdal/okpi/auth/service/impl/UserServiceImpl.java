package com.laerdal.okpi.auth.service.impl;

import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.exception.AccessDeniedException;
import com.laerdal.okpi.auth.exception.DuplicateResourceException;
import com.laerdal.okpi.auth.exception.ResourceNotFoundException;
import com.laerdal.okpi.auth.mapper.UserMapper;
import com.laerdal.okpi.auth.repository.RefreshTokenRepository;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           UserMapper userMapper) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        return userMapper.toResponse(getRequiredUserByEmail(email));
    }

    @Override
    @Transactional
    public UserResponse updateCurrentUser(String email, UpdateProfileRequest request) {

        User user = getRequiredUserByEmail(email);

        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can update profile");
        }

        applyAdminUpdates(user, request);

        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getUsers(int page, int size, String role) {

        Role roleFilter = StringUtils.hasText(role)
                ? Role.valueOf(role.toUpperCase())
                : null;

        Page<User> users = userRepository.findAllByRole(
                roleFilter, PageRequest.of(page, size)
        );

        return PagedResponse.<UserResponse>builder()
                .content(users.getContent().stream()
                        .map(userMapper::toResponse)
                        .toList())
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersSummary(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }

        List<User> users = new ArrayList<>();
        userRepository.findAllById(userIds).forEach(users::add);
        Map<Long, User> usersById = users.stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .map(usersById::get)
                .filter(Objects::nonNull)
                .map(userMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        return userMapper.toResponse(getRequiredUser(userId));
    }

    @Override
    @Transactional
    public UserResponse changeRole(Long userId, ChangeRoleRequest request) {
        User user = getRequiredUser(userId);
        user.setRole(request.getRole());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserResponse changeStatus(Long userId, ChangeStatusRequest request) {
        User user = getRequiredUser(userId);
        user.setActive(request.getIsActive());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = getRequiredUser(userId);
        refreshTokenRepository.deleteAllByUser_Id(userId);
        userRepository.delete(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserByAdmin(Long userId, UpdateProfileRequest request) {

        User admin = getCurrentUserFromSecurity();

        if (admin.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only ADMIN can update users");
        }

        User user = getRequiredUser(userId);

        applyAdminUpdates(user, request);

        return userMapper.toResponse(userRepository.save(user));
    }

    private void applyAdminUpdates(User user, UpdateProfileRequest request) {

        String email = request.getEmail() == null ? null : request.getEmail().trim();
        if (StringUtils.hasText(email)) {
            userRepository.findByEmail(email)
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("Email already exists");
                    });

            user.setEmail(email);
        }

        String firstName = request.getFirstName() == null ? null : request.getFirstName().trim();
        if (StringUtils.hasText(firstName)) {
            user.setFirstName(firstName);
        }

        String lastName = request.getLastName() == null ? null : request.getLastName().trim();
        if (StringUtils.hasText(lastName)) {
            user.setLastName(lastName);
        }
    }

    private User getCurrentUserFromSecurity() {

        String email = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Authenticated user not found"));
    }

    private User getRequiredUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found: " + email));
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found: " + userId));
    }
}