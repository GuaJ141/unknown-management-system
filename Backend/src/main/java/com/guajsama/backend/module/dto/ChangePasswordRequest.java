package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank @Size(max = 50) String name,
        @NotBlank @Pattern(regexp = "(?i)^[0-9]{17}[0-9x]$") String idCard,
        @NotBlank @Size(min = 8, max = 64) String newPassword
) {
}
