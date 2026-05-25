package com.laerdal.okpi.auth.controller;

import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.request.UpdateProfileRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth/users")
@Tag(name = "Users", description = "Admin user management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @Operation(summary = "List users (Admin only)")
    public PagedResponse<UserResponse> getUsers(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "role", required = false) String role
    ) {
        return userService.getUsers(page, size, role);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get a lightweight user summary by ids (Manager/Admin)")
    public List<UserResponse> getUsersSummary(
            @RequestParam(name = "ids") List<Long> ids
    ) {
        return userService.getUsersSummary(ids);
    }

    @GetMapping("/{userId:\\d+}")
    @Operation(summary = "Get a user by id (Admin only)")
    public UserResponse getUser(
            @PathVariable("userId") Long userId
    ) {
        return userService.getUserById(userId);
    }

    @PutMapping("/{userId:\\d+}/role")
    @Operation(summary = "Change a user's role (Admin only)")
    public UserResponse changeRole(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody ChangeRoleRequest request
    ) {
        return userService.changeRole(userId, request);
    }

    @PutMapping("/{userId:\\d+}/status")
    @Operation(summary = "Change a user's active status (Admin only)")
    public UserResponse changeStatus(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody ChangeStatusRequest request
    ) {
        return userService.changeStatus(userId, request);
    }

    @PutMapping("/{userId:\\d+}")
    @Operation(summary = "Update user profile details (Admin only)")
    public UserResponse updateUserByAdmin(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return userService.updateUserByAdmin(userId, request);
    }

    @DeleteMapping("/{userId:\\d+}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a user (Admin only)")
    public void deleteUser(
            @PathVariable("userId") Long userId
    ) {
        userService.deleteUser(userId);
    }
}
