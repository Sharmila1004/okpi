package com.laerdal.okpi.kpi.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AuthNotificationClient {

    private static final Logger log = LoggerFactory.getLogger(AuthNotificationClient.class);
    private final RestTemplate restTemplate;
    private final String authBaseUrl;
    private final String internalToken;

    public AuthNotificationClient(RestTemplate restTemplate,
                                  @Value("${services.auth.baseUrl:http://localhost:8081}") String authBaseUrl,
                                  @Value("${services.internal.token:okpi-internal-token}") String internalToken) {
        this.restTemplate = restTemplate;
        this.authBaseUrl = authBaseUrl;
        this.internalToken = internalToken;
    }

    public void createNotifications(Map<Long, String> notifications) {
        if (notifications == null || notifications.isEmpty()) return;
        try {
            String url = authBaseUrl.endsWith("/")
                    ? authBaseUrl + "api/v1/notifications"
                    : authBaseUrl + "/api/v1/notifications";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.add("X-OKPI-Internal-Token", internalToken);
            HttpEntity<Map<Long, String>> entity = new HttpEntity<>(notifications, headers);
            restTemplate.exchange(url, HttpMethod.POST, entity, Void.class);
        } catch (Exception ex) {
            log.warn("Failed to post notifications to auth-service: {}", ex.getMessage());
        }
    }
}
