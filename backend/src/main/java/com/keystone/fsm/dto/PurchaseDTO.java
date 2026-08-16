package com.keystone.fsm.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseDTO {
    private Long id;
    private String customerName;
    private String partName;
    private String partSku;
    private Integer quantity;
    private BigDecimal amount;
    private String status;
    private String createdAt;
    private String razorpayOrderId;
    private String razorpayPaymentId;
}
