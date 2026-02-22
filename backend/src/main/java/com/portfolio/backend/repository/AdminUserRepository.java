package com.portfolio.backend.repository;

import com.portfolio.backend.model.AdminUser;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface AdminUserRepository extends MongoRepository<AdminUser, String> {
    Optional<AdminUser> findByUsername(String username);
}
