package com.keystone.fsm.mapper;

import com.keystone.fsm.dto.*;
import com.keystone.fsm.entity.*;

public class DtoMapper {

    public static UserDTO toUserDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .active(user.isActive())
                .customerId(user.getCustomer() != null ? user.getCustomer().getId() : null)
                .build();
    }

    public static CustomerDTO toCustomerDTO(Customer customer) {
        if (customer == null) return null;
        return CustomerDTO.builder()
                .id(customer.getId())
                .companyName(customer.getCompanyName())
                .contactPerson(customer.getContactPerson())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .build();
    }

    public static Customer toCustomerEntity(CustomerDTO dto) {
        if (dto == null) return null;
        return Customer.builder()
                .id(dto.getId())
                .companyName(dto.getCompanyName())
                .contactPerson(dto.getContactPerson())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .build();
    }

    public static SiteDTO toSiteDTO(Site site) {
        if (site == null) return null;
        return SiteDTO.builder()
                .id(site.getId())
                .customerId(site.getCustomer().getId())
                .siteName(site.getSiteName())
                .address(site.getAddress())
                .city(site.getCity())
                .state(site.getState())
                .pincode(site.getPincode())
                .build();
    }

    public static Site toSiteEntity(SiteDTO dto, Customer customer) {
        if (dto == null) return null;
        return Site.builder()
                .id(dto.getId())
                .customer(customer)
                .siteName(dto.getSiteName())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .build();
    }

    public static TechnicianDTO toTechnicianDTO(Technician tech) {
        if (tech == null) return null;
        return TechnicianDTO.builder()
                .id(tech.getId())
                .fullName(tech.getUser().getFullName())
                .email(tech.getUser().getEmail())
                .phone(tech.getUser().getPhone())
                .employeeCode(tech.getEmployeeCode())
                .specialization(tech.getSpecialization())
                .availability(tech.getAvailability())
                .build();
    }

    public static PartDTO toPartDTO(Part part) {
        if (part == null) return null;
        return PartDTO.builder()
                .id(part.getId())
                .name(part.getName())
                .sku(part.getSku())
                .price(part.getPrice())
                .quantity(part.getQuantity())
                .build();
    }

    public static Part toPartEntity(PartDTO dto) {
        if (dto == null) return null;
        return Part.builder()
                .id(dto.getId())
                .name(dto.getName())
                .sku(dto.getSku())
                .price(dto.getPrice())
                .quantity(dto.getQuantity())
                .build();
    }

    public static ServiceRequestDTO toServiceRequestDTO(ServiceRequest req) {
        if (req == null) return null;
        return ServiceRequestDTO.builder()
                .id(req.getId())
                .customerId(req.getCustomer() != null ? req.getCustomer().getId() : null)
                .customerName(req.getCustomer() != null ? req.getCustomer().getCompanyName() : null)
                .title(req.getTitle())
                .description(req.getDescription())
                .priority(req.getPriority())
                .serviceType(req.getServiceType())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .amount(req.getAmount())
                .paymentStatus(req.getPaymentStatus())
                .razorpayOrderId(req.getRazorpayOrderId())
                .razorpayPaymentId(req.getRazorpayPaymentId())
                .build();
    }

    public static WorkOrderDTO toWorkOrderDTO(WorkOrder order) {
        if (order == null) return null;
        return WorkOrderDTO.builder()
                .id(order.getId())
                .workOrderNumber(order.getWorkOrderNumber())
                .requestId(order.getRequest() != null ? order.getRequest().getId() : null)
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getCompanyName())
                .siteId(order.getSite().getId())
                .siteName(order.getSite().getSiteName())
                .siteAddress(order.getSite().getAddress())
                .siteCity(order.getSite().getCity())
                .assignedToId(order.getAssignedTo() != null ? order.getAssignedTo().getId() : null)
                .assignedToName(order.getAssignedTo() != null ? order.getAssignedTo().getFullName() : null)
                .priority(order.getPriority())
                .status(order.getStatus())
                .slaDueDate(order.getSlaDueDate())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    public static TimeLogDTO toTimeLogDTO(TimeLog log) {
        if (log == null) return null;
        return TimeLogDTO.builder()
                .id(log.getId())
                .workOrderId(log.getWorkOrder().getId())
                .technicianId(log.getTechnician().getId())
                .technicianName(log.getTechnician().getFullName())
                .minutes(log.getMinutes())
                .notes(log.getNotes())
                .loggedAt(log.getLoggedAt())
                .build();
    }

    public static PartUsageDTO toPartUsageDTO(PartUsage usage) {
        if (usage == null) return null;
        return PartUsageDTO.builder()
                .id(usage.getId())
                .workOrderId(usage.getWorkOrder().getId())
                .partId(usage.getPart().getId())
                .partName(usage.getPart().getName())
                .partSku(usage.getPart().getSku())
                .quantity(usage.getQuantity())
                .price(usage.getPart().getPrice())
                .build();
    }

    public static AttachmentDTO toAttachmentDTO(Attachment attachment) {
        if (attachment == null) return null;
        return AttachmentDTO.builder()
                .id(attachment.getId())
                .workOrderId(attachment.getWorkOrder().getId())
                .fileName(attachment.getFileName())
                .filePath(attachment.getFilePath())
                .uploadedAt(attachment.getUploadedAt())
                .build();
    }

    public static StatusHistoryDTO toStatusHistoryDTO(StatusHistory history) {
        if (history == null) return null;
        return StatusHistoryDTO.builder()
                .id(history.getId())
                .workOrderId(history.getWorkOrder().getId())
                .previousStatus(history.getPreviousStatus())
                .currentStatus(history.getCurrentStatus())
                .changedBy(history.getChangedBy())
                .changedAt(history.getChangedAt())
                .build();
    }

    public static NotificationDTO toNotificationDTO(Notification note) {
        if (note == null) return null;
        return NotificationDTO.builder()
                .id(note.getId())
                .userId(note.getUser().getId())
                .title(note.getTitle())
                .message(note.getMessage())
                .readStatus(note.isReadStatus())
                .createdAt(note.getCreatedAt())
                .build();
    }
}
