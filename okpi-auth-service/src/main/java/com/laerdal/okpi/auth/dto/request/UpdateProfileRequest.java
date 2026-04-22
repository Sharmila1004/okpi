package com.laerdal.okpi.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    @Email
    private String email;
}

