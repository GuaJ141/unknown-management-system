package com.guajsama.backend.module.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @JsonProperty("login_no") @JsonAlias({"loginNo", "loginAccount"})
        @NotBlank @Size(max = 30) String loginNo,
        @NotBlank @Size(max = 64) String password
) {
}
