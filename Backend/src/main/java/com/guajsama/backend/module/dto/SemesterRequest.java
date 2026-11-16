package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SemesterRequest(
        @NotBlank @Size(max = 20) String semester
) {
}
