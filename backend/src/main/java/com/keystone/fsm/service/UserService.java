package com.keystone.fsm.service;

import com.keystone.fsm.dto.RegisterRequest;
import com.keystone.fsm.dto.UserDTO;
import com.keystone.fsm.entity.Role;
import com.keystone.fsm.entity.Technician;
import com.keystone.fsm.entity.User;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.TechnicianRepository;
import com.keystone.fsm.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final TechnicianRepository technicianRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       TechnicianRepository technicianRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.technicianRepository = technicianRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(DtoMapper::toUserDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));
        return DtoMapper.toUserDTO(user);
    }

    @Transactional
    public UserDTO createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        Role role = Role.valueOf(request.getRole().toUpperCase());
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .active(true)
                .build();

        user = userRepository.save(user);

        if (role == Role.TECHNICIAN) {
            Technician tech = Technician.builder()
                    .user(user)
                    .employeeCode("TECH-" + String.format("%04d", (int)(Math.random() * 10000)))
                    .specialization("General Maintenance")
                    .availability("AVAILABLE")
                    .build();
            technicianRepository.save(tech);
        }

        return DtoMapper.toUserDTO(user);
    }

    @Transactional
    public UserDTO updateUser(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        user.setFullName(dto.getFullName());
        user.setPhone(dto.getPhone());
        user.setActive(dto.isActive());
        
        if (dto.getRole() != null) {
            user.setRole(Role.valueOf(dto.getRole().toUpperCase()));
        }

        user = userRepository.save(user);
        return DtoMapper.toUserDTO(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found with ID: " + id);
        }
        userRepository.deleteById(id);
    }
}
