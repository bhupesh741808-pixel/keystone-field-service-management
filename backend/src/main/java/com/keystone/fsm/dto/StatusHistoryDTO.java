package com.keystone.fsm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusHistoryDTO {
    private Long id;
    private Long workOrderId;
    private String previousStatus;
    private String currentStatus;
    private String changedBy;
    private LocalDateTime changedAt;
}
