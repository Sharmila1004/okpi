package com.laerdal.okpi.auth.service.impl;

import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.entity.Notification;
import com.laerdal.okpi.auth.entity.User;
import com.laerdal.okpi.auth.enums.Role;
import com.laerdal.okpi.auth.exception.AccessDeniedException;
import com.laerdal.okpi.auth.exception.DuplicateResourceException;
import com.laerdal.okpi.auth.exception.ResourceNotFoundException;
import com.laerdal.okpi.auth.mapper.UserMapper;
import com.laerdal.okpi.auth.repository.NotificationRepository;
import com.laerdal.okpi.auth.repository.RefreshTokenRepository;
import com.laerdal.okpi.auth.repository.UserRepository;
import com.laerdal.okpi.auth.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserMapper userMapper;
    private final NotificationRepository notificationRepository;

    public UserServiceImpl(UserRepository userRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           UserMapper userMapper,
                           NotificationRepository notificationRepository) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userMapper = userMapper;
        this.notificationRepository = notificationRepository;
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
                roleFilter, PageRequest.of(page, size));
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
    public List<UserResponse> getUsersSummary(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) return List.of();
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

    /**
     * Assign exactly the given member IDs to the manager.
     * Removes anyone previously assigned who is not in the new list.
     * Fires notifications to newly added members and to the manager.
     */
    @Override
    @Transactional
    public void assignManagerTeam(Long managerId, List<Long> memberIds) {
        User actor = getCurrentUserFromSecurity();
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.MANAGER) {
            throw new AccessDeniedException("Only ADMIN or MANAGER can assign teams");
        }
        if (actor.getRole() == Role.MANAGER && !Objects.equals(actor.getId(), managerId)) {
            throw new AccessDeniedException("Managers can only update their own team");
        }

        User manager = getRequiredUser(managerId);
        if (manager.getRole() != Role.MANAGER) {
            throw new AccessDeniedException("Teams can only be assigned to manager accounts");
        }

        List<Long> newIds = memberIds == null
                ? List.of()
                : memberIds.stream().filter(Objects::nonNull).distinct().toList();

        // Current members of this manager
        List<User> currentMembers = userRepository.findByManagerId(managerId);
        Set<Long> currentSet = currentMembers.stream()
                .map(User::getId).collect(Collectors.toSet());
        Set<Long> newSet = new HashSet<>(newIds);
        String managerName = fullName(manager);

        List<User> newMembers = newIds.isEmpty()
                ? List.of()
                : userRepository.findAllById(newIds).stream().toList();
        if (newMembers.size() != newIds.size()) {
            throw new ResourceNotFoundException("One or more members were not found");
        }

        Map<Long, Long> previousManagerByMemberId = new HashMap<>();
        for (User member : newMembers) {
            if (member.getRole() != Role.MEMBER) {
                throw new AccessDeniedException("Only members can be assigned to a team");
            }

            Long previousManagerId = member.getManagerId();
            if (actor.getRole() == Role.MANAGER
                    && previousManagerId != null
                    && !Objects.equals(previousManagerId, managerId)
                    && !currentSet.contains(member.getId())) {
                throw new AccessDeniedException("Cannot assign members from another manager's team");
            }
            previousManagerByMemberId.put(member.getId(), previousManagerId);
        }

        // Unassign removed members
        for (User member : currentMembers) {
            if (!newSet.contains(member.getId())) {
                member.setManagerId(null);
                userRepository.save(member);
                notify(member.getId(),
                        "You have been removed from " + managerName + "'s team.");
            }
        }

        List<String> teammateNames = newMembers.stream()
                .map(this::fullName).sorted().toList();

        for (User member : newMembers) {
            Long previousManagerId = previousManagerByMemberId.get(member.getId());
            member.setManagerId(managerId);
            userRepository.save(member);
            if (!currentSet.contains(member.getId())) {
                String others = teammateNames.stream()
                        .filter(n -> !n.equals(fullName(member)))
                        .collect(Collectors.joining(", "));
                String msg = "You have been assigned to " + managerName + "'s team."
                        + (others.isBlank() ? "" : " Your teammates: " + others + ".");
                notify(member.getId(), msg);
                if (previousManagerId != null && !Objects.equals(previousManagerId, managerId)) {
                    User previousManager = userRepository.findById(previousManagerId).orElse(null);
                    if (previousManager != null && previousManager.getRole() == Role.MANAGER) {
                        notify(previousManager.getId(),
                                fullName(member) + " has been moved to " + managerName + "'s team.");
                    }
                }
            }
        }

        // Notify the manager
        String teamSummary = teammateNames.isEmpty()
                ? "no members"
                : String.join(", ", teammateNames);
        notify(managerId, "Your team has been updated. Current members: " + teamSummary + ".");
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getTeamMembers(Long managerId) {
        User actor = getCurrentUserFromSecurity();
        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.MANAGER) {
            throw new AccessDeniedException("Only ADMIN or MANAGER can view team members");
        }
        if (actor.getRole() == Role.MANAGER && !Objects.equals(actor.getId(), managerId)) {
            throw new AccessDeniedException("Managers can only view their own team");
        }
        User manager = getRequiredUser(managerId);
        if (manager.getRole() != Role.MANAGER) {
            throw new AccessDeniedException("Team members can only be fetched for managers");
        }
        return userRepository.findByManagerId(managerId)
                .stream().map(userMapper::toResponse).toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void notify(Long userId, String message) {
        notificationRepository.save(Notification.builder()
                .userId(userId)
                .message(message)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String fullName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName())
                + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isBlank() ? user.getEmail() : name;
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
        if (StringUtils.hasText(firstName)) user.setFirstName(firstName);
        String lastName = request.getLastName() == null ? null : request.getLastName().trim();
        if (StringUtils.hasText(lastName)) user.setLastName(lastName);
    }

    private User getCurrentUserFromSecurity() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    private User getRequiredUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private User getRequiredUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }
}
