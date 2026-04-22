package com.laerdal.okpi.auth.service.impl;

import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.exception.DuplicateResourceException;
import com.laerdal.okpi.auth.exception.ResourceNotFoundException;
import com.laerdal.okpi.auth.mapper.UserMapper;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
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
        applyProfileUpdates(user, request);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getUsers(int page, int size, String role) {
        Role roleFilter = StringUtils.hasText(role) ? Role.valueOf(role.toUpperCase()) : null;
        Page<User> users = userRepository.findAllByRole(roleFilter, PageRequest.of(page, size));
        return PagedResponse.<UserResponse>builder()
                .content(users.getContent().stream().map(userMapper::toResponse).toList())
                .page(users.getNumber())
                .size(users.getSize())
                .totalElements(users.getTotalElements())
                .totalPages(users.getTotalPages())
                .last(users.isLast())
                .build();
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

    private User getRequiredUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private void applyProfileUpdates(User user, UpdateProfileRequest request) {
        if (StringUtils.hasText(request.getEmail())) {
            userRepository.findByEmail(request.getEmail())
                    .filter(existing -> !existing.getId().equals(user.getId()))
                    .ifPresent(existing -> {
                        throw new DuplicateResourceException("Email already exists");
                    });
            user.setEmail(request.getEmail());
        }

        if (StringUtils.hasText(request.getFirstName())) {
            user.setFirstName(request.getFirstName());
        }

        if (StringUtils.hasText(request.getLastName())) {
            user.setLastName(request.getLastName());
        }
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
