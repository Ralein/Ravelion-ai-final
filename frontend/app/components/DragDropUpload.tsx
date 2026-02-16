"use client";

import { Upload, FileVideo, FileImage, FileAudio, File } from "lucide-react";
import { useState, useRef } from "react";
import clsx from "clsx";

interface DragDropUploadProps {
    onFileSelect: (file: File) => void;
    accept: string;
    label?: string;
    subLabel?: string;
    icon?: React.ElementType;
    maxSizeMB?: number; // Optional max size in MB
}

export default function DragDropUpload({
    onFileSelect,
    accept,
    label = "Click to upload",
    subLabel = "or drag and drop",
    icon: Icon = Upload,
    maxSizeMB
}: DragDropUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set to false if we're actually leaving the container,
        // not just moving between child elements.
        const rect = e.currentTarget.getBoundingClientRect();
        if (
            e.clientX < rect.left ||
            e.clientX >= rect.right ||
            e.clientY < rect.top ||
            e.clientY >= rect.bottom
        ) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSelect(e.target.files[0]);
        }
    };

    const validateAndSelect = (file: File) => {
        // Simple size check
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
            alert(`File too large. Max size: ${maxSizeMB}MB`);
            return;
        }

        onFileSelect(file);
        // Reset input value so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
                "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all cursor-pointer group",
                isDragging
                    ? "border-white bg-white/10"
                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
            )}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleChange}
            />

            <div className={clsx(
                "p-4 rounded-full bg-white/5 mb-4 group-hover:scale-110 transition-transform pointer-events-none",
                isDragging && "scale-110 bg-white/10"
            )}>
                <Icon className={clsx("w-8 h-8", isDragging ? "text-white" : "text-white/50")} />
            </div>

            <p className="text-sm font-medium text-white/70 mb-1 pointer-events-none">{label}</p>
            <p className="text-xs text-white/40 pointer-events-none">{subLabel}</p>

            {/* Accept hint */}
            <p className="absolute bottom-4 text-[10px] text-white/20 uppercase tracking-wider pointer-events-none">
                {accept.replace(/\*/g, '').split(',').join(' • ')}
            </p>
        </div>
    );
}
