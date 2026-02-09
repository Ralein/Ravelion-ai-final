/**
 * Copyright (c) 2026 Ralein Nova. All rights reserved.
 * Proprietary and confidential. Unauthorized copying is prohibited.
 */

/**
 * Shared constants for the Ravelion AI frontend.
 */

// Supported video formats
export const VIDEO_FORMATS = ["mp4", "mov", "webm", "avi"] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number];

// Supported image formats
export const IMAGE_FORMATS = ["png", "jpg", "jpeg", "webp", "bmp", "tiff"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];

// Compression quality levels
export const COMPRESSION_QUALITY = {
    low: { label: "Low (Smallest File)", crf: 35 },
    medium: { label: "Medium (Balanced)", crf: 28 },
    high: { label: "High (Best Quality)", crf: 23 },
} as const;

export type CompressionQuality = keyof typeof COMPRESSION_QUALITY;

// Speed presets
export const SLOWMO_SPEEDS = [
    { value: 0.25, label: "0.25x (Very Slow)" },
    { value: 0.5, label: "0.5x (Slow)" },
    { value: 0.75, label: "0.75x (Slightly Slow)" },
] as const;

export const FASTMO_SPEEDS = [
    { value: 1.5, label: "1.5x" },
    { value: 2.0, label: "2x" },
    { value: 3.0, label: "3x" },
    { value: 4.0, label: "4x" },
] as const;

// Background color options for segmentation
export const BACKGROUND_COLORS = [
    { value: "transparent", label: "Transparent", color: null },
    { value: "#00FF00", label: "Green Screen", color: "#00FF00" },
    { value: "#0000FF", label: "Blue Screen", color: "#0000FF" },
    { value: "#FFFFFF", label: "White", color: "#FFFFFF" },
    { value: "#000000", label: "Black", color: "#000000" },
] as const;

// File size limits (in bytes)
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
export const MAX_IMAGE_SIZE = 50 * 1024 * 1024;  // 50MB

// UI Messages
export const MESSAGES = {
    UPLOAD_SUCCESS: "File uploaded successfully!",
    PROCESSING: "Processing your file...",
    ERROR_FILE_TOO_LARGE: "File is too large. Please select a smaller file.",
    ERROR_INVALID_FORMAT: "Invalid file format.",
    ERROR_UPLOAD_FAILED: "Upload failed. Please try again.",
    ERROR_PROCESSING_FAILED: "Processing failed. Please try again.",
} as const;
