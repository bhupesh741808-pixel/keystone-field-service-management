package com.keystone.fsm.service;

import com.keystone.fsm.dto.ServiceRequestDTO;
import com.keystone.fsm.entity.*;
import com.keystone.fsm.mapper.DtoMapper;
import com.keystone.fsm.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final CustomerRepository customerRepository;
    private final WorkOrderRepository workOrderRepository;
    private final TechnicianRepository technicianRepository;
    private final SiteRepository siteRepository;
    private final UserRepository userRepository;

    @Value("${keystone.razorpay.key-id}")
    private String keyId;

    @Value("${keystone.razorpay.secret-key}")
    private String secretKey;

    public ServiceRequestService(ServiceRequestRepository serviceRequestRepository,
                                 CustomerRepository customerRepository,
                                 WorkOrderRepository workOrderRepository,
                                 TechnicianRepository technicianRepository,
                                 SiteRepository siteRepository,
                                 UserRepository userRepository) {
        this.serviceRequestRepository = serviceRequestRepository;
        this.customerRepository = customerRepository;
        this.workOrderRepository = workOrderRepository;
        this.technicianRepository = technicianRepository;
        this.siteRepository = siteRepository;
        this.userRepository = userRepository;
    }

    public List<ServiceRequestDTO> getAllRequests() {
        return serviceRequestRepository.findAll().stream()
                .map(DtoMapper::toServiceRequestDTO)
                .collect(Collectors.toList());
    }

    public List<ServiceRequestDTO> getRequestsByCustomerId(Long customerId) {
        return serviceRequestRepository.findByCustomerId(customerId, Pageable.unpaged()).getContent().stream()
                .map(DtoMapper::toServiceRequestDTO)
                .collect(Collectors.toList());
    }

    public ServiceRequestDTO getRequestById(Long id) {
        ServiceRequest req = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service Request not found with ID: " + id));
        return DtoMapper.toServiceRequestDTO(req);
    }

    @Transactional
    public ServiceRequestDTO createRequest(ServiceRequestDTO dto) {
        Customer customer = null;
        if (dto.getCustomerId() != null) {
            customer = customerRepository.findById(dto.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found with ID: " + dto.getCustomerId()));
        }

        // Calculate amount based on priority: LOW = 500, MEDIUM = 1000, HIGH = 1500, EMERGENCY = 2000
        BigDecimal amount = new BigDecimal("1000.00"); // default
        String priority = dto.getPriority() != null ? dto.getPriority().toUpperCase() : "MEDIUM";
        switch (priority) {
            case "LOW":
                amount = new BigDecimal("500.00");
                break;
            case "MEDIUM":
                amount = new BigDecimal("1000.00");
                break;
            case "HIGH":
                amount = new BigDecimal("1500.00");
                break;
            case "EMERGENCY":
                amount = new BigDecimal("2000.00");
                break;
        }

        ServiceRequest req = ServiceRequest.builder()
                .customer(customer)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .priority(priority)
                .serviceType(dto.getServiceType() != null ? dto.getServiceType() : "GENERAL")
                .status("NEW")
                .amount(amount)
                .paymentStatus("UNPAID")
                .build();

        req = serviceRequestRepository.save(req);

        // Call Razorpay API to generate the Order ID
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(keyId, secretKey);

            Map<String, Object> payload = new HashMap<>();
            // amount in paise (multiply by 100)
            payload.put("amount", amount.multiply(new BigDecimal(100)).intValue());
            payload.put("currency", "INR");
            payload.put("receipt", "receipt_request_" + req.getId());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity("https://api.razorpay.com/v1/orders", request, Map.class);
            Map<String, Object> resBody = response.getBody();

            String razorpayOrderId = (String) resBody.get("id");
            req.setRazorpayOrderId(razorpayOrderId);
            req = serviceRequestRepository.save(req);
        } catch (Exception e) {
            // Log error and proceed (unpaid request)
            System.err.println("Razorpay Order Creation Failed: " + e.getMessage());
        }

        return DtoMapper.toServiceRequestDTO(req);
    }

    @Transactional
    public ServiceRequestDTO verifyPaymentAndAutoAssign(Long requestId, String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        ServiceRequest req = serviceRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Service Request not found with ID: " + requestId));

        boolean verified = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secretKey);
        if (!verified) {
            throw new IllegalArgumentException("Payment signature verification failed");
        }

        req.setPaymentStatus("PAID");
        req.setRazorpayPaymentId(razorpayPaymentId);

        // Auto-assign to an available technician and create a Work Order
        if (req.getCustomer() != null) {
            List<Technician> techs = technicianRepository.findByAvailability("AVAILABLE");
            if (techs.isEmpty()) {
                techs = technicianRepository.findAll();
            }

            List<Site> sites = siteRepository.findByCustomerId(req.getCustomer().getId());

            if (!techs.isEmpty() && !sites.isEmpty()) {
                Technician assignedTech = techs.get(0);
                Site targetSite = sites.get(0);

                String woNumber = "WO-" + System.currentTimeMillis() / 1000 + "-" + String.format("%03d", (int)(Math.random() * 1000));

                WorkOrder order = WorkOrder.builder()
                        .workOrderNumber(woNumber)
                        .request(req)
                        .customer(req.getCustomer())
                        .site(targetSite)
                        .assignedTo(assignedTech.getUser())
                        .priority(req.getPriority())
                        .status("ASSIGNED")
                        .slaDueDate(LocalDateTime.now().plusDays(3))
                        .build();

                workOrderRepository.save(order);
                req.setStatus("WORK_ORDER_CREATED");
            }
        }

        req = serviceRequestRepository.save(req);
        return DtoMapper.toServiceRequestDTO(req);
    }

    @Transactional
    public ServiceRequestDTO updateRequestStatus(Long id, String status) {
        ServiceRequest req = serviceRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service Request not found with ID: " + id));
        
        req.setStatus(status.toUpperCase());
        req = serviceRequestRepository.save(req);
        return DtoMapper.toServiceRequestDTO(req);
    }

    private boolean verifySignature(String orderId, String paymentId, String signature, String secret) {
        try {
            String data = orderId + "|" + paymentId;
            javax.crypto.spec.SecretKeySpec signingKey = new javax.crypto.spec.SecretKeySpec(secret.getBytes(), "HmacSHA256");
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(signingKey);
            byte[] rawHmac = mac.doFinal(data.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : rawHmac) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
