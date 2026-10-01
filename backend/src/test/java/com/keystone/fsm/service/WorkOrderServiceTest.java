package com.keystone.fsm.service;

import com.keystone.fsm.dto.WorkOrderDTO;
import com.keystone.fsm.entity.*;
import com.keystone.fsm.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkOrderServiceTest {

    @Mock private WorkOrderRepository workOrderRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private SiteRepository siteRepository;
    @Mock private UserRepository userRepository;
    @Mock private ServiceRequestRepository serviceRequestRepository;
    @Mock private TimeLogRepository timeLogRepository;
    @Mock private PartRepository partRepository;
    @Mock private PartUsageRepository partUsageRepository;
    @Mock private AttachmentRepository attachmentRepository;
    @Mock private StatusHistoryRepository statusHistoryRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private WorkOrderService workOrderService;

    private WorkOrder newWorkOrder;

    @BeforeEach
    void setUp() {
        Customer customer = Customer.builder().id(1L).companyName("Test Corp").build();
        Site site = Site.builder().id(1L).siteName("HQ").customer(customer).build();
        newWorkOrder = WorkOrder.builder()
                .id(1L)
                .workOrderNumber("WO-001")
                .status("NEW")
                .customer(customer)
                .site(site)
                .build();
    }

    // ============================================================
    // Illegal transitions
    // ============================================================

    @Test
    void testIllegalStatusTransition_NewToClosed_ThrowsException() {
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> workOrderService.updateStatus(1L, "CLOSED", "test@keystone.com"));

        assertTrue(ex.getMessage().contains("NEW"));
        assertTrue(ex.getMessage().contains("CLOSED"));

        // Nothing should be persisted when the transition is rejected
        verify(workOrderRepository, never()).save(any());
        verify(statusHistoryRepository, never()).save(any(StatusHistory.class));
        verify(notificationService, never()).createNotification(any(), any(), any());
    }

    @Test
    void updateStatus_newToCompleted_throwsException() {
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        assertThrows(IllegalStateException.class,
                () -> workOrderService.updateStatus(1L, "COMPLETED", "test@keystone.com"));
    }

    @Test
    void updateStatus_completedToInProgress_throwsException() {
        newWorkOrder.setStatus("COMPLETED");
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        assertThrows(IllegalStateException.class,
                () -> workOrderService.updateStatus(1L, "IN_PROGRESS", "test@keystone.com"));
    }

    @Test
    void updateStatus_closedIsTerminal_throwsException() {
        newWorkOrder.setStatus("CLOSED");
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        assertThrows(IllegalStateException.class,
                () -> workOrderService.updateStatus(1L, "IN_PROGRESS", "test@keystone.com"));
        assertThrows(IllegalStateException.class,
                () -> workOrderService.updateStatus(1L, "ASSIGNED", "test@keystone.com"));
    }

    // ============================================================
    // Legal transitions
    // ============================================================

    @Test
    void testLegalStatusTransition_NewToAssigned() {
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        WorkOrderDTO result = workOrderService.updateStatus(1L, "ASSIGNED", "test@keystone.com");

        assertEquals("ASSIGNED", result.getStatus());
        verify(workOrderRepository).save(newWorkOrder);
        verify(statusHistoryRepository).save(any(StatusHistory.class));
    }

    @Test
    void updateStatus_assignedToInProgress_succeeds() {
        newWorkOrder.setStatus("ASSIGNED");
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        WorkOrderDTO result = workOrderService.updateStatus(1L, "IN_PROGRESS", "test@keystone.com");

        assertEquals("IN_PROGRESS", result.getStatus());
    }

    @Test
    void updateStatus_inProgressToCompleted_succeeds() {
        newWorkOrder.setStatus("IN_PROGRESS");
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        WorkOrderDTO result = workOrderService.updateStatus(1L, "COMPLETED", "test@keystone.com");

        assertEquals("COMPLETED", result.getStatus());
    }

    @Test
    void updateStatus_completedToClosed_succeeds() {
        newWorkOrder.setStatus("COMPLETED");
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        WorkOrderDTO result = workOrderService.updateStatus(1L, "CLOSED", "test@keystone.com");

        assertEquals("CLOSED", result.getStatus());
    }

    // ============================================================
    // No-op transition
    // ============================================================

    @Test
    void updateStatus_sameStatus_isNoOp() {
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(newWorkOrder));

        WorkOrderDTO result = workOrderService.updateStatus(1L, "NEW", "test@keystone.com");

        assertEquals("NEW", result.getStatus());
        verify(workOrderRepository, never()).save(any());
        verify(statusHistoryRepository, never()).save(any(StatusHistory.class));
    }

    // ============================================================
    // Not found
    // ============================================================

    @Test
    void updateStatus_workOrderNotFound_throwsEntityNotFoundException() {
        when(workOrderRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> workOrderService.updateStatus(99L, "ASSIGNED", "test@keystone.com"));
    }
}