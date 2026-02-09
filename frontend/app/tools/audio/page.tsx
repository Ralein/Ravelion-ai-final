"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Upload, X, Download, Loader2, ArrowLeft, Music, Play, VolumeX, Volume2 } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import LoadingMessage from "../../components/LoadingMessage";

const API_URL = "http://127.0.0.1:8000";

export default function AudioPage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [mode, setMode] = useState<"extract" | "remove">("extract");
    const [processingStatus, setProcessingStatus] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setVideoFile(file);
            setIsUploading(true);

            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await axios.post(`${API_URL}/upload-video`, formData);
                setVideoId(res.data.video_id);
                setResultUrl(null);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Upload failed");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleProcess = async () => {
        if (!videoId) return;

        setIsProcessing(true);
        setProcessingStatus(mode === "extract" ? "Extracting audio..." : "Removing audio...");

        const formData = new FormData();
        formData.append("video_id", videoId);

        try {
            const endpoint = mode === "extract" ? "/extract-audio" : "/remove-audio";
            const res = await axios.post(`${API_URL}${endpoint}`, formData);
            setResultUrl(mode === "extract" ? res.data.audio_url : res.data.video_url);
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
                        <Music size={18} className="text-white/50" />
                        Audio Tools
                    </h1>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className="mb-4 text-sm font-medium text-white/70">1. Upload Video</h2>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="video/*"
                                onChange={handleUpload}
                            />

                            {!videoFile ? (
                                <label
                                    onClick={() => fileInputRef.current?.click()}
                                    className="upload-zone flex h-44 w-full cursor-pointer flex-col items-center justify-center"
                                >
                                    <Upload className="mb-3 h-8 w-8 text-white/30" />
                                    <p className="text-sm text-white/50"><span className="text-white/70">Click to upload</span></p>
                                </label>
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
                        </div>

                        {videoId && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70">2. Select Action</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMode("extract")}
                                        className={clsx(
                                            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                            mode === "extract"
                                                ? "border-white/30 bg-white/[0.05]"
                                                : "border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <Volume2 className="h-6 w-6 text-white/70" />
                                        <span className="text-sm font-medium">Extract Audio</span>
                                        <span className="text-xs text-white/40">Get MP3</span>
                                    </button>
                                    <button
                                        onClick={() => setMode("remove")}
                                        className={clsx(
                                            "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                            mode === "remove"
                                                ? "border-white/30 bg-white/[0.05]"
                                                : "border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <VolumeX className="h-6 w-6 text-white/70" />
                                        <span className="text-sm font-medium">Remove Audio</span>
                                        <span className="text-xs text-white/40">Silent video</span>
                                    </button>
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
                                        mode === "extract" ? "Extract Audio" : "Remove Audio"
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
                                {mode === "extract" ? (
                                    <audio src={resultUrl} controls className="w-full" />
                                ) : (
                                    <video src={resultUrl} controls className="w-full rounded-xl border border-white/10" />
                                )}
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            if (!resultUrl) return;
                                            try {
                                                const response = await axios.get(resultUrl, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `audio_${videoFile?.name || 'result'}.${mode === 'extract' ? 'mp3' : 'mp4'}`);
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
                                <Music className="mb-4 h-12 w-12 text-white/15" />
                                <p className="text-white/30">Result will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
