package com.keystone.fsm.controller;

import com.keystone.fsm.dto.FileAttachmentResponse;
import com.keystone.fsm.entity.Attachment;
import com.keystone.fsm.entity.AttachmentType;
import com.keystone.fsm.service.FileAttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.keystone.fsm.dto.AttachmentDTO;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attachments")
@RequiredArgsConstructor
public class FileAttachmentController {

    private final FileAttachmentService fileAttachmentService;

    @PostMapping("/image")
    public ResponseEntity<FileAttachmentResponse> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) String referenceType) {
        return ResponseEntity.ok(
                fileAttachmentService.upload(file, AttachmentType.IMAGE, referenceId, referenceType));
    }

    @PostMapping("/video")
    public ResponseEntity<FileAttachmentResponse> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) String referenceType) {
        return ResponseEntity.ok(
                fileAttachmentService.upload(file, AttachmentType.VIDEO, referenceId, referenceType));
    }

    @PostMapping("/raw")
    public ResponseEntity<FileAttachmentResponse> uploadRaw(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) String referenceType) {
        return ResponseEntity.ok(
                fileAttachmentService.upload(file, AttachmentType.RAW, referenceId, referenceType));
    }

    @PostMapping("/upload")
    public ResponseEntity<FileAttachmentResponse> uploadAuto(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) String referenceType) {
        return ResponseEntity.ok(
                fileAttachmentService.uploadAuto(file, referenceId, referenceType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FileAttachmentResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(fileAttachmentService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<FileAttachmentResponse>> getByReference(
            @RequestParam Long referenceId,
            @RequestParam String referenceType) {
        return ResponseEntity.ok(
                fileAttachmentService.getByReference(referenceId, referenceType));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        fileAttachmentService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }
        //this api are not good for handling workerid so we need to use modern api 
    @PostMapping("/legacy/upload")
    public ResponseEntity<AttachmentDTO> uploadLegacy(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "folder", defaultValue = "default") String folder) {
    return ResponseEntity.ok(fileAttachmentService.uploadLegacy(file, folder));
    }

@GetMapping("/legacy/{id}")
public ResponseEntity<AttachmentDTO> getLegacyAttachment(@PathVariable Long id) {
    return ResponseEntity.ok(fileAttachmentService.getLegacyAttachmentById(id));
}
}