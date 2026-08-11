package com.keystone.fsm.service;

import com.keystone.fsm.dto.*;
import com.keystone.fsm.entity.*;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final TimeLogRepository timeLogRepository;
    private final PartRepository partRepository;
    private final PartUsageRepository partUsageRepository;
    private final AttachmentRepository attachmentRepository;
    private final StatusHistoryRepository statusHistoryRepository;
    private final NotificationService notificationService;

    @Value("${keystone.upload.dir}")
    private String uploadDir;

    public WorkOrderService(WorkOrderRepository workOrderRepository,
                            CustomerRepository customerRepository,
                            SiteRepository siteRepository,
                            UserRepository userRepository,
                            ServiceRequestRepository serviceRequestRepository,
                            TimeLogRepository timeLogRepository,
                            PartRepository partRepository,
                            PartUsageRepository partUsageRepository,
                            AttachmentRepository attachmentRepository,
                            StatusHistoryRepository statusHistoryRepository,
                            NotificationService notificationService) {
        this.workOrderRepository = workOrderRepository;
        this.customerRepository = customerRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
        this.serviceRequestRepository = serviceRequestRepository;
        this.timeLogRepository = timeLogRepository;
        this.partRepository = partRepository;
        this.partUsageRepository = partUsageRepository;
        this.attachmentRepository = attachmentRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.notificationService = notificationService;
    }

    public Page<WorkOrderDTO> getWorkOrders(String status, String priority, Long assignedToId, Long customerId, String search, Pageable pageable) {
        return workOrderRepository.searchWorkOrders(status, priority, assignedToId, customerId, search, pageable)
                .map(DtoMapper::toWorkOrderDTO);
    }

    public WorkOrderDTO getWorkOrderById(Long id) {
        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found with ID: " + id));
        return DtoMapper.toWorkOrderDTO(order);
    }

    @Transactional
    public WorkOrderDTO createWorkOrder(WorkOrderCreateRequest request, String creatorEmail) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + request.getCustomerId()));
        Site site = siteRepository.findById(request.getSiteId())
                .orElseThrow(() -> new IllegalArgumentException("Site not found with ID: " + request.getSiteId()));

        ServiceRequest serviceRequest = null;
        if (request.getRequestId() != null) {
            serviceRequest = serviceRequestRepository.findById(request.getRequestId())
                    .orElseThrow(() -> new IllegalArgumentException("Service Request not found with ID: " + request.getRequestId()));
            serviceRequest.setStatus("WORK_ORDER_CREATED");
            serviceRequestRepository.save(serviceRequest);
        }

        User assignedTo = null;
        String status = "NEW";
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new IllegalArgumentException("Technician not found with ID: " + request.getAssignedToId()));
            if (assignedTo.getRole() != Role.TECHNICIAN) {
                throw new IllegalArgumentException("Assigned user must be a TECHNICIAN");
            }
            status = "ASSIGNED";
        }

        String woNumber = "WO-" + System.currentTimeMillis() / 1000 + "-" + String.format("%03d", (int)(Math.random() * 1000));

        WorkOrder order = WorkOrder.builder()
                .workOrderNumber(woNumber)
                .request(serviceRequest)
                .customer(customer)
                .site(site)
                .assignedTo(assignedTo)
                .priority(request.getPriority().toUpperCase())
                .status(status)
                .slaDueDate(request.getSlaDueDate())
                .build();

        order = workOrderRepository.save(order);

        // Record Status History
        StatusHistory history = StatusHistory.builder()
                .workOrder(order)
                .previousStatus(null)
                .currentStatus(status)
                .changedBy(creatorEmail)
                .build();
        statusHistoryRepository.save(history);

        // Dispatch Notification if assigned
        if (assignedTo != null) {
            notificationService.createNotification(assignedTo.getId(), "New Job Assigned", "Work Order " + order.getWorkOrderNumber() + " has been assigned to you.");
        }

        return DtoMapper.toWorkOrderDTO(order);
    }

    @Transactional
    public WorkOrderDTO assignTechnician(Long id, Long technicianId, String actorEmail) {
        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found"));
        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));

        if (tech.getRole() != Role.TECHNICIAN) {
            throw new IllegalArgumentException("Assigned user must be a TECHNICIAN");
        }

        String prevStatus = order.getStatus();
        String currentStatus = "ASSIGNED";

        order.setAssignedTo(tech);
        if ("NEW".equals(prevStatus)) {
            order.setStatus(currentStatus);
        } else {
            currentStatus = prevStatus; // Keep current status if it's already in progress etc.
        }

        order = workOrderRepository.save(order);

        // Record History
        if (!prevStatus.equals(currentStatus)) {
            StatusHistory history = StatusHistory.builder()
                    .workOrder(order)
                    .previousStatus(prevStatus)
                    .currentStatus(currentStatus)
                    .changedBy(actorEmail)
                    .build();
            statusHistoryRepository.save(history);
        }

        // Notify Technician
        notificationService.createNotification(tech.getId(), "Job Assignment Update", "You have been assigned to Work Order: " + order.getWorkOrderNumber());

        return DtoMapper.toWorkOrderDTO(order);
    }

    @Transactional
    public WorkOrderDTO updateStatus(Long id, String statusRequest, String actorEmail) {
        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found"));

        String oldStatus = order.getStatus();
        String newStatus = statusRequest.toUpperCase();

        if (oldStatus.equals(newStatus)) {
            return DtoMapper.toWorkOrderDTO(order);
        }

        validateStatusTransition(oldStatus, newStatus);

        order.setStatus(newStatus);
        order = workOrderRepository.save(order);

        // Record History
        StatusHistory history = StatusHistory.builder()
                .workOrder(order)
                .previousStatus(oldStatus)
                .currentStatus(newStatus)
                .changedBy(actorEmail)
                .build();
        statusHistoryRepository.save(history);

        // Send notifications
        if (order.getAssignedTo() != null) {
            notificationService.createNotification(order.getAssignedTo().getId(), "Work Order Status Changed", 
                    "Work Order " + order.getWorkOrderNumber() + " changed from " + oldStatus + " to " + newStatus);
        }

        return DtoMapper.toWorkOrderDTO(order);
    }

    private void validateStatusTransition(String from, String to) {
        List<String> allowed = new ArrayList<>();
        switch (from) {
            case "NEW":
                allowed.addAll(Arrays.asList("ASSIGNED", "CANCELLED", "COMPLETED", "CLOSED"));
                break;
            case "ASSIGNED":
                allowed.addAll(Arrays.asList("IN_PROGRESS", "CANCELLED", "NEW", "COMPLETED", "CLOSED"));
                break;
            case "IN_PROGRESS":
                allowed.addAll(Arrays.asList("ON_HOLD", "COMPLETED", "CANCELLED", "CLOSED"));
                break;
            case "ON_HOLD":
                allowed.addAll(Arrays.asList("IN_PROGRESS", "COMPLETED", "CANCELLED", "CLOSED"));
                break;
            case "COMPLETED":
                allowed.addAll(Arrays.asList("CLOSED", "IN_PROGRESS", "ON_HOLD"));
                break;
            case "CLOSED":
                allowed.addAll(Arrays.asList("COMPLETED", "IN_PROGRESS", "ASSIGNED"));
                break;
            case "CANCELLED":
                allowed.addAll(Arrays.asList("NEW", "ASSIGNED"));
                break;
        }

        if (!allowed.contains(to)) {
            throw new IllegalStateException("Illegal status transition from " + from + " to " + to);
        }
    }

    @Transactional
    public TimeLogDTO logTime(Long workOrderId, TimeLogDTO request, Long technicianId) {
        WorkOrder order = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found"));
        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));

        TimeLog log = TimeLog.builder()
                .workOrder(order)
                .technician(tech)
                .minutes(request.getMinutes())
                .notes(request.getNotes())
                .build();

        log = timeLogRepository.save(log);
        return DtoMapper.toTimeLogDTO(log);
    }

    @Transactional
    public PartUsageDTO logPartUsage(Long workOrderId, PartUsageDTO request) {
        WorkOrder order = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found"));
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new IllegalArgumentException("Part not found"));

        if (part.getQuantity() < request.getQuantity()) {
            throw new IllegalArgumentException("Insufficient stock for part: " + part.getName() + " (In Stock: " + part.getQuantity() + ")");
        }

        // Deduct inventory
        part.setQuantity(part.getQuantity() - request.getQuantity());
        partRepository.save(part);

        PartUsage usage = PartUsage.builder()
                .workOrder(order)
                .part(part)
                .quantity(request.getQuantity())
                .build();

        usage = partUsageRepository.save(usage);
        return DtoMapper.toPartUsageDTO(usage);
    }

    @Transactional
    public AttachmentDTO uploadAttachment(Long workOrderId, MultipartFile file) throws IOException {
        WorkOrder order = workOrderRepository.findById(workOrderId)
                .orElseThrow(() -> new IllegalArgumentException("Work Order not found"));

        // Ensure directories exist
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String safeFileName = System.currentTimeMillis() + "_" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
        Path destination = Paths.get(uploadDir, safeFileName);
        Files.copy(file.getInputStream(), destination);

        Attachment attachment = Attachment.builder()
                .workOrder(order)
                .fileName(file.getOriginalFilename())
                .filePath(destination.toString())
                .build();

        attachment = attachmentRepository.save(attachment);
        return DtoMapper.toAttachmentDTO(attachment);
    }

    public List<TimeLogDTO> getTimeLogs(Long workOrderId) {
        return timeLogRepository.findByWorkOrderId(workOrderId).stream()
                .map(DtoMapper::toTimeLogDTO)
                .collect(Collectors.toList());
    }

    public List<PartUsageDTO> getPartsUsed(Long workOrderId) {
        return partUsageRepository.findByWorkOrderId(workOrderId).stream()
                .map(DtoMapper::toPartUsageDTO)
                .collect(Collectors.toList());
    }

    public List<AttachmentDTO> getAttachments(Long workOrderId) {
        return attachmentRepository.findByWorkOrderId(workOrderId).stream()
                .map(DtoMapper::toAttachmentDTO)
                .collect(Collectors.toList());
    }

    public List<StatusHistoryDTO> getStatusHistory(Long workOrderId) {
        return statusHistoryRepository.findByWorkOrderIdOrderByChangedAtDesc(workOrderId).stream()
                .map(DtoMapper::toStatusHistoryDTO)
                .collect(Collectors.toList());
    }
}
