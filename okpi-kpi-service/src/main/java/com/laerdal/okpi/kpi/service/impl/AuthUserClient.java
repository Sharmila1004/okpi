package com.laerdal.okpi.kpi.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Service
public class AuthUserClient {

    private static final Logger log = LoggerFactory.getLogger(AuthUserClient.class);
    private final RestTemplate restTemplate;
    private final String authBaseUrl;
    private final String internalToken;

    public AuthUserClient(RestTemplate restTemplate,
                          @Value("${services.auth.baseUrl:http://localhost:8081}") String authBaseUrl,
                          @Value("${services.internal.token:okpi-internal-token}") String internalToken) {
        this.restTemplate = restTemplate;
        this.authBaseUrl = authBaseUrl;
        this.internalToken = internalToken;
    }

    public List<UserSummary> getUsersSummary(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        try {
            UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(buildUrl("/api/v1/auth/users/summary"));
            ids.forEach(id -> builder.queryParam("ids", id));
            String url = builder.toUriString();
            ResponseEntity<UserSummary[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers()),
                    UserSummary[].class
            );
            UserSummary[] arr = response.getBody();
            if (arr == null) {
                log.warn("Auth service returned no user summaries for ids={}", ids);
                return List.of();
            }
            if (arr.length < ids.size()) {
                log.warn("Auth service returned partial user summaries (requested={} returned={})", ids.size(), arr.length);
            }
            return Arrays.asList(arr);
        } catch (Exception ex) {
            log.error("Failed to fetch user summaries from auth-service: {}", ex.getMessage());
            return List.of();
        }
    }

    public List<UserSummary> getUsersByRole(String role) {
        if (!StringUtils.hasText(role)) return List.of();
        try {
            String url = UriComponentsBuilder.fromHttpUrl(buildUrl("/api/v1/auth/users"))
                    .queryParam("page", 0)
                    .queryParam("size", 1000)
                    .queryParam("role", role)
                    .toUriString();
            ResponseEntity<PagedUserResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers()),
                    PagedUserResponse.class
            );
            PagedUserResponse body = response.getBody();
            if (body == null || body.content == null) return List.of();
            return body.content.stream().filter(Objects::nonNull).toList();
        } catch (Exception ex) {
            log.warn("Failed to fetch users by role from auth-service: {}", ex.getMessage());
            return List.of();
        }
    }

    private String buildUrl(String path) {
        return authBaseUrl.endsWith("/") ? authBaseUrl + path.substring(1) : authBaseUrl + path;
    }

    private HttpHeaders headers() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-OKPI-Internal-Token", internalToken);
        return headers;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class UserSummary {
        public Long id;
        public String email;
        public String role;
        public Long managerId;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PagedUserResponse {
        public List<UserSummary> content;
    }
}
