package com.portfolio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank
        @Size(min = 3, max = 40)
        @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "Username may only contain letters, numbers, dots, underscores, and hyphens")
        String username,
        @NotBlank
        @Size(min = 8, max = 120)
        String password
) {
}
