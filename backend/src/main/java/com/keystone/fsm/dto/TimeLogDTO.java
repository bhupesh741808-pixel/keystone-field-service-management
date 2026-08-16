package com.keystone.fsm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeLogDTO {
    private Long id;
    private Long workOrderId;
    private Long technicianId;
    private String technicianName;

    @NotNull(message = "Minutes are required")
    private Integer minutes;

    private String notes;
    private LocalDateTime loggedAt;
}
