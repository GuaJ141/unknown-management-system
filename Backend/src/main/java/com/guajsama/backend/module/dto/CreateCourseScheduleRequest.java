package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateCourseScheduleRequest(
        @NotNull @Positive Long courseId,
        @NotNull @Positive Long classId,
        @NotNull @Positive Long teacherId,
        @NotBlank @Size(max = 20) String semester,
        @NotNull @Min(1) @Max(7) Integer weekday,
        @NotNull @Min(1) @Max(12) Integer section,
        @NotNull @Min(1) @Max(255) Integer startWeek,
        @NotNull @Min(1) @Max(255) Integer endWeek,
        @NotBlank @Size(max = 100) String location
) {
}
