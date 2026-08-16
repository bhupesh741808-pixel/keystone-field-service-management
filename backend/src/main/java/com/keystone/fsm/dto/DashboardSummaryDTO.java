package com.keystone.fsm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDTO {
    private long totalWorkOrders;
    private long pendingCount; // NEW
    private long assignedCount;
    private long inProgressCount;
    private long onHoldCount;
    private long completedCount;
    private long closedCount;
    private long overdueCount;

    private Map<String, Long> statusDistribution;
    private Map<String, Long> priorityDistribution;
    private Map<String, Long> monthlyRequests;
}
