package com.keystone.fsm.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRequestDTO {
    private Long id;
    private Long customerId;
    private String customerName;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotBlank(message = "Priority is required")
    private String priority; // LOW, MEDIUM, HIGH, EMERGENCY

    private String serviceType;

    private String status; // NEW, REVIEWED, REJECTED, WORK_ORDER_CREATED, CANCELLED
    private LocalDateTime createdAt;

    private BigDecimal amount;
    private String paymentStatus;
    private String razorpayOrderId;
    private String razorpayPaymentId;
}
