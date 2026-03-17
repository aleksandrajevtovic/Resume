package com.portfolio.backend.controller;

import com.portfolio.backend.dto.ProjectRequest;
import com.portfolio.backend.model.Project;
import com.portfolio.backend.repository.ProjectRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/projects")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProjectController {

    private final ProjectRepository projectRepository;

    public AdminProjectController(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @GetMapping
    public List<Project> getAll() {
        return projectRepository.findAllByOrderBySortOrderAsc();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Project create(@Valid @RequestBody ProjectRequest request) {
        Project project = new Project();
        copyRequest(project, request);
        return saveWithNormalizedSortOrder(project);
    }

    @PutMapping("/{id}")
    public Project update(@PathVariable String id, @Valid @RequestBody ProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        copyRequest(project, request);
        return saveWithNormalizedSortOrder(project);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        List<Project> projects = new ArrayList<>(projectRepository.findAllByOrderBySortOrderAsc());
        projects.removeIf(existing -> id.equals(existing.getId()));
        normalizeSortOrders(projects);
        projectRepository.saveAll(projects);
        projectRepository.delete(project);
    }

    private void copyRequest(Project project, ProjectRequest request) {
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setTitleEn(request.getTitleEn());
        project.setTitleDe(request.getTitleDe());
        project.setDescriptionEn(request.getDescriptionEn());
        project.setDescriptionDe(request.getDescriptionDe());
        project.setTitleKey(request.getTitleKey());
        project.setDescriptionKey(request.getDescriptionKey());
        project.setImageUrl(request.getImageUrl());
        project.setTechStack(request.getTechStack());
        project.setLiveUrl(request.getLiveUrl());
        project.setGithubUrl(request.getGithubUrl());
        project.setSortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder());
    }

    private Project saveWithNormalizedSortOrder(Project project) {
        List<Project> projects = new ArrayList<>(projectRepository.findAllByOrderBySortOrderAsc());
        String projectId = project.getId();

        projects.removeIf(existing -> existing.getId() != null && existing.getId().equals(projectId));

        int requestedIndex = project.getSortOrder() == null ? projects.size() : project.getSortOrder();
        int normalizedIndex = Math.max(0, Math.min(requestedIndex, projects.size()));
        projects.add(normalizedIndex, project);

        normalizeSortOrders(projects);
        return projectRepository.saveAll(projects).get(normalizedIndex);
    }

    private void normalizeSortOrders(List<Project> projects) {
        for (int index = 0; index < projects.size(); index++) {
            projects.get(index).setSortOrder(index);
        }
    }
}
