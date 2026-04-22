package com.laerdal.okpi.objective.exception;

import com.laerdal.okpi.objective.dto.response.ErrorResponse;
import com.laerdal.okpi.objective.dto.response.ValidationErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return new ErrorResponse(
                LocalDateTime.now(), 404, "Not Found",
                ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicate(DuplicateResourceException ex, HttpServletRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        return new ErrorResponse(
                LocalDateTime.now(), 409, "Conflict",
                ex.getMessage(), request.getRequestURI());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> fieldErrors.put(error.getField(), error.getDefaultMessage()));
        log.warn("Validation failed: {}", fieldErrors);
        return new ValidationErrorResponse(
                LocalDateTime.now(), 400, "Bad Request",
                "Validation failed", request.getRequestURI(), fieldErrors);
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorResponse handleMissingHeader(MissingRequestHeaderException ex, HttpServletRequest request) {
        log.warn("Missing request header: {} - {}", ex.getHeaderName(), ex.getMessage());
        return new ErrorResponse(
                LocalDateTime.now(), HttpStatus.UNAUTHORIZED.value(), "Unauthorized",
                "Missing required header: " + ex.getHeaderName(), request.getRequestURI());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        HttpStatus status = HttpStatus.FORBIDDEN;
        if (ex.getMessage() != null && ex.getMessage().toLowerCase().contains("missing authentication")) {
            status = HttpStatus.UNAUTHORIZED;
        }
        ErrorResponse body = new ErrorResponse(LocalDateTime.now(), status.value(), status.getReasonPhrase(), ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneral(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error", ex);
        return new ErrorResponse(
                LocalDateTime.now(), 500, "Internal Server Error",
                "An unexpected error occurred", request.getRequestURI());
    }
}
