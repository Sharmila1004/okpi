package com.laerdal.okpi.auth.dto.response;

import com.laerdal.okpi.auth.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder

public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Role role;
    private boolean active;
    private LocalDateTime createdAt;
}
