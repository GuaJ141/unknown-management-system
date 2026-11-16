package com.guajsama.backend.module.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record EnterScoreRequest(
        @NotNull @Positive Long studentId,
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal score
) {
}
