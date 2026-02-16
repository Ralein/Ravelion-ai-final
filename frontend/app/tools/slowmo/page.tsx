"use client";

import { useState, useRef } from "react";
import { uploadVideo, processVideo, api } from "../../lib/api";
import { Upload, X, Download, Loader2, ArrowLeft, Clock, Play } from "lucide-react";
import Link from "next/link";
import LoadingMessage from "../../components/LoadingMessage";
import DragDropUpload from "../../components/DragDropUpload";



export default function SlowMoPage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [speed, setSpeed] = useState(0.5);
    const [processingStatus, setProcessingStatus] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File) => {
        setVideoFile(file);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const res = await uploadVideo(file, (progress) => {
                setUploadProgress(progress);
            });
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
        setProcessingStatus("Applying slow motion...");

        const formData = new FormData();
        formData.append("video_id", videoId);
        formData.append("speed", speed.toString());

        try {
            const res = await processVideo("/slowmo", videoId, { speed });
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
                        <Clock size={18} className="text-white/50" />
                        Slow Motion
                    </h1>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        {/* Upload */}
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
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="text-sm font-medium truncate">{videoFile.name}</p>
                                                {isUploading && <span className="text-[10px] font-mono text-white/40">{uploadProgress}%</span>}
                                            </div>
                                            {isUploading ? (
                                                <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                                    <div
                                                        className="bg-white h-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-xs text-white/40">{(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            )}
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

                        {/* Speed Control */}
                        {videoId && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70">2. Select Speed</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/50">Speed</span>
                                        <span className="font-medium">{speed}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.25}
                                        max={1}
                                        step={0.05}
                                        value={speed}
                                        onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-white/30">
                                        <span>0.25x (Super Slow)</span>
                                        <span>1x (Normal)</span>
                                    </div>
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
                                        "Apply Slow Motion"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Result */}
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
                                                link.setAttribute('download', `slowmo_${videoFile?.name || 'video.mp4'}`);
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
                                        <Download size={16} /> Download
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <Clock className="mb-4 h-12 w-12 text-white/15" />
                                <p className="text-white/30">Result will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
