package com.portfolio.backend.controller;

import com.portfolio.backend.model.ContentBlock;
import com.portfolio.backend.repository.ContentBlockRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/content")
public class PublicContentController {

    private final ContentBlockRepository contentBlockRepository;

    public PublicContentController(ContentBlockRepository contentBlockRepository) {
        this.contentBlockRepository = contentBlockRepository;
    }

    @GetMapping
    public List<ContentBlock> getAll() {
        return contentBlockRepository.findAllByOrderByKeyAsc();
    }
}
