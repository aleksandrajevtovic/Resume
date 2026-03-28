package com.portfolio.backend.controller;

import com.portfolio.backend.config.UploadPathResolver;
import com.portfolio.backend.model.ContentBlock;
import com.portfolio.backend.repository.ContentBlockRepository;
import com.portfolio.backend.upload.CloudinaryMediaService;
import com.portfolio.backend.upload.StoredAsset;
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
    private static final String CV_EN_PUBLIC_ID_KEY = "CV.EN.FILE.PUBLIC_ID";
    private static final String CV_DE_PUBLIC_ID_KEY = "CV.DE.FILE.PUBLIC_ID";
    private static final String CV_EN_RESOURCE_TYPE_KEY = "CV.EN.FILE.RESOURCE_TYPE";
    private static final String CV_DE_RESOURCE_TYPE_KEY = "CV.DE.FILE.RESOURCE_TYPE";

    private final ContentBlockRepository contentBlockRepository;
    private final UploadPathResolver uploadPathResolver;
    private final CloudinaryMediaService cloudinaryMediaService;

    public AdminUploadController(
            ContentBlockRepository contentBlockRepository,
            UploadPathResolver uploadPathResolver,
            CloudinaryMediaService cloudinaryMediaService
    ) {
        this.contentBlockRepository = contentBlockRepository;
        this.uploadPathResolver = uploadPathResolver;
        this.cloudinaryMediaService = cloudinaryMediaService;
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
            if (cloudinaryMediaService.isConfigured()) {
                String safeBaseName = sanitizeBaseName(originalFilename);
                StoredAsset asset = cloudinaryMediaService.uploadImage(file, safeBaseName);
                return Map.of("imagePath", asset.publicUrl(), "imageUrl", asset.publicUrl());
            }

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
            String previousPath = contentBlockRepository.findByKey(cvKey(normalizedLang))
                    .map(ContentBlock::getValue)
                    .orElse(null);
            StoredAsset previousAsset = loadStoredCvAsset(normalizedLang, previousPath);

            if (cloudinaryMediaService.isConfigured()) {
                String publicId = buildCloudinaryCvPublicId(originalFilename, normalizedLang);
                StoredAsset uploadedAsset = cloudinaryMediaService.uploadRawFile(file, publicId);
                upsertCvContentBlock(normalizedLang, uploadedAsset.publicUrl());
                upsertCvMetadata(normalizedLang, uploadedAsset);
                removeStoredCvIfReplaced(previousAsset, uploadedAsset.publicUrl());
                return Map.of(
                        "filePath", uploadedAsset.publicUrl(),
                        "fileUrl", uploadedAsset.publicUrl()
                );
            }

            Path uploadPath = uploadPathResolver.resolveUploadPath();
            Files.createDirectories(uploadPath);

            String generatedName = buildCvFilename(originalFilename, normalizedLang, previousPath);
            Path targetPath = uploadPath.resolve(generatedName).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            String filePath = "/uploads/" + generatedName;
            upsertCvContentBlock(normalizedLang, filePath);
            clearCvMetadata(normalizedLang);
            removeStoredCvIfReplaced(previousAsset, filePath);

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

        deleteStoredUploadIfPresent(loadStoredCvAsset(normalizedLang, existingBlock.getValue()));
        contentBlockRepository.delete(existingBlock);
        clearCvMetadata(normalizedLang);
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

    private String cvPublicIdKey(String lang) {
        return "EN".equals(lang) ? CV_EN_PUBLIC_ID_KEY : CV_DE_PUBLIC_ID_KEY;
    }

    private String cvResourceTypeKey(String lang) {
        return "EN".equals(lang) ? CV_EN_RESOURCE_TYPE_KEY : CV_DE_RESOURCE_TYPE_KEY;
    }

    private void upsertCvContentBlock(String lang, String filePath) {
        upsertContentBlock(cvKey(lang), filePath);
    }

    private void upsertCvMetadata(String lang, StoredAsset asset) {
        upsertContentBlock(cvPublicIdKey(lang), asset.publicId());
        upsertContentBlock(cvResourceTypeKey(lang), asset.resourceType());
    }

    private void upsertContentBlock(String key, String value) {
        ContentBlock block = contentBlockRepository.findByKey(key).orElseGet(ContentBlock::new);
        block.setKey(key);
        block.setValue(value);
        contentBlockRepository.save(block);
    }

    private void clearCvMetadata(String lang) {
        deleteContentBlockIfPresent(cvPublicIdKey(lang));
        deleteContentBlockIfPresent(cvResourceTypeKey(lang));
    }

    private void deleteContentBlockIfPresent(String key) {
        contentBlockRepository.findByKey(key).ifPresent(contentBlockRepository::delete);
    }

    private StoredAsset loadStoredCvAsset(String lang, String currentPath) {
        String publicId = contentBlockRepository.findByKey(cvPublicIdKey(lang))
                .map(ContentBlock::getValue)
                .orElse("");
        String resourceType = contentBlockRepository.findByKey(cvResourceTypeKey(lang))
                .map(ContentBlock::getValue)
                .orElse("");
        return new StoredAsset(currentPath, publicId, resourceType);
    }

    private void removeStoredCvIfReplaced(StoredAsset previousAsset, String nextPath) {
        if (previousAsset == null || previousAsset.publicUrl() == null || nextPath.equals(previousAsset.publicUrl())) {
            return;
        }
        deleteStoredUploadIfPresent(previousAsset);
    }

    private void deleteStoredUploadIfPresent(StoredAsset storedAsset) {
        if (storedAsset == null || storedAsset.publicUrl() == null || storedAsset.publicUrl().isBlank()) {
            return;
        }

        if (storedAsset.publicUrl().startsWith("http://") || storedAsset.publicUrl().startsWith("https://")) {
            cloudinaryMediaService.delete(storedAsset);
            return;
        }

        Path uploadPath = uploadPathResolver.resolveUploadPath();
        deleteFileIfWithinUploadDir(storedAsset.publicUrl(), uploadPath);
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

    private String buildCloudinaryCvPublicId(String originalFilename, String lang) {
        String cleanedFilename = StringUtils.cleanPath(originalFilename == null ? "" : originalFilename).trim();
        String baseName = cleanedFilename;
        int dotIndex = baseName.lastIndexOf('.');
        if (dotIndex > 0) {
            baseName = baseName.substring(0, dotIndex);
        }

        String sanitizedBaseName = baseName
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");

        if (sanitizedBaseName.isBlank()) {
            sanitizedBaseName = "cv-" + lang.toLowerCase();
        }

        return lang.toLowerCase() + "/" + sanitizedBaseName + ".pdf";
    }
}
