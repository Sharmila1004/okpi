package com.laerdal.okpi.auth.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeStatusRequest {
    @NotNull
    private Boolean isActive;
}

