package com.keystone.fsm.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadResult {
    private String publicId;
    private String url;
    private String storedFileName;
    private Long size;
}