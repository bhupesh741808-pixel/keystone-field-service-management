package com.meridian.fieldservice.service;

import com.meridian.fieldservice.dto.UserRequest;
import com.meridian.fieldservice.dto.UserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface UserService extends UserDetailsService {

    UserResponse createUser(UserRequest request);

    UserResponse updateUser(Long id, UserRequest request);

    UserResponse getUserById(Long id);

    Page<UserResponse> getAllUsers(Pageable pageable);

    Page<UserResponse> searchUsers(String keyword, Pageable pageable);

    void deleteUser(Long id);

    UserResponse getCurrentUser(); // get authenticated user info
}