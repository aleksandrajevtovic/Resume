package com.portfolio.backend.controller;

import org.springframework.beans.factory.annotation.Value;
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
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/uploads")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

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
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
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
}
