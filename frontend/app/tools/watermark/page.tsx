"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Upload, X, Loader2, Play, ArrowLeft, Image as ImageIcon, Video as VideoIcon, Check } from "lucide-react";
import clsx from "clsx";
import SuccessModal from "../../components/SuccessModal";
import DragDropUpload from "../../components/DragDropUpload";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export default function WatermarkPage() {
    const [mode, setMode] = useState<"image" | "video">("image");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // For Video
    const [videoId, setVideoId] = useState<string | null>(null);

    // Bbox
    const [imgDims, setImgDims] = useState<{ w: number, h: number } | null>(null);
    const [xmin, setXmin] = useState(0);
    const [ymin, setYmin] = useState(0);
    const [xmax, setXmax] = useState(100);
    const [ymax, setYmax] = useState(100);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state on mode switch
    useEffect(() => {
        setFile(null);
        setPreviewUrl(null);
        setResultUrl(null);
        setVideoId(null);
        setImgDims(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [mode]);

    const processUpload = async (f: File) => {
        setFile(f);
        setResultUrl(null);

        if (mode === "image") {
            const url = URL.createObjectURL(f);
            setPreviewUrl(url);
        } else {
            const formData = new FormData();
            formData.append("file", f);
            try {
                const res = await axios.post(`${API_URL}/upload-video`, formData);
                setVideoId(res.data.video_id);
                setPreviewUrl(res.data.frame_url);
            } catch (err) {
                console.error(err);
                alert("Upload failed");
            }
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processUpload(e.target.files[0]);
        }
    };

    // Load image for canvas
    useEffect(() => {
        if (previewUrl && mode === "image") {
            const img = new Image();
            img.src = previewUrl;
            img.onload = () => {
                imgRef.current = img;
                setImgDims({ w: img.width, h: img.height });
                // Default box
                setXmin(Math.floor(img.width * 0.4));
                setYmin(Math.floor(img.height * 0.4));
                setXmax(Math.floor(img.width * 0.6));
                setYmax(Math.floor(img.height * 0.6));
            };
        } else if (previewUrl && mode === "video") {
            // For video, previewUrl is the frame image from backend
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = previewUrl;
            img.onload = () => {
                imgRef.current = img;
                setImgDims({ w: img.width, h: img.height });
                // Default box
                setXmin(Math.floor(img.width * 0.4));
                setYmin(Math.floor(img.height * 0.4));
                setXmax(Math.floor(img.width * 0.6));
                setYmax(Math.floor(img.height * 0.6));
            };
        }
    }, [previewUrl, mode]);

    const drawCanvas = useCallback(() => {
        if (!canvasRef.current || !imgRef.current || !imgDims) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = imgRef.current;
        const containerWidth = canvas.parentElement?.clientWidth || 600;
        const ratio = img.height / img.width;
        canvas.width = containerWidth;
        canvas.height = containerWidth * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;

        const drawX = xmin * scaleX;
        const drawY = ymin * scaleY;
        const drawW = (xmax - xmin) * scaleX;
        const drawH = (ymax - ymin) * scaleY;

        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        ctx.fillRect(drawX, drawY, drawW, drawH);

        const handleSize = 8;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(drawX - handleSize / 2, drawY - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(drawX + drawW - handleSize / 2, drawY + drawH - handleSize / 2, handleSize, handleSize);
    }, [imgDims, xmin, ymin, xmax, ymax]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    useEffect(() => {
        const handleResize = () => drawCanvas();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [drawCanvas]);

    const processWatermark = async () => {
        if (!file && !videoId) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            const bbox = JSON.stringify([xmin, ymin, xmax, ymax]);
            formData.append("bbox", bbox);

            if (mode === "image") {
                formData.append("file", file!);
                const res = await axios.post(`${API_URL}/remove-watermark-image`, formData);
                setResultUrl(res.data.image_url);
            } else {
                formData.append("video_id", videoId!);
                const res = await axios.post(`${API_URL}/remove-watermark-video`, formData);
                setResultUrl(res.data.video_url);
            }
            setShowSuccessModal(true);
        } catch (err) {
            console.error(err);
            alert("Processing failed");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                            <ArrowLeft size={18} />
                            <span className="text-sm">Back</span>
                        </Link>
                        <div className="h-5 w-px bg-white/10" />
                        <h1 className="text-lg font-medium">Watermark Remover</h1>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode("image")}
                            className={clsx(
                                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                mode === "image" ? "bg-white text-black" : "text-white/50 hover:text-white"
                            )}
                        >
                            <ImageIcon size={16} /> Image
                        </button>
                        <button
                            onClick={() => setMode("video")}
                            className={clsx(
                                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                mode === "video" ? "bg-white text-black" : "text-white/50 hover:text-white"
                            )}
                        >
                            <VideoIcon size={16} /> Video
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        {/* Upload */}
                        <div className="card p-6">
                            <h2 className="mb-4 text-sm font-medium text-white/70">1. Upload {mode === "image" ? "Image" : "Video"}</h2>
                            {!file ? (
                                <DragDropUpload
                                    onFileSelect={processUpload}
                                    accept={mode === "image" ? "image/*" : "video/*"}
                                    label={`Upload ${mode === "image" ? "Image" : "Video"}`}
                                    subLabel="Drag and drop or click to upload"
                                    icon={mode === "image" ? ImageIcon : VideoIcon}
                                />
                            ) : (
                                <div
                                    className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.05] transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                            {mode === "image" ? <ImageIcon size={18} className="text-white/70" /> : <VideoIcon size={18} className="text-white/70" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium max-w-[200px] truncate">{file.name}</p>
                                            <p className="text-xs text-white/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setPreviewUrl(null);
                                            setVideoId(null);
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
                                accept={mode === "image" ? "image/*" : "video/*"}
                                onChange={handleUpload}
                            />
                        </div>

                        {/* Adjust Bbox */}
                        {previewUrl && imgDims && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70">2. Select Watermark Area</h2>
                                <p className="mb-4 text-xs text-white/40">Drag sliders to cover the watermark with the red box.</p>

                                <div className="relative overflow-hidden rounded-xl bg-black/50 border border-white/10 mb-6">
                                    <canvas ref={canvasRef} className="w-full" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">X Min</label>
                                        <input type="range" min={0} max={imgDims.w} value={xmin} onChange={(e) => setXmin(Math.min(Number(e.target.value), xmax - 10))} className="w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">Y Min</label>
                                        <input type="range" min={0} max={imgDims.h} value={ymin} onChange={(e) => setYmin(Math.min(Number(e.target.value), ymax - 10))} className="w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">X Max</label>
                                        <input type="range" min={0} max={imgDims.w} value={xmax} onChange={(e) => setXmax(Math.max(Number(e.target.value), xmin + 10))} className="w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/40 mb-1">Y Max</label>
                                        <input type="range" min={0} max={imgDims.h} value={ymax} onChange={(e) => setYmax(Math.max(Number(e.target.value), ymin + 10))} className="w-full" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Output */}
                    <div className="card p-6 min-h-[500px] flex flex-col">
                        <h2 className="mb-4 text-sm font-medium text-white/70">Output</h2>

                        {isProcessing ? (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <Loader2 className="animate-spin h-8 w-8 text-white mb-4" />
                                <p className="text-white/70">Removing watermark...</p>
                            </div>
                        ) : resultUrl ? (
                            <div className="flex flex-1 flex-col">
                                {mode === "image" ? (
                                    <img src={resultUrl} className="w-full rounded-xl border border-white/10" />
                                ) : (
                                    <video src={resultUrl} controls autoPlay loop className="w-full rounded-xl border border-white/10" />
                                )}
                                <div className="mt-6 flex justify-end">
                                    <a
                                        href={resultUrl}
                                        download={`watermark_removed_${file?.name}`}
                                        className="btn-primary inline-flex items-center gap-2"
                                    >
                                        Download Result
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-white/20">
                                    {mode === "image" ? <ImageIcon /> : <VideoIcon />}
                                </div>
                                <p className="text-white/30">Result will appear here</p>
                            </div>
                        )}

                        <div className="mt-6 border-t border-white/10 pt-6">
                            <button
                                onClick={processWatermark}
                                disabled={!file || isProcessing || !imgDims}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
                            >
                                Remove Watermark
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Success"
                message="Watermark removed successfully!"
            />
        </div>
    );
}
