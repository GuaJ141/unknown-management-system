package com.guajsama.backend.module.vo;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LoginResponse(
        String token,
        Long userId,
        int role,
        boolean mustChangePassword,
        @JsonProperty("login_no") String loginNo
) {
}
