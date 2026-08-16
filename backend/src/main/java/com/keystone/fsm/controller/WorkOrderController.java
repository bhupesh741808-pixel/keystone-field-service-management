package com.keystone.fsm.controller;

import com.keystone.fsm.dto.*;
import com.keystone.fsm.entity.Customer;
import com.keystone.fsm.entity.Role;
import com.keystone.fsm.entity.User;
import com.keystone.fsm.repository.CustomerRepository;
import com.keystone.fsm.repository.UserRepository;
import com.keystone.fsm.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/work-orders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public WorkOrderController(WorkOrderService workOrderService,
                               UserRepository userRepository,
                               CustomerRepository customerRepository) {
        this.workOrderService = workOrderService;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
    }

    @GetMapping
    public ResponseEntity<Page<WorkOrderDTO>> getWorkOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Long assignedToId,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User context not found"));

        Long filteredCustomerId = customerId;
        Long filteredAssignedToId = assignedToId;

        // Strict Role-Based Data Segregation
        if (currentUser.getRole() == Role.CUSTOMER) {
            filteredCustomerId = (currentUser.getCustomer() != null) ? currentUser.getCustomer().getId() : -1L;
        } else if (currentUser.getRole() == Role.TECHNICIAN) {
            filteredAssignedToId = currentUser.getId();
        }

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(workOrderService.getWorkOrders(
                status, priority, filteredAssignedToId, filteredCustomerId, search, pageable
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderDTO> getWorkOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getWorkOrderById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<WorkOrderDTO> createWorkOrder(@Valid @RequestBody WorkOrderCreateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workOrderService.createWorkOrder(request, email));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<WorkOrderDTO> assignTechnician(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long technicianId = body.get("technicianId");
        if (technicianId == null) {
            throw new IllegalArgumentException("Technician ID is required");
        }
        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workOrderService.assignTechnician(id, technicianId, actorEmail));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<WorkOrderDTO> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) {
            throw new IllegalArgumentException("Status is required");
        }
        String actorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(workOrderService.updateStatus(id, status, actorEmail));
    }

    @PostMapping("/{id}/timelog")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER')")
    public ResponseEntity<TimeLogDTO> logTime(@PathVariable Long id, @Valid @RequestBody TimeLogDTO request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User context not found"));
        
        Long techId = (currentUser.getRole() == Role.TECHNICIAN) ? currentUser.getId() : request.getTechnicianId();
        if (techId == null) {
            throw new IllegalArgumentException("Technician ID is required");
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workOrderService.logTime(id, request, techId));
    }

    @PostMapping("/{id}/parts")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'MANAGER')")
    public ResponseEntity<PartUsageDTO> logPartUsage(@PathVariable Long id, @Valid @RequestBody PartUsageDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workOrderService.logPartUsage(id, request));
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentDTO> uploadAttachment(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workOrderService.uploadAttachment(id, file));
    }

    @GetMapping("/{id}/timelogs")
    public ResponseEntity<List<TimeLogDTO>> getTimeLogs(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getTimeLogs(id));
    }

    @GetMapping("/{id}/parts")
    public ResponseEntity<List<PartUsageDTO>> getPartsUsed(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getPartsUsed(id));
    }

    @GetMapping("/{id}/attachments")
    public ResponseEntity<List<AttachmentDTO>> getAttachments(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getAttachments(id));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<StatusHistoryDTO>> getStatusHistory(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getStatusHistory(id));
    }
}
