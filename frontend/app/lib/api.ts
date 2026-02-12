/**
 * Copyright (c) 2026 Ralein Nova. All rights reserved.
 * Proprietary and confidential. Unauthorized copying is prohibited.
 */

/**
 * Centralized API client for Ravelion AI frontend.
 */

import axios, { AxiosProgressEvent } from "axios";

// API Base URLs from environment or defaults
// Tools backend: lightweight ffmpeg/opencv operations (slowmo, fastmo, compress, convert, audio, watermark)
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

// Video AI backend: MobileSAM video segmentation
export const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";

// Image AI backend: rembg image background removal
export const AI_IMAGE_API_URL = process.env.NEXT_PUBLIC_AI_IMAGE_API_URL || "http://127.0.0.1:8002";

// Axios instances with default config
export const api = axios.create({
    baseURL: API_URL,
    timeout: 300000, // 5 minutes for video processing
});

export const aiApi = axios.create({
    baseURL: AI_API_URL,
    timeout: 600000, // 10 minutes for AI processing
});

export const aiImageApi = axios.create({
    baseURL: AI_IMAGE_API_URL,
    timeout: 300000, // 5 minutes for image AI
});

/**
 * Upload a video file and get video_id and first frame URL.
 */
export async function uploadVideo(
    file: File,
    onProgress?: (progress: number) => void
): Promise<{
    video_id: string;
    first_frame_url: string;
    video_url: string;
}> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/upload-video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
            }
        },
    });

    return response.data;
}

/**
 * Upload an image file for processing.
 */
export async function uploadImage(
    file: File,
    endpoint: string,
    additionalData?: Record<string, string | number>,
    onProgress?: (progress: number) => void
): Promise<{ status: string; image_url?: string;[key: string]: unknown }> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
    }

    const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
                const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(progress);
            }
        },
    });

    return response.data;
}

/**
 * Process a video that has already been uploaded.
 */
export async function processVideo(
    endpoint: string,
    videoId: string,
    additionalData?: Record<string, string | number>
): Promise<{ status: string; video_url?: string; audio_url?: string;[key: string]: unknown }> {
    const formData = new FormData();
    formData.append("video_id", videoId);

    if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
    }

    const response = await api.post(endpoint, formData);
    return response.data;
}

/**
 * System cleanup endpoint.
 */
export async function cleanupSystem(): Promise<{ status: string; cleaned_items: number }> {
    const response = await api.post("/cleanup");
    return response.data;
}

/**
 * Health check endpoint.
 */
export async function ping(): Promise<{ status: string }> {
    const response = await api.get("/ping");
    return response.data;
}
