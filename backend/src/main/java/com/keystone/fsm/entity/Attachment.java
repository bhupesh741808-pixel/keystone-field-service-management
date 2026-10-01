package com.keystone.fsm.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

   // @ManyToOne(fetch = FetchType.LAZY, optional = false)
   // @JoinColumn(name = "work_order_id", nullable = false) // work order association was originally mandatory  // ALTER TABLE attachments MODIFY COLUMN work_order_id BIGINT NULL;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_order_id")
    private WorkOrder workOrder;

    @Column(name = "file_name", nullable = false)
    private String fileName;
    private String contentType;
	@Column(length=1000)
	private String storagePath;
	private Long sizeOfFile;
	private String cloudinaryId;

    @Column(name = "file_path", nullable = false)  //ALTER TABLE attachments MODIFY COLUMN file_path VARCHAR(1000) NULL;  
    private String filePath;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
    @PrePersist
    void onCreate() {
        this.uploadedAt = java.time.LocalDateTime.now();
    }
}
