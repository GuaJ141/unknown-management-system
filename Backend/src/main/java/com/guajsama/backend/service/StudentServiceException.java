package com.guajsama.backend.service;

import org.springframework.http.HttpStatus;

public class StudentServiceException extends RuntimeException {
    private final HttpStatus status;

    public StudentServiceException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
