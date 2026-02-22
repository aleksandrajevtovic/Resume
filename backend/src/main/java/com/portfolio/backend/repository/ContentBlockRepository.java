package com.portfolio.backend.repository;

import com.portfolio.backend.model.ContentBlock;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ContentBlockRepository extends MongoRepository<ContentBlock, String> {
    List<ContentBlock> findAllByOrderByKeyAsc();
    Optional<ContentBlock> findByKey(String key);
}
