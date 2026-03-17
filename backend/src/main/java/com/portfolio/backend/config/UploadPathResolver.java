package com.portfolio.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class UploadPathResolver {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public Path resolveUploadPath() {
        Path configuredPath = Paths.get(uploadDir);
        if (configuredPath.isAbsolute()) {
            return configuredPath.normalize();
        }

        Path workingDir = Paths.get("").toAbsolutePath().normalize();
        Path backendModuleDir = detectBackendModuleDir(workingDir);
        return backendModuleDir.resolve(configuredPath).normalize();
    }

    private Path detectBackendModuleDir(Path workingDir) {
        Path nestedBackendDir = workingDir.resolve("backend");
        if (Files.isDirectory(nestedBackendDir.resolve("src").resolve("main"))) {
            return nestedBackendDir;
        }

        if (Files.isDirectory(workingDir.resolve("src").resolve("main"))) {
            return workingDir;
        }

        return workingDir;
    }
}
