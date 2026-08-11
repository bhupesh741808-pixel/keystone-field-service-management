package com.keystone.fsm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TechnicianDTO {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String employeeCode;
    private String specialization;
    private String availability;
}
