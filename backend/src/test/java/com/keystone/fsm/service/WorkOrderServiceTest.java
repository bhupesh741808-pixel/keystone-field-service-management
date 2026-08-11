package com.keystone.fsm.service;

import com.keystone.fsm.entity.*;
import com.keystone.fsm.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class WorkOrderServiceTest {

    @Mock
    private WorkOrderRepository workOrderRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private SiteRepository siteRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ServiceRequestRepository serviceRequestRepository;
    @Mock
    private TimeLogRepository timeLogRepository;
    @Mock
    private PartRepository partRepository;
    @Mock
    private PartUsageRepository partUsageRepository;
    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private StatusHistoryRepository statusHistoryRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private WorkOrderService workOrderService;

    @Test
    public void testIllegalStatusTransition_NewToClosed_ThrowsException() {
        // Arrange
        Customer customer = Customer.builder().id(1L).companyName("Test Corp").build();
        Site site = Site.builder().id(1L).siteName("HQ").customer(customer).build();
        WorkOrder wo = WorkOrder.builder()
                .id(1L)
                .status("NEW")
                .customer(customer)
                .site(site)
                .build();
        
        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(wo));

        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            workOrderService.updateStatus(1L, "CLOSED", "test@keystone.com");
        });
    }

    @Test
    public void testLegalStatusTransition_NewToAssigned() {
        // Arrange
        Customer customer = Customer.builder().id(1L).companyName("Test Corp").build();
        Site site = Site.builder().id(1L).siteName("HQ").customer(customer).build();
        WorkOrder wo = WorkOrder.builder()
                .id(1L)
                .status("NEW")
                .customer(customer)
                .site(site)
                .build();

        when(workOrderRepository.findById(1L)).thenReturn(Optional.of(wo));
        when(workOrderRepository.save(wo)).thenReturn(wo);

        // Act
        var result = workOrderService.updateStatus(1L, "ASSIGNED", "test@keystone.com");

        // Assert
        assertEquals("ASSIGNED", result.getStatus());
    }
}
