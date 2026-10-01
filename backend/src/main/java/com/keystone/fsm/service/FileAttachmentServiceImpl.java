package com.keystone.fsm.service;

import com.keystone.fsm.dto.FileAttachmentResponse;
import com.keystone.fsm.dto.UploadResult;
import com.keystone.fsm.entity.FileAttachment;
import com.keystone.fsm.entity.Attachment;
import com.keystone.fsm.entity.AttachmentType;
import com.keystone.fsm.repository.AttachmentRepository;
import com.keystone.fsm.repository.FileAttachmentRepository;
import com.keystone.fsm.exception.StorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.cloudinary.Cloudinary;
import com.keystone.fsm.repository.WorkOrderRepository;
import com.keystone.fsm.entity.WorkOrder;
import java.util.Optional;
import com.keystone.fsm.dto.AttachmentDTO;


@Slf4j
@Service
@RequiredArgsConstructor
public class FileAttachmentServiceImpl implements FileAttachmentService {

    private final StorageService storageService;
    private final FileAttachmentRepository fileAttachmentRepository;
    private final Cloudinary cloudinary;
    private final WorkOrderRepository workOrderRepository;
    private final AttachmentRepository attachmentRepo;
    @Override
    @Transactional
    public FileAttachmentResponse upload(MultipartFile file, AttachmentType type,
                                         Long referenceId, String referenceType) {
        if (file == null || file.isEmpty()) {
            throw new StorageException("File is empty");
        }

        UploadResult result = storageService.upload(file, type);

        FileAttachment attachment = FileAttachment.builder()
                .originalFileName(file.getOriginalFilename())
                .storedFileName(result.getStoredFileName())
                .publicId(result.getPublicId())
                .url(result.getUrl())
                .contentType(file.getContentType())
                .size(file.getSize())
                .type(type)
                .provider(storageService.getProvider())
                .referenceId(referenceId)
                .referenceType(referenceType)
                .build();

        FileAttachment saved = fileAttachmentRepository.save(attachment);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public FileAttachmentResponse uploadAuto(MultipartFile file,
                                             Long referenceId, String referenceType) {
        AttachmentType type = AttachmentType.fromContentType(file.getContentType());
        return upload(file, type, referenceId, referenceType);
    }

    @Override
    @Transactional
    public void delete(Long attachmentId) {
        FileAttachment attachment = fileAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new StorageException("Attachment not found: " + attachmentId));

        storageService.delete(attachment.getPublicId(), attachment.getType());
        fileAttachmentRepository.delete(attachment);
    }

    @Override
    public FileAttachmentResponse getById(Long id) {
        return fileAttachmentRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new StorageException("Attachment not found: " + id));
    }

    @Override
    public List<FileAttachmentResponse> getByReference(Long referenceId, String referenceType) {
        return fileAttachmentRepository
                .findByReferenceIdAndReferenceType(referenceId, referenceType)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private FileAttachmentResponse toResponse(FileAttachment a) {
        return FileAttachmentResponse.builder()
                .id(a.getId())
                .originalFileName(a.getOriginalFileName())
                .url(a.getUrl())
                .contentType(a.getContentType())
                .size(a.getSize())
                .type(a.getType())
                .provider(a.getProvider())
                .createdAt(a.getCreatedAt())
                .build();
    }

   @Override
    @Transactional
    public AttachmentDTO uploadLegacy(MultipartFile file, String folder) {
        validateFile(file);

        try {
            Map<String, Object> uploadOption = new HashMap<>();
            uploadOption.put("resource_type", "auto");
            uploadOption.put("folder",
                    folder != null && !folder.isBlank() ? folder : "default");
            uploadOption.put("use_filename", true);
            uploadOption.put("unique_filename", true);

            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult =
                    cloudinary.uploader().upload(file.getBytes(), uploadOption);

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId  = (String) uploadResult.get("public_id");

            Attachment attach = Attachment.builder()
                    .fileName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .sizeOfFile(file.getSize())
                    .storagePath(secureUrl)
                    .cloudinaryId(publicId)
                    .filePath(secureUrl)
                    .build();

            Attachment saved = attachmentRepo.save(attach);
            return toDto(saved);

        } catch (StorageException e) {
            // Validation / known business errors pass through unchanged
            throw e;
        } catch (Exception e) {
            log.error("Cloudinary legacy upload failed for file={}",
                    file.getOriginalFilename(), e);
            throw new StorageException("Cloud upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public AttachmentDTO getLegacyAttachmentById(Long id) {
        Attachment a = attachmentRepo.findById(id)
                .orElseThrow(() -> new StorageException(
                        "Legacy attachment not found: " + id));
        return toDto(a);
    }
    private AttachmentDTO toDto(Attachment a) {
        return AttachmentDTO.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .contentType(a.getContentType())
                .sizeOfFile(a.getSizeOfFile())
                .storagePath(a.getStoragePath())
                .cloudinaryId(a.getCloudinaryId())
                .filePath(a.getFilePath())
                // getId() on a lazy proxy is safe — no DB hit, no initialization
                .workOrderId(a.getWorkOrder() != null ? a.getWorkOrder().getId() : null)
                .uploadedAt(a.getUploadedAt())
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new StorageException("File cannot be empty");
        }

        long MAX = 10 * 1024 * 1024; // 10 MB
        if (file.getSize() > MAX) {
            throw new StorageException(
                    "Max file size is 10MB (received: " + file.getSize() + " bytes)");
        }

        List<String> allowed = List.of("image/png", "image/jpeg", "video/mp4");
        if (!allowed.contains(file.getContentType())) {
            throw new StorageException(
                    "Invalid file format: " + file.getContentType()
                            + " (allowed: png, jpeg, mp4)");
        }
    }
}