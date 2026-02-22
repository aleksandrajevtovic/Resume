package com.portfolio.backend.dto;

public record AuthResponse(
        String token,
        String username
) {
}
