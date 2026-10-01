package com.keystone.fsm.config;

import com.cloudinary.Cloudinary;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        log.info("Initializing Cloudinary → cloudName=[{}], apiKey present={}",
                cloudName, apiKey != null && !apiKey.isBlank());

        if (cloudName == null || cloudName.isBlank()
                || apiKey == null || apiKey.isBlank()
                || apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException(
                "Missing Cloudinary credentials — check cloudinary.cloud-name / api-key / api-secret");
        }

        Map<String, Object> config = new HashMap<>();
        config.put("cloud_name", cloudName);   
        config.put("api_key",    apiKey);      
        config.put("api_secret", apiSecret);   
        return new Cloudinary(config);
    }
}