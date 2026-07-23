package com.meridian.fieldservice.config;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class SpringSecurityAuditorAware implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // If no authentication or not authenticated, use a system default.
        // This prevents errors during startup or when no user is logged in.
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.of("system");
        }
        // Otherwise return the username from the token/principal
        return Optional.of(authentication.getName());
    }
}