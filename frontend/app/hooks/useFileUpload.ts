/**
 * Copyright (c) 2026 Ralein Nova. All rights reserved.
 * Proprietary and confidential. Unauthorized copying is prohibited.
 */

"use client";

import { useState, useCallback } from "react";
import { uploadVideo, uploadImage } from "../lib/api";

interface UseFileUploadOptions {
    type: "video" | "image";
    endpoint?: string; // For image uploads that go directly to processing endpoint
    additionalData?: Record<string, string | number>;
}

interface UseFileUploadResult {
    // State
    file: File | null;
    uploading: boolean;
    uploadProgress: number;
    videoId: string | null;
    firstFrameUrl: string | null;
    resultUrl: string | null;
    error: string | null;

    // Actions
    uploadFile: (file: File) => Promise<void>;
    reset: () => void;
    setFile: (file: File | null) => void;
}

/**
 * Custom hook for handling file uploads (video or image).
 * Provides upload state management and progress tracking.
 */
export function useFileUpload(options: UseFileUploadOptions): UseFileUploadResult {
    const { type, endpoint, additionalData } = options;

    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(
        async (fileToUpload: File) => {
            setFile(fileToUpload);
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            try {
                if (type === "video") {
                    const result = await uploadVideo(fileToUpload, (progress) => {
                        setUploadProgress(progress);
                    });
                    setVideoId(result.video_id);
                    setFirstFrameUrl(result.first_frame_url);
                } else if (type === "image" && endpoint) {
                    const result = await uploadImage(
                        fileToUpload,
                        endpoint,
                        additionalData,
                        (progress) => {
                            setUploadProgress(progress);
                        }
                    );
                    if (result.image_url) {
                        setResultUrl(result.image_url as string);
                    }
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Upload failed";
                setError(message);
                console.error("Upload error:", err);
            } finally {
                setUploading(false);
            }
        },
        [type, endpoint, additionalData]
    );

    const reset = useCallback(() => {
        setFile(null);
        setUploading(false);
        setUploadProgress(0);
        setVideoId(null);
        setFirstFrameUrl(null);
        setResultUrl(null);
        setError(null);
    }, []);

    return {
        file,
        uploading,
        uploadProgress,
        videoId,
        firstFrameUrl,
        resultUrl,
        error,
        uploadFile,
        reset,
        setFile,
    };
}
