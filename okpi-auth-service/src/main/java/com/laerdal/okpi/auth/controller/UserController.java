package com.laerdal.okpi.auth.controller;

import com.laerdal.okpi.auth.dto.request.ChangeRoleRequest;
import com.laerdal.okpi.auth.dto.request.ChangeStatusRequest;
import com.laerdal.okpi.auth.dto.response.PagedResponse;
import com.laerdal.okpi.auth.dto.response.UserResponse;
import com.laerdal.okpi.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public PagedResponse<UserResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role
    ) {
        return userService.getUsers(page, size, role);
    }

    @GetMapping("/{userId}")
    public UserResponse getUser(
            @PathVariable("userId") Long userId
    ) {
        return userService.getUserById(userId);
    }

    @PutMapping("/{userId}/role")
    public UserResponse changeRole(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody ChangeRoleRequest request
    ) {
        return userService.changeRole(userId, request);
    }

    @PutMapping("/{userId}/status")
    public UserResponse changeStatus(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody ChangeStatusRequest request
    ) {
        return userService.changeStatus(userId, request);
    }
}