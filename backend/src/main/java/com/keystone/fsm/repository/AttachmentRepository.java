package com.keystone.fsm.repository;

import com.keystone.fsm.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByWorkOrderId(Long workOrderId);
}
