package com.keystone.fsm.service;

import com.keystone.fsm.dto.WorkOrderDTO;
import com.keystone.fsm.entity.PartUsage;
import com.keystone.fsm.entity.TimeLog;
import com.keystone.fsm.entity.WorkOrder;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.PartUsageRepository;
import com.keystone.fsm.repository.TimeLogRepository;
import com.keystone.fsm.repository.WorkOrderRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final WorkOrderRepository workOrderRepository;
    private final TimeLogRepository timeLogRepository;
    private final PartUsageRepository partUsageRepository;

    public ReportService(WorkOrderRepository workOrderRepository,
                         TimeLogRepository timeLogRepository,
                         PartUsageRepository partUsageRepository) {
        this.workOrderRepository = workOrderRepository;
        this.timeLogRepository = timeLogRepository;
        this.partUsageRepository = partUsageRepository;
    }

    public Map<String, Object> generateOperationalReport() {
        List<WorkOrder> allOrders = workOrderRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        // 1. Completed & Closed Jobs
        List<WorkOrderDTO> completedJobs = allOrders.stream()
                .filter(w -> "COMPLETED".equals(w.getStatus()) || "CLOSED".equals(w.getStatus()))
                .map(DtoMapper::toWorkOrderDTO)
                .collect(Collectors.toList());

        // 2. Pending Jobs
        List<WorkOrderDTO> pendingJobs = allOrders.stream()
                .filter(w -> !"COMPLETED".equals(w.getStatus()) && !"CLOSED".equals(w.getStatus()) && !"CANCELLED".equals(w.getStatus()))
                .map(DtoMapper::toWorkOrderDTO)
                .collect(Collectors.toList());

        // 3. Overdue Jobs
        List<WorkOrderDTO> overdueJobs = allOrders.stream()
                .filter(w -> w.getSlaDueDate() != null && w.getSlaDueDate().isBefore(now)
                        && !"COMPLETED".equals(w.getStatus()) && !"CLOSED".equals(w.getStatus()) && !"CANCELLED".equals(w.getStatus()))
                .map(DtoMapper::toWorkOrderDTO)
                .collect(Collectors.toList());

        // 4. Technician Performance
        List<TimeLog> allLogs = timeLogRepository.findAll();
        Map<Long, List<TimeLog>> logsByTech = allLogs.stream()
                .collect(Collectors.groupingBy(log -> log.getTechnician().getId()));

        List<Map<String, Object>> techPerformance = new ArrayList<>();
        logsByTech.forEach((techId, logs) -> {
            String techName = logs.isEmpty() ? "Unknown" : logs.get(0).getTechnician().getFullName();
            long totalMinutes = logs.stream().mapToLong(TimeLog::getMinutes).sum();
            long jobsWorkedOn = logs.stream().map(log -> log.getWorkOrder().getId()).distinct().count();
            
            long completedCount = allOrders.stream()
                    .filter(w -> w.getAssignedTo() != null && w.getAssignedTo().getId().equals(techId))
                    .filter(w -> "COMPLETED".equals(w.getStatus()) || "CLOSED".equals(w.getStatus()))
                    .count();

            Map<String, Object> performanceItem = new HashMap<>();
            performanceItem.put("technicianId", techId);
            performanceItem.put("technicianName", techName);
            performanceItem.put("totalHoursLogged", Math.round(totalMinutes / 60.0 * 100.0) / 100.0);
            performanceItem.put("jobsWorkedOn", jobsWorkedOn);
            performanceItem.put("jobsCompleted", completedCount);
            techPerformance.add(performanceItem);
        });

        // 5. Inventory Consumption
        List<PartUsage> allUsages = partUsageRepository.findAll();
        Map<Long, List<PartUsage>> usagesByPart = allUsages.stream()
                .collect(Collectors.groupingBy(usage -> usage.getPart().getId()));

        List<Map<String, Object>> partConsumption = new ArrayList<>();
        usagesByPart.forEach((partId, usages) -> {
            String partName = usages.isEmpty() ? "Unknown" : usages.get(0).getPart().getName();
            String sku = usages.isEmpty() ? "" : usages.get(0).getPart().getSku();
            long quantity = usages.stream().mapToLong(PartUsage::getQuantity).sum();
            BigDecimal price = usages.isEmpty() ? BigDecimal.ZERO : usages.get(0).getPart().getPrice();
            BigDecimal totalCost = price.multiply(BigDecimal.valueOf(quantity));

            Map<String, Object> consumptionItem = new HashMap<>();
            consumptionItem.put("partId", partId);
            consumptionItem.put("partName", partName);
            consumptionItem.put("sku", sku);
            consumptionItem.put("quantityConsumed", quantity);
            consumptionItem.put("totalCost", totalCost);
            partConsumption.add(consumptionItem);
        });

        Map<String, Object> report = new HashMap<>();
        report.put("generatedAt", LocalDateTime.now());
        report.put("completedJobsCount", completedJobs.size());
        report.put("pendingJobsCount", pendingJobs.size());
        report.put("overdueJobsCount", overdueJobs.size());
        report.put("completedJobs", completedJobs);
        report.put("pendingJobs", pendingJobs);
        report.put("overdueJobs", overdueJobs);
        report.put("technicianPerformance", techPerformance);
        report.put("inventoryConsumption", partConsumption);

        return report;
    }
}
