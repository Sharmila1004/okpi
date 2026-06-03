package com.laerdal.okpi.kpi.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Component
public class RequestContext {

    public Long getUserId() {
        try {
            String header = currentRequest().getHeader("X-User-Id");
            return header == null || header.isBlank() ? null : Long.valueOf(header);
        } catch (RuntimeException ex) {
            // No request bound to context or invalid header
            return null;
        }
    }

    public String getUserRole() {
        try {
            return currentRequest().getHeader("X-User-Role");
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private HttpServletRequest currentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) throw new IllegalStateException("No request bound to current thread");
        return attributes.getRequest();
    }
}
