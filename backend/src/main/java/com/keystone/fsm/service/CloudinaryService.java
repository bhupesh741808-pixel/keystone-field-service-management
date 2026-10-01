package com.keystone.fsm.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    /**
     * Uploads an image file to Cloudinary.
     */
    public String uploadImage(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "image",
                        "use_filename", true,
                        "unique_filename", true
                )
        );
        return uploadResult.get("secure_url").toString();
    }

    /**
     * Uploads a video file to Cloudinary.
     * Cloudinary automatically generates a thumbnail and supports streaming.
     */
    public String uploadVideo(MultipartFile file) throws IOException {
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "video",
                        "use_filename", true,
                        "unique_filename", true,
                        "overwrite", false
                )
        );
        return uploadResult.get("secure_url").toString();
    }

    /**
     * Uploads a raw file (PDF, DOCX, ZIP, etc.) to Cloudinary.
     * Note: public_id MUST include the file extension for raw files.
     */
    public String uploadRawFile(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        // Extract extension from the original filename
        String publicId = (originalName != null && originalName.contains("."))
                ? originalName.substring(0, originalName.lastIndexOf("."))
                : originalName;

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", "raw",
                        "public_id", publicId + getExtension(originalName),
                        "use_filename", true,
                        "unique_filename", true
                )
        );
        return uploadResult.get("secure_url").toString();
    }

    /**
     * Generic upload — detects the resource type based on content type.
     * Use this if you want a single endpoint for everything.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null) {
            return uploadRawFile(file);
        }
        if (contentType.startsWith("image/")) {
            return uploadImage(file);
        } else if (contentType.startsWith("video/")) {
            return uploadVideo(file);
        } else {
            return uploadRawFile(file);
        }
    }

    /**
     * Deletes a file from Cloudinary given its public ID and resource type.
     */
    public Map<?, ?> deleteFile(String publicId, String resourceType) throws IOException {
        return cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.asMap("resource_type", resourceType)
        );
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf("."));
    }
}