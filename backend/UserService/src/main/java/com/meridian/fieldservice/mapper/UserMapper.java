package com.meridian.fieldservice.mapper;

import com.meridian.fieldservice.dto.UserRequest;
import com.meridian.fieldservice.dto.UserResponse;
import com.meridian.fieldservice.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    /**
     * Converts a UserRequest DTO to a User entity.
     * Password is set separately in the service (encoded).
     * Audit fields and ID are left empty – they will be set by JPA auditing and the database.
     */
    public User toEntity(UserRequest request) {
        if (request == null) {
            return null;
        }
        User user = new User();
        user.setUsername(request.getUsername());
        // Password is NOT set here – it must be encoded in the service
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());
        user.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        // ID, audit fields, version are not set – they are handled automatically
        return user;
    }

    /**
     * Maps a User entity to a UserResponse DTO.
     */
    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .enabled(user.getEnabled())
                .createdBy(user.getCreatedBy())
                .createdDate(user.getCreatedDate())
                .lastModifiedBy(user.getLastModifiedBy())
                .lastModifiedDate(user.getLastModifiedDate())
                .version(user.getVersion())
                .build();
    }

    /**
     * Updates an existing User entity with non‑null fields from a UserRequest.
     * Password is ignored – it must be updated separately in the service.
     * Audit fields and ID are not updated.
     */
    public void updateEntity(User user, UserRequest request) {
        if (request == null || user == null) {
            return;
        }
        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        // Password is NOT updated here – handle separately
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        if (request.getEnabled() != null) {
            user.setEnabled(request.getEnabled());
        }
        // Do not touch ID, audit fields, or version
    }
}