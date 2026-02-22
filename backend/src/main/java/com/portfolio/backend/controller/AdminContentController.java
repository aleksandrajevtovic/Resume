package com.portfolio.backend.controller;

import com.portfolio.backend.dto.ContentBlockRequest;
import com.portfolio.backend.model.ContentBlock;
import com.portfolio.backend.repository.ContentBlockRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/content")
@PreAuthorize("hasRole('ADMIN')")
public class AdminContentController {

    private final ContentBlockRepository contentBlockRepository;

    public AdminContentController(ContentBlockRepository contentBlockRepository) {
        this.contentBlockRepository = contentBlockRepository;
    }

    @GetMapping
    public List<ContentBlock> getAll() {
        return contentBlockRepository.findAllByOrderByKeyAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContentBlock create(@Valid @RequestBody ContentBlockRequest request) {
        contentBlockRepository.findByKey(request.getKey().trim()).ifPresent(existing -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Content key already exists");
        });

        ContentBlock block = new ContentBlock();
        copyRequest(block, request);
        return contentBlockRepository.save(block);
    }

    @PutMapping("/{id}")
    public ContentBlock update(@PathVariable String id, @Valid @RequestBody ContentBlockRequest request) {
        ContentBlock block = contentBlockRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Content block not found"));

        String requestedKey = request.getKey().trim();
        contentBlockRepository.findByKey(requestedKey).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Content key already exists");
            }
        });

        copyRequest(block, request);
        return contentBlockRepository.save(block);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        if (!contentBlockRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Content block not found");
        }
        contentBlockRepository.deleteById(id);
    }

    private void copyRequest(ContentBlock block, ContentBlockRequest request) {
        block.setKey(request.getKey().trim());
        block.setValue(request.getValue().trim());
    }
}
