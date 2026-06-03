package com.laerdal.okpi.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.laerdal.okpi.auth.dto.response.NotificationResponse;
import com.laerdal.okpi.auth.security.CustomUserDetailsService;
import com.laerdal.okpi.auth.security.JwtTokenProvider;
import com.laerdal.okpi.auth.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.springframework.boot.test.mock.mockito.MockBean
    private NotificationService notificationService;

    @org.springframework.boot.test.mock.mockito.MockBean
    private JwtTokenProvider jwtTokenProvider;

    @org.springframework.boot.test.mock.mockito.MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void getNotificationsReturnsCurrentUserNotifications() throws Exception {
        List<NotificationResponse> response = List.of(
                NotificationResponse.builder()
                        .id(1L)
                        .userId(7L)
                        .message("Team updated")
                        .read(false)
                        .createdAt(LocalDateTime.parse("2026-04-28T10:15:30"))
                        .build()
        );
        when(notificationService.getCurrentUserNotifications("admin@example.com")).thenReturn(response);

        mockMvc.perform(get("/api/v1/notifications")
                        .principal(() -> "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].message").value("Team updated"))
                .andExpect(jsonPath("$[0].userId").value(7));

        verify(notificationService).getCurrentUserNotifications("admin@example.com");
    }
}
