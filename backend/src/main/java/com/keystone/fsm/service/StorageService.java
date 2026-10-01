package com.keystone.fsm.service;

import com.keystone.fsm.dto.UploadResult;
import com.keystone.fsm.entity.AttachmentType;
import com.keystone.fsm.entity.StorageProvider;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    /**
     * Uploads a file and returns metadata about the stored object.
     */
    UploadResult upload(MultipartFile file, AttachmentType type);

    /**
     * Deletes a file by its public ID.
     */
    void delete(String publicId, AttachmentType type);

    /**
     * Which provider this implementation represents.
     */
    StorageProvider getProvider();

    public String store(MultipartFile file, String folder);
	public byte[] read(String storagePath);
	public void deleteFile(String cloudId);

}