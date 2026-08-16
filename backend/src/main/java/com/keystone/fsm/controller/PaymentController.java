package com.keystone.fsm.controller;

import com.keystone.fsm.dto.PurchaseDTO;
import com.keystone.fsm.entity.Customer;
import com.keystone.fsm.entity.Part;
import com.keystone.fsm.entity.Purchase;
import com.keystone.fsm.entity.User;
import com.keystone.fsm.repository.PartRepository;
import com.keystone.fsm.repository.PurchaseRepository;
import com.keystone.fsm.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PurchaseRepository purchaseRepository;
    private final PartRepository partRepository;
    private final UserRepository userRepository;

    @Value("${keystone.razorpay.key-id}")
    private String keyId;

    @Value("${keystone.razorpay.secret-key}")
    private String secretKey;

    public PaymentController(PurchaseRepository purchaseRepository, PartRepository partRepository, UserRepository userRepository) {
        this.purchaseRepository = purchaseRepository;
        this.partRepository = partRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/order")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        Long partId = Long.valueOf(body.get("partId").toString());
        Integer quantity = Integer.valueOf(body.get("quantity").toString());

        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new IllegalArgumentException("Part not found"));

        if (part.getQuantity() < quantity) {
            return ResponseEntity.badRequest().body(Map.of("message", "Insufficient stock available"));
        }

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Customer customer = user.getCustomer();
        if (customer == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "User is not associated with a customer account"));
        }

        BigDecimal amount = part.getPrice().multiply(new BigDecimal(quantity));

        Purchase purchase = Purchase.builder()
                .customer(customer)
                .part(part)
                .quantity(quantity)
                .amount(amount)
                .status("PENDING")
                .build();

        purchase = purchaseRepository.save(purchase);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(keyId, secretKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("amount", amount.multiply(new BigDecimal(100)).intValue()); // in paise
            payload.put("currency", "INR");
            payload.put("receipt", "receipt_purchase_" + purchase.getId());

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.postForEntity("https://api.razorpay.com/v1/orders", request, Map.class);
            Map<String, Object> resBody = response.getBody();

            String razorpayOrderId = (String) resBody.get("id");
            purchase.setRazorpayOrderId(razorpayOrderId);
            purchaseRepository.save(purchase);

            return ResponseEntity.ok(Map.of(
                    "orderId", razorpayOrderId,
                    "purchaseId", purchase.getId(),
                    "amount", amount,
                    "keyId", keyId
            ));
        } catch (Exception e) {
            purchase.setStatus("FAILED");
            purchaseRepository.save(purchase);
            return ResponseEntity.internalServerError().body(Map.of("message", "Error communicating with Razorpay: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, Object> body) {
        Long purchaseId = Long.valueOf(body.get("purchaseId").toString());
        String razorpayOrderId = (String) body.get("razorpayOrderId");
        String razorpayPaymentId = (String) body.get("razorpayPaymentId");
        String razorpaySignature = (String) body.get("razorpaySignature");

        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new IllegalArgumentException("Purchase record not found"));

        boolean verified = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secretKey);

        if (verified) {
            purchase.setStatus("SUCCESS");
            purchase.setRazorpayPaymentId(razorpayPaymentId);
            
            Part part = purchase.getPart();
            part.setQuantity(part.getQuantity() - purchase.getQuantity());
            partRepository.save(part);
            purchaseRepository.save(purchase);

            return ResponseEntity.ok(Map.of("status", "SUCCESS", "message", "Payment verified successfully"));
        } else {
            purchase.setStatus("FAILED");
            purchaseRepository.save(purchase);
            return ResponseEntity.badRequest().body(Map.of("status", "FAILED", "message", "Payment signature verification failed"));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<PurchaseDTO>> getHistory() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Customer customer = user.getCustomer();
        if (customer == null) {
            return ResponseEntity.ok(List.of());
        }

        List<Purchase> purchases = purchaseRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        List<PurchaseDTO> dtos = purchases.stream().map(p -> PurchaseDTO.builder()
                .id(p.getId())
                .customerName(p.getCustomer().getCompanyName())
                .partName(p.getPart().getName())
                .partSku(p.getPart().getSku())
                .quantity(p.getQuantity())
                .amount(p.getAmount())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt().toString())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('MANAGER', 'DISPATCHER')")
    public ResponseEntity<List<PurchaseDTO>> getAllPurchases() {
        List<Purchase> purchases = purchaseRepository.findAllByOrderByCreatedAtDesc();
        List<PurchaseDTO> dtos = purchases.stream().map(p -> PurchaseDTO.builder()
                .id(p.getId())
                .customerName(p.getCustomer().getCompanyName())
                .partName(p.getPart().getName())
                .partSku(p.getPart().getSku())
                .quantity(p.getQuantity())
                .amount(p.getAmount())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt().toString())
                .razorpayOrderId(p.getRazorpayOrderId())
                .razorpayPaymentId(p.getRazorpayPaymentId())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
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
