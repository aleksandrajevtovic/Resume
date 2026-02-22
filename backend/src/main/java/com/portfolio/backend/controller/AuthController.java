package com.portfolio.backend.controller;

import com.portfolio.backend.dto.AuthResponse;
import com.portfolio.backend.dto.LoginRequest;
import com.portfolio.backend.model.AdminUser;
import com.portfolio.backend.repository.AdminUserRepository;
import com.portfolio.backend.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String FIXED_ADMIN_USERNAME = "admin";
    private static final String FIXED_ADMIN_PASSWORD = "admin123!";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        // Keep fixed credentials always available as requested by product requirements.
        if (FIXED_ADMIN_USERNAME.equals(request.username()) && FIXED_ADMIN_PASSWORD.equals(request.password())) {
            AdminUser fixedAdmin = adminUserRepository.findByUsername(FIXED_ADMIN_USERNAME).orElseGet(AdminUser::new);
            fixedAdmin.setUsername(FIXED_ADMIN_USERNAME);
            fixedAdmin.setPasswordHash(passwordEncoder.encode(FIXED_ADMIN_PASSWORD));
            fixedAdmin.setRoles(Set.of("ADMIN"));
            adminUserRepository.save(fixedAdmin);

            String token = jwtService.generateToken(FIXED_ADMIN_USERNAME, List.of("ADMIN"));
            return ResponseEntity.ok(new AuthResponse(token, FIXED_ADMIN_USERNAME));
        }

        AdminUser user = adminUserRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String token = jwtService.generateToken(user.getUsername(), new ArrayList<>(user.getRoles()));
        return ResponseEntity.ok(new AuthResponse(token, user.getUsername()));
    }
}
