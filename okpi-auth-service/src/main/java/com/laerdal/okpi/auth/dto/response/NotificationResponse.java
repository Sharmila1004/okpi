package com.laerdal.okpi.auth.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private Long userId;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
}
