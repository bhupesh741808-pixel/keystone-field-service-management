package com.keystone.fsm.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartUsageDTO {
    private Long id;
    private Long workOrderId;

    @NotNull(message = "Part ID is required")
    private Long partId;

    private String partName;
    private String partSku;

    @NotNull(message = "Quantity is required")
    private Integer quantity;

    private BigDecimal price;
}
