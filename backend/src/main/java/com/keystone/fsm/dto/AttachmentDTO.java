package com.keystone.fsm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO {
    private Long id;
    private String fileName;
    private String contentType;
    private Long sizeOfFile;
    private String storagePath;
    private String cloudinaryId;
    private String filePath;
    private Long workOrderId;      
    private LocalDateTime uploadedAt;
}
