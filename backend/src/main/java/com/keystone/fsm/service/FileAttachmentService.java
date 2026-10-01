package com.keystone.fsm.service;

import com.keystone.fsm.dto.FileAttachmentResponse;
import com.keystone.fsm.dto.AttachmentDTO;
import com.keystone.fsm.entity.Attachment;
import com.keystone.fsm.entity.AttachmentType;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileAttachmentService {

    FileAttachmentResponse upload(MultipartFile file, AttachmentType type,
                                  Long referenceId, String referenceType);

    FileAttachmentResponse uploadAuto(MultipartFile file,
                                      Long referenceId, String referenceType);

    void delete(Long attachmentId);

    FileAttachmentResponse getById(Long id);

    List<FileAttachmentResponse> getByReference(Long referenceId, String referenceType);

   AttachmentDTO uploadLegacy(MultipartFile file, String folder);
    AttachmentDTO getLegacyAttachmentById(Long id);
	

}