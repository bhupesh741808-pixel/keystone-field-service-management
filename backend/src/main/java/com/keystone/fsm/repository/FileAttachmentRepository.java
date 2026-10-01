package com.keystone.fsm.repository;

import com.keystone.fsm.entity.FileAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileAttachmentRepository extends JpaRepository<FileAttachment, Long> {
    List<FileAttachment> findByReferenceIdAndReferenceType(Long referenceId, String referenceType);
}