package com.keystone.fsm.service;

import com.keystone.fsm.dto.DashboardSummaryDTO;
import com.keystone.fsm.entity.WorkOrder;
import com.keystone.fsm.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final WorkOrderRepository workOrderRepository;

    public DashboardService(WorkOrderRepository workOrderRepository) {
        this.workOrderRepository = workOrderRepository;
    }

    public DashboardSummaryDTO getSummary() {
        List<WorkOrder> allOrders = workOrderRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        long total = allOrders.size();
        long pending = 0; // NEW
        long assigned = 0;
        long inProgress = 0;
        long onHold = 0;
        long completed = 0;
        long closed = 0;
        long overdue = 0;

        Map<String, Long> statusDist = new HashMap<>();
        Map<String, Long> priorityDist = new HashMap<>();
        Map<String, Long> monthlyDist = new HashMap<>();

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM yyyy");

        for (WorkOrder order : allOrders) {
            String status = order.getStatus();
            String priority = order.getPriority();
            
            // Count status
            statusDist.put(status, statusDist.getOrDefault(status, 0L) + 1);
            if ("NEW".equals(status)) pending++;
            else if ("ASSIGNED".equals(status)) assigned++;
            else if ("IN_PROGRESS".equals(status)) inProgress++;
            else if ("ON_HOLD".equals(status)) onHold++;
            else if ("COMPLETED".equals(status)) completed++;
            else if ("CLOSED".equals(status)) closed++;

            // Count priority
            priorityDist.put(priority, priorityDist.getOrDefault(priority, 0L) + 1);

            // Group by month
            if (order.getCreatedAt() != null) {
                String monthKey = order.getCreatedAt().format(monthFormatter);
                monthlyDist.put(monthKey, monthlyDist.getOrDefault(monthKey, 0L) + 1);
            }

            // Check overdue
            if (order.getSlaDueDate() != null && order.getSlaDueDate().isBefore(now)
                    && !"COMPLETED".equals(status) && !"CLOSED".equals(status) && !"CANCELLED".equals(status)) {
                overdue++;
            }
        }

        return DashboardSummaryDTO.builder()
                .totalWorkOrders(total)
                .pendingCount(pending)
                .assignedCount(assigned)
                .inProgressCount(inProgress)
                .onHoldCount(onHold)
                .completedCount(completed)
                .closedCount(closed)
                .overdueCount(overdue)
                .statusDistribution(statusDist)
                .priorityDistribution(priorityDist)
                .monthlyRequests(monthlyDist)
                .build();
    }
}
