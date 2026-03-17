package com.portfolio.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final UploadPathResolver uploadPathResolver;

    public WebMvcConfig(UploadPathResolver uploadPathResolver) {
        this.uploadPathResolver = uploadPathResolver;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path absoluteUploadPath = uploadPathResolver.resolveUploadPath();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absoluteUploadPath + "/");
    }
}
