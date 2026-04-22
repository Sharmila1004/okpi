package com.laerdal.okpi.objective.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class RequestContext {

    public Long getUserId() {
        String header = currentRequest().getHeader("X-User-Id");
        return header == null || header.isBlank() ? null : Long.valueOf(header);
    }

    public String getUserRole() {
        return currentRequest().getHeader("X-User-Role");
    }

    private HttpServletRequest currentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        return attributes.getRequest();
    }
}
