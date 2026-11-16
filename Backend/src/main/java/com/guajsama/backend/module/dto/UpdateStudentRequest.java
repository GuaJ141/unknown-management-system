package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateStudentRequest(
        @NotBlank @Size(max = 50) String name,
        @NotBlank @Pattern(regexp = "^1[3-9][0-9]{9}$") String phone,
        @Min(0) @Max(1) Integer gender,
        LocalDate birth,
        @NotNull @Min(1901) @Max(2155) Integer enrollmentYear,
        @NotNull @Min(1901) @Max(2155) Integer graduationYear,
        @NotNull @Positive Integer studyDuration
) {
}
