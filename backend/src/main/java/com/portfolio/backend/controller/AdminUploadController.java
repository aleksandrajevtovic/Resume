package com.portfolio.backend.controller;

import com.portfolio.backend.config.UploadPathResolver;
import com.portfolio.backend.model.ContentBlock;
import com.portfolio.backend.repository.ContentBlockRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/uploads")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUploadController {

    private static final String CV_EN_KEY = "CV.EN.FILE";
    private static final String CV_DE_KEY = "CV.DE.FILE";

    private final ContentBlockRepository contentBlockRepository;
    private final UploadPathResolver uploadPathResolver;

    public AdminUploadController(
            ContentBlockRepository contentBlockRepository,
            UploadPathResolver uploadPathResolver
    ) {
        this.contentBlockRepository = contentBlockRepository;
        this.uploadPathResolver = uploadPathResolver;
    }

    @PostMapping("/image")
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = extractExtension(originalFilename);
        if (!isSupportedImageExtension(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type");
        }

        try {
            Path uploadPath = uploadPathResolver.resolveUploadPath();
            Files.createDirectories(uploadPath);

            String safeBaseName = sanitizeBaseName(originalFilename);
            String generatedName = safeBaseName + "-" + Instant.now().toEpochMilli() + "." + extension;
            Path targetPath = uploadPath.resolve(generatedName).normalize();

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String imagePath = "/uploads/" + generatedName;
            String imageUrl = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + imagePath;
            return Map.of("imagePath", imagePath, "imageUrl", imageUrl);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image upload failed");
        }
    }

    @PostMapping("/cv/{lang}")
    public Map<String, String> uploadCv(
            @PathVariable String lang,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No file uploaded");
        }

        String normalizedLang = normalizeCvLang(lang);
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = extractExtension(originalFilename);
        if (!"pdf".equals(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported CV type. Upload a PDF file.");
        }

        try {
            Path uploadPath = uploadPathResolver.resolveUploadPath();
            Files.createDirectories(uploadPath);
            String previousPath = contentBlockRepository.findByKey(cvKey(normalizedLang))
                    .map(ContentBlock::getValue)
                    .orElse(null);

            String generatedName = buildCvFilename(originalFilename, normalizedLang, previousPath);
            Path targetPath = uploadPath.resolve(generatedName).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String filePath = "/uploads/" + generatedName;
            upsertCvContentBlock(normalizedLang, filePath);
            removeReplacedFileIfPresent(previousPath, filePath, uploadPath);

            return Map.of(
                    "filePath", filePath,
                    "fileUrl", buildPublicUrl(request, filePath)
            );
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "CV upload failed");
        }
    }

    @DeleteMapping("/cv/{lang}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCv(@PathVariable String lang) {
        String normalizedLang = normalizeCvLang(lang);
        String key = cvKey(normalizedLang);
        ContentBlock existingBlock = contentBlockRepository.findByKey(key)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CV not found"));

        deleteStoredUploadIfPresent(existingBlock.getValue());
        contentBlockRepository.delete(existingBlock);
    }

    private String extractExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1).toLowerCase();
    }

    private boolean isSupportedImageExtension(String extension) {
        return extension.equals("png")
                || extension.equals("jpg")
                || extension.equals("jpeg")
                || extension.equals("webp")
                || extension.equals("gif")
                || extension.equals("svg");
    }

    private String sanitizeBaseName(String filename) {
        String name = filename;
        int dotIndex = name.lastIndexOf('.');
        if (dotIndex > 0) {
            name = name.substring(0, dotIndex);
        }
        name = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        return name.isBlank() ? "image" : name;
    }

    private String buildCvFilename(String originalFilename, String lang, String previousPath) {
        String cleanedFilename = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename).trim();
        String baseName = cleanedFilename;
        int dotIndex = baseName.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = baseName.substring(0, dotIndex);
        }

        String sanitizedBaseName = baseName
                .replaceAll("[\\\\/:*?\"<>|]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        if (sanitizedBaseName.isBlank()) {
            sanitizedBaseName = "CV-" + lang;
        }

        String candidate = sanitizedBaseName + ".pdf";
        if (previousPath != null && previousPath.equals("/uploads/" + candidate)) {
            return candidate;
        }

        return candidate;
    }

    private String normalizeCvLang(String lang) {
        String normalized = lang == null ? "" : lang.trim().toUpperCase();
        if (!normalized.equals("EN") && !normalized.equals("DE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported CV language");
        }
        return normalized;
    }

    private String cvKey(String lang) {
        return "EN".equals(lang) ? CV_EN_KEY : CV_DE_KEY;
    }

    private void upsertCvContentBlock(String lang, String filePath) {
        String key = cvKey(lang);
        ContentBlock block = contentBlockRepository.findByKey(key).orElseGet(ContentBlock::new);
        block.setKey(key);
        block.setValue(filePath);
        contentBlockRepository.save(block);
    }

    private void removeReplacedFileIfPresent(String previousPath, String nextPath, Path uploadPath) {
        if (previousPath == null || nextPath.equals(previousPath)) {
            return;
        }

        deleteFileIfWithinUploadDir(previousPath, uploadPath);
    }

    private void deleteStoredUploadIfPresent(String storedPath) {
        Path uploadPath = uploadPathResolver.resolveUploadPath();
        deleteFileIfWithinUploadDir(storedPath, uploadPath);
    }

    private void deleteFileIfWithinUploadDir(String storedPath, Path uploadPath) {
        if (storedPath == null || !storedPath.startsWith("/uploads/")) {
            return;
        }

        try {
            Path targetPath = uploadPath.resolve(storedPath.replaceFirst("^/uploads/", "")).normalize();
            if (!targetPath.startsWith(uploadPath)) {
                return;
            }
            Files.deleteIfExists(targetPath);
        } catch (IOException ignored) {
        }
    }

    private String buildPublicUrl(HttpServletRequest request, String filePath) {
        return request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort() + filePath;
    }
}
