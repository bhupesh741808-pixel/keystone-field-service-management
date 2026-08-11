package com.keystone.fsm.controller;

import com.keystone.fsm.dto.ServiceRequestDTO;
import com.keystone.fsm.service.ServiceRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/service-requests")
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;

    public ServiceRequestController(ServiceRequestService serviceRequestService) {
        this.serviceRequestService = serviceRequestService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<List<ServiceRequestDTO>> getAllRequests() {
        return ResponseEntity.ok(serviceRequestService.getAllRequests());
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER', 'CUSTOMER')")
    public ResponseEntity<List<ServiceRequestDTO>> getRequestsByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(serviceRequestService.getRequestsByCustomerId(customerId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER', 'CUSTOMER')")
    public ResponseEntity<ServiceRequestDTO> getRequestById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceRequestService.getRequestById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MANAGER', 'DISPATCHER')")
    public ResponseEntity<ServiceRequestDTO> createRequest(@Valid @RequestBody ServiceRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceRequestService.createRequest(dto));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<ServiceRequestDTO> updateRequestStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) {
            throw new IllegalArgumentException("Status field is required");
        }
        return ResponseEntity.ok(serviceRequestService.updateRequestStatus(id, status));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> body) {
        Long serviceRequestId = Long.valueOf(body.get("serviceRequestId").toString());
        String razorpayOrderId = (String) body.get("razorpayOrderId");
        String razorpayPaymentId = (String) body.get("razorpayPaymentId");
        String razorpaySignature = (String) body.get("razorpaySignature");

        ServiceRequestDTO updated = serviceRequestService.verifyPaymentAndAutoAssign(
                serviceRequestId, razorpayOrderId, razorpayPaymentId, razorpaySignature
        );
        return ResponseEntity.ok(updated);
    }
}
