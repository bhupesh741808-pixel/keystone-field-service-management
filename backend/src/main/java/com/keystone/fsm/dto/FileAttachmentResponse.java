package com.keystone.fsm.dto;

import com.keystone.fsm.entity.AttachmentType;
import com.keystone.fsm.entity.StorageProvider;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileAttachmentResponse {
    private Long id;
    private String originalFileName;
    private String url;
    private String contentType;
    private Long size;
    private AttachmentType type;
    private StorageProvider provider;
    private LocalDateTime createdAt;
}