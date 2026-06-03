package com.laerdal.okpi.auth.service;

import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import java.util.List;

public interface UserService {
    UserResponse getCurrentUser(String email);
    UserResponse updateCurrentUser(String email, UpdateProfileRequest request);
    PagedResponse<UserResponse> getUsers(int page, int size, String role);
    List<UserResponse> getUsersSummary(List<Long> userIds);
    UserResponse getUserById(Long userId);
    UserResponse changeRole(Long userId, ChangeRoleRequest request);
    UserResponse changeStatus(Long userId, ChangeStatusRequest request);
    void deleteUser(Long userId);
    UserResponse updateUserByAdmin(Long userId, UpdateProfileRequest request);
    void assignManagerTeam(Long managerId, List<Long> memberIds);
    List<UserResponse> getTeamMembers(Long managerId);
}
