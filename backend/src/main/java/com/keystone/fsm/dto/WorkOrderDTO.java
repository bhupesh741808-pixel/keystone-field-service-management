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
public class WorkOrderDTO {
    private Long id;
    private String workOrderNumber;
    private Long requestId;
    private Long customerId;
    private String customerName;
    private Long siteId;
    private String siteName;
    private String siteAddress;
    private String siteCity;
    private Long assignedToId;
    private String assignedToName;
    private String priority;
    private String status;
    private LocalDateTime slaDueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
