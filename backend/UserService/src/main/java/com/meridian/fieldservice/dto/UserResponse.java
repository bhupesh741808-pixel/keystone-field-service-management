package com.meridian.fieldservice.dto;

import com.meridian.fieldservice.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private Boolean enabled;
    private String createdBy;
    private OffsetDateTime createdDate;
    private String lastModifiedBy;
    private OffsetDateTime lastModifiedDate;
    private Integer version;
}