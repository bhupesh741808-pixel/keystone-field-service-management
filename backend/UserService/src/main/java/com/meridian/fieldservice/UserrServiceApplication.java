package com.meridian.fieldservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
@EnableMethodSecurity(prePostEnabled = true)
@EnableCaching   // if you use Redis caching
public class UserrServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserrServiceApplication.class, args);
    }
    
}
