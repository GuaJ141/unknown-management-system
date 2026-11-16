package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CourseRequest(
        @NotBlank @Size(max = 30) String courseCode,
        @NotBlank @Size(max = 100) String name,
        @NotNull @DecimalMin("0.1") @DecimalMax("99.9") @Digits(integer = 2, fraction = 1) BigDecimal credit,
        @NotNull @Positive Integer hours,
        @NotBlank @Size(max = 20) String assessType,
        @NotNull @Positive Long teacherId,
        @NotNull @Min(1) @Max(3) Integer courseType,
        @NotNull @Min(0) @Max(2) Integer status
) {
}
