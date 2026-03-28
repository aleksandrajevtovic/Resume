package com.portfolio.backend.upload;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryMediaService {

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${app.cloudinary.folder:portfolio}")
    private String rootFolder;

    public boolean isConfigured() {
        return !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    public StoredAsset uploadImage(MultipartFile file, String baseName) {
        ensureConfigured();
        try {
            Map<?, ?> response = cloudinary().uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", buildFolder("images"),
                            "resource_type", "image",
                            "use_filename", true,
                            "unique_filename", true,
                            "filename_override", baseName,
                            "overwrite", false
                    )
            );
            return toStoredAsset(response, "image");
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image upload failed");
        }
    }

    public StoredAsset uploadRawFile(MultipartFile file, String publicId) {
        ensureConfigured();
        try {
            Map<?, ?> response = cloudinary().uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", buildFolder("cv"),
                            "resource_type", "raw",
                            "public_id", publicId,
                            "overwrite", true,
                            "use_filename", false,
                            "unique_filename", false
                    )
            );
            return toStoredAsset(response, "raw");
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "CV upload failed");
        }
    }

    public void delete(StoredAsset asset) {
        if (!isConfigured() || asset == null || asset.publicId() == null || asset.publicId().isBlank()) {
            return;
        }

        try {
            cloudinary().uploader().destroy(
                    asset.publicId(),
                    ObjectUtils.asMap(
                            "resource_type", asset.resourceType(),
                            "invalidate", true
                    )
            );
        } catch (Exception ignored) {
        }
    }

    private Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
    }

    private StoredAsset toStoredAsset(Map<?, ?> response, String defaultResourceType) {
        String secureUrl = stringValue(response.get("secure_url"));
        String publicId = stringValue(response.get("public_id"));
        Object resourceTypeValue = response.containsKey("resource_type")
                ? response.get("resource_type")
                : defaultResourceType;
        String resourceType = stringValue(resourceTypeValue);
        return new StoredAsset(secureUrl, publicId, resourceType.isBlank() ? defaultResourceType : resourceType);
    }

    private String buildFolder(String suffix) {
        return rootFolder.endsWith("/") ? rootFolder + suffix : rootFolder + "/" + suffix;
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cloudinary is not configured");
        }
    }
}
