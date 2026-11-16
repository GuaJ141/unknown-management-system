package com.guajsama.backend.module.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BatchStudentRegistrationRequest(
        @NotEmpty @Size(max = 500) List<@NotNull @Valid StudentRegistrationRequest> students
) {
}
