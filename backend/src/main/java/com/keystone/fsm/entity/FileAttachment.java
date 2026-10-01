package com.keystone.fsm.entity;


import com.keystone.fsm.entity.AttachmentType;
import com.keystone.fsm.entity.StorageProvider;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Original filename as uploaded by the client */
    @Column(nullable = false)
    private String originalFileName;

    /** Filename stored on the provider */
    private String storedFileName;

    /** Public ID / key returned by the storage provider (used for delete) */
    @Column(nullable = false)
    private String publicId;

    /** Full secure URL to access the file */
    @Column(nullable = false, length = 1024)
    private String url;

    /** MIME type, e.g. image/jpeg, video/mp4 */
    private String contentType;

    /** Size in bytes */
    private Long size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StorageProvider provider;

    /** Optional: link to a domain entity (e.g. jobId, userId) */
    private Long referenceId;

    /** Optional: type of the linked entity (e.g. "JOB", "USER") */
    private String referenceType;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}