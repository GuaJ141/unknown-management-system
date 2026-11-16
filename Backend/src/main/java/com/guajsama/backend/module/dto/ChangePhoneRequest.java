package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePhoneRequest(
        @NotBlank @Size(max = 50) String name,
        @NotBlank @Pattern(regexp = "(?i)^[0-9]{17}[0-9x]$") String idCard,
        @NotBlank @Pattern(regexp = "^1[3-9][0-9]{9}$") String phone
) {
}
