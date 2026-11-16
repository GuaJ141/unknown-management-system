package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateClassRequest(
        @NotBlank @Size(max = 50) String className,
        @NotBlank @Size(max = 10) String grade,
        @NotNull @Min(1901) @Max(2155) Integer enrollmentYear,
        @NotNull @Min(1901) @Max(2155) Integer graduationYear,
        @NotNull @Min(0) @Max(1) Integer status
) {
}
