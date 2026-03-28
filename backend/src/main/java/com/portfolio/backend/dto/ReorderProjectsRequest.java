package com.portfolio.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ReorderProjectsRequest(
        @NotEmpty List<@NotNull String> projectIds
) {
}
