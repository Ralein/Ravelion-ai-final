"use client";

import { useState, useRef } from "react";
import { uploadVideo, processVideo, api } from "../../lib/api";
import { Upload, X, Download, Loader2, ArrowLeft, FileType, Play, Check } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import LoadingMessage from "../../components/LoadingMessage";
import DragDropUpload from "../../components/DragDropUpload";



const FORMATS = [
    { value: "mp4", label: "MP4", desc: "Universal" },
    { value: "mov", label: "MOV", desc: "Apple" },
    { value: "webm", label: "WebM", desc: "Web" },
    { value: "avi", label: "AVI", desc: "Legacy" },
];

export default function ConvertPage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [format, setFormat] = useState("mp4");
    const [processingStatus, setProcessingStatus] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        setVideoFile(file);
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await uploadVideo(file);
            setVideoId(res.video_id);
            setResultUrl(null);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!videoId) return;

        setIsProcessing(true);
        setProcessingStatus(`Converting to ${format.toUpperCase()}...`);

        const formData = new FormData();
        formData.append("video_id", videoId);
        formData.append("format", format);

        try {
            const res = await processVideo("/convert", videoId, { format });
            setResultUrl(res.video_url as string);
            setProcessingStatus("Complete!");
        } catch (err) {
            console.error("Processing failed", err);
            alert("Processing failed");
            setProcessingStatus("Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm">Back</span>
                    </Link>
                    <div className="h-5 w-px bg-white/10" />
                    <h1 className="text-lg font-medium flex items-center gap-2">
                        <FileType size={18} className="text-white/50" />
                        Format Convert
                    </h1>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className="mb-4 text-sm font-medium text-white/70">1. Upload Video</h2>

                            {!videoFile ? (
                                <DragDropUpload
                                    onFileSelect={uploadFile}
                                    accept="video/*"
                                    label="Upload Video"
                                    subLabel="Drag and drop or click to upload"
                                    icon={Upload}
                                />
                            ) : (
                                <div
                                    className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.05] transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                            {isUploading ? (
                                                <Loader2 className="h-5 w-5 animate-spin text-white/70" />
                                            ) : (
                                                <Play size={18} className="text-white/70" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium max-w-[200px] truncate">{videoFile.name}</p>
                                            <p className="text-xs text-white/40">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setVideoFile(null);
                                            setVideoId(null);
                                            // Reset input
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="text-white/40 hover:text-white transition-colors p-2"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="video/*"
                                onChange={handleUpload}
                            />
                        </div>

                        {videoId && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70">2. Select Format</h2>
                                <div className="grid grid-cols-4 gap-2">
                                    {FORMATS.map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setFormat(f.value)}
                                            className={clsx(
                                                "relative p-3 rounded-xl border-2 transition-all text-center",
                                                format === f.value
                                                    ? "border-white/30 bg-white/[0.05]"
                                                    : "border-white/10 hover:border-white/20"
                                            )}
                                        >
                                            <span className="text-sm font-bold">.{f.value}</span>
                                            <p className="text-[10px] text-white/40 mt-0.5">{f.desc}</p>
                                            {format === f.value && (
                                                <Check className="absolute top-1 right-1 h-3 w-3 text-white" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleProcess}
                                    disabled={isProcessing}
                                    className="mt-6 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {processingStatus}
                                        </span>
                                    ) : (
                                        `Convert to ${format.toUpperCase()}`
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card p-6 min-h-[400px] flex flex-col">
                        <h2 className="mb-4 text-sm font-medium text-white/70">Result</h2>
                        {isProcessing ? (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <LoadingMessage status={processingStatus} />
                            </div>
                        ) : resultUrl ? (
                            <div className="flex flex-1 flex-col">
                                <video src={resultUrl} controls className="w-full rounded-xl border border-white/10" />
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            if (!resultUrl) return;
                                            try {
                                                const response = await api.get(resultUrl, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `converted_${videoFile?.name || 'video'}.${format}`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.parentNode?.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                            } catch (error) {
                                                console.error("Download failed", error);
                                            }
                                        }}
                                        className="btn-primary inline-flex items-center gap-2"
                                    >
                                        <Download size={16} /> Download .{format}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <FileType className="mb-4 h-12 w-12 text-white/15" />
                                <p className="text-white/30">Result will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
