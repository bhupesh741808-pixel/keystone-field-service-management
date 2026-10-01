package com.keystone.fsm.service;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.keystone.fsm.dto.UploadResult;
import com.keystone.fsm.entity.AttachmentType;
import com.keystone.fsm.entity.StorageProvider;
import com.keystone.fsm.exception.StorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService implements StorageService {

    private final Cloudinary cloudinary;

    @Override
    public UploadResult upload(MultipartFile file, AttachmentType type) {
        try {
            String resourceType = switch (type) {
                case IMAGE -> "image";
                case VIDEO -> "video";
                case RAW   -> "raw";
            };

            Map<String, Object> options = ObjectUtils.asMap(
                    "resource_type", resourceType,
                    "use_filename", true,
                    "unique_filename", true
            );
           
            if (type == AttachmentType.RAW) {
                String original = file.getOriginalFilename();
                if (original != null && original.contains(".")) {
                    options.put("public_id", original);
                }
            }

            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);

            return UploadResult.builder()
                    .publicId((String) result.get("public_id"))
                    .url((String) result.get("secure_url"))
                    .storedFileName((String) result.get("original_filename"))
                    .size(file.getSize())
                    .build();

        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new StorageException("Cloudinary upload failed", e);
        }
    }

    @Override
    public void delete(String publicId, AttachmentType type) {
        try {
            String resourceType = switch (type) {
                case IMAGE -> "image";
                case VIDEO -> "video";
                case RAW   -> "raw";
            };
            cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType));
        } catch (IOException e) {
            throw new StorageException("Cloudinary delete failed", e);
        }
    }

    @Override
    public StorageProvider getProvider() {
        return StorageProvider.CLOUDINARY;
    }

    @Override
public String store(MultipartFile file, String folder) {
    // Cloudinary doesn't have folders in the classic sense,
    // but you can prefix the public_id to emulate one.
    try {
        String publicId = folder + "/" + file.getOriginalFilename();
        Map<String, Object> options = ObjectUtils.asMap(
                "resource_type", "auto",
                "public_id", publicId,
                "use_filename", true,
                "unique_filename", true
        );
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
        return (String) result.get("public_id");
    } catch (IOException e) {
        throw new StorageException("Cloudinary store failed", e);
    }
}

@Override
public byte[] read(String storagePath) {
    // Cloudinary is a delivery network — you fetch via URL, not bytes.
    // If you need bytes, download from the secure_url:
    try {
        String url = cloudinary.url().generate(storagePath);
        return new java.net.URL(url).openStream().readAllBytes();
    } catch (IOException e) {
        throw new StorageException("Cloudinary read failed", e);
    }
}

@Override
public void deleteFile(String cloudId) {
    delete(cloudId, AttachmentType.RAW);
}
}