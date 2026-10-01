package com.keystone.fsm.entity;

public enum AttachmentType {
    IMAGE,
    VIDEO,
    RAW;

    public static AttachmentType fromContentType(String contentType) {
        if (contentType == null) return RAW;
        if (contentType.startsWith("image/")) return IMAGE;
        if (contentType.startsWith("video/")) return VIDEO;
        return RAW;
    }
}