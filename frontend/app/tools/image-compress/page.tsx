"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Upload, X, Download, Loader2, ArrowLeft, Minimize2, Image as ImageIcon, Check } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import LoadingMessage from "../../components/LoadingMessage";

const API_URL = "http://127.0.0.1:8000";

const QUALITY_OPTIONS = [
    { value: 30, label: "Low Quality", desc: "Max compression (Smallest size)", reduction: "~70%" },
    { value: 60, label: "Medium Quality", desc: "Balanced", reduction: "~40%" },
    { value: 85, label: "High Quality", desc: "Best quality (Larger size)", reduction: "~15%" },
];

export default function ImageCompressPage() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [quality, setQuality] = useState(60);
    const [processingStatus, setProcessingStatus] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setResultUrl(null);
        }
    };

    const handleProcess = async () => {
        if (!imageFile) return;

        setIsProcessing(true);
        setProcessingStatus("Compressing image...");

        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("quality", quality.toString());

        try {
            const res = await axios.post(`${API_URL}/compress-image`, formData);
            setResultUrl(res.data.image_url);
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
                        <Minimize2 size={18} className="text-white/50" />
                        Compress Image
                    </h1>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        <div className="card p-6">
                            <h2 className="mb-4 text-sm font-medium text-white/70">1. Upload Image</h2>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleUpload}
                            />
                            {!imageFile ? (
                                <label
                                    onClick={() => fileInputRef.current?.click()}
                                    className="upload-zone flex h-44 w-full cursor-pointer flex-col items-center justify-center"
                                >
                                    <ImageIcon className="mb-3 h-8 w-8 text-white/30" />
                                    <p className="text-sm text-white/50"><span className="text-white/70">Click to upload</span></p>
                                    <p className="text-xs text-white/30 mt-1">JPG, PNG, WEBP</p>
                                </label>
                            ) : (
                                <div
                                    className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.05] transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                                            <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-full w-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium max-w-[200px] truncate">{imageFile.name}</p>
                                            <p className="text-xs text-white/40">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setImageFile(null);
                                            setResultUrl(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="text-white/40 hover:text-white transition-colors p-2"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {imageFile && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70">2. Select Quality</h2>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/50">Compression Quality</span>
                                            <span className="font-medium">{quality}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="100"
                                            value={quality}
                                            onChange={(e) => setQuality(parseInt(e.target.value))}
                                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                                        />
                                        <div className="flex justify-between text-xs text-white/30">
                                            <span>Max Compression</span>
                                            <span>Best Quality</span>
                                        </div>
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
                                        "Compress Image"
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
                                <div className="relative flex-1 rounded-xl border border-white/10 bg-black/50 flex items-center justify-center overflow-hidden">
                                    <img src={resultUrl} alt="Result" className="max-h-[400px] max-w-full object-contain" />
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            if (!resultUrl) return;
                                            try {
                                                const response = await axios.get(resultUrl, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `compressed_${imageFile?.name || 'image'}`);
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
                                <Minimize2 className="mb-4 h-12 w-12 text-white/15" />
                                <p className="text-white/30">Result will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
