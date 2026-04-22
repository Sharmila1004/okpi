package com.laerdal.okpi.auth.dto.request;

import com.laerdal.okpi.auth.enums.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeRoleRequest {
    @NotNull
    private Role role;
}

