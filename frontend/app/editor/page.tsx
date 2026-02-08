"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Upload, X, Check, Loader2, Play, Palette, ArrowLeft, Video, AlertCircle } from "lucide-react";
import clsx from "clsx";
import SuccessModal from "../components/SuccessModal";
import ConfirmationModal from "../components/ConfirmationModal";
import LoadingMessage from "../components/LoadingMessage";

const API_URL = "http://localhost:8000";

const BG_PRESETS = [
    { name: "Transparent", value: "transparent" },
    { name: "Green", value: "#00FF00" },
    { name: "Blue", value: "#0000FF" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
];

export default function EditorPage() {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [frameUrl, setFrameUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSegmenting, setIsSegmenting] = useState(false);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [mode, setMode] = useState<"auto" | "segment">("segment");

    const [backgroundColor, setBackgroundColor] = useState("#00FF00");
    const [customColor, setCustomColor] = useState("#FF00FF");
    const [showCustomPicker, setShowCustomPicker] = useState(false);

    const [processingStatus, setProcessingStatus] = useState<string>("Processing Video...");
    const [processingStep, setProcessingStep] = useState(0);

    const [imgDims, setImgDims] = useState<{ w: number, h: number } | null>(null);

    const [xmin, setXmin] = useState(0);
    const [ymin, setYmin] = useState(0);
    const [xmax, setXmax] = useState(100);
    const [ymax, setYmax] = useState(100);

    // Modal States
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [successTitle, setSuccessTitle] = useState("Success");

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [confirmTitle, setConfirmTitle] = useState("Confirm Action");
    const [confirmCallback, setConfirmCallback] = useState<() => void>(() => { });
    const [isConfirmDestructive, setIsConfirmDestructive] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
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
                setFrameUrl(res.data.frame_url);
                setResultUrl(null);
                setSuccessTitle("Upload Complete");
                setSuccessMessage("Video uploaded successfully. You can now adjust the settings.");
                setShowSuccessModal(true);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Upload failed");
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSegment = async () => {
        if (!videoId) return;
        if (mode === "segment" && !imgDims) {
            alert("Please wait for the frame to load!");
            return;
        }

        setIsSegmenting(true);
        setProcessingStep(0);
        setProcessingStatus("Initializing...");

        const formData = new FormData();
        formData.append("video_id", videoId);
        formData.append("background_color", backgroundColor);

        if (mode === "segment") {
            // Calculate scaling factor between displayed image and original video frame
            const img = imgRef.current;
            if (!img) return; // Should be handled by top check but safe to add

            // xmin, ymin, etc are already in original image coordinates because
            // range inputs max is set to imgDims.w/h which are original dims.
            // Let's verify:
            // <input type="range" max={imgDims.w} ... />
            // So xmin is in 0..original_width range.

            const bbox = [xmin, ymin, xmax, ymax];

            // Ensure coordinates are integers
            const bboxInt = bbox.map(coord => Math.round(coord));
            formData.append("bbox", JSON.stringify(bboxInt));
        }

        const statusUpdates = [
            { step: 1, msg: "Extracting video frames...", delay: 500 },
            { step: 2, msg: "Running AI segmentation...", delay: 2000 },
            { step: 3, msg: "Applying background changes...", delay: 4000 },
            { step: 4, msg: "Generating output video...", delay: 6000 },
        ];

        statusUpdates.forEach(({ step, msg, delay }) => {
            setTimeout(() => {
                setProcessingStep(step);
                setProcessingStatus(msg);
            }, delay);
        });

        try {
            const endpoint = mode === "auto" ? "/auto-remove" : "/segment-video";
            const res = await axios.post(`${API_URL}${endpoint}`, formData);
            setResultUrl(res.data.video_url);
            setProcessingStatus("Complete!");
            setProcessingStep(5);
            setSuccessTitle("Segmentation Complete");
            setSuccessMessage("Video background has been successfully removed.");
            setShowSuccessModal(true);
        } catch (err) {
            console.error("Segmentation failed", err);
            alert("Segmentation failed, check console.");
            setProcessingStatus("Failed");
        } finally {
            setIsSegmenting(false);
        }
    };

    useEffect(() => {
        if (frameUrl) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = frameUrl;
            img.onload = () => {
                imgRef.current = img;
                setImgDims({ w: img.width, h: img.height });
                setXmin(Math.floor(img.width / 4));
                setYmin(Math.floor(img.height / 4));
                setXmax(Math.floor(img.width * 3 / 4));
                setYmax(Math.floor(img.height * 3 / 4));
            };
        }
    }, [frameUrl]);

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

        // Canvas size is set to container width
        // Canvas height is set based on aspect ratio

        // img.width/height are original dimensions
        // canvas.width/height are display dimensions

        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;

        const drawX = xmin * scaleX;
        const drawY = ymin * scaleY;
        const drawW = (xmax - xmin) * scaleX;
        const drawH = (ymax - ymin) * scaleY;

        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        const handleSize = 8;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(drawX - handleSize / 2, drawY - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(drawX + drawW - handleSize / 2, drawY - handleSize / 2, handleSize, handleSize);
        ctx.fillRect(drawX - handleSize / 2, drawY + drawH - handleSize / 2, handleSize, handleSize);
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
                        <h1 className="text-lg font-medium flex items-center gap-2">
                            <Video size={18} className="text-white/50" />
                            Video BG Removal
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setConfirmTitle("Clear System?");
                                setConfirmMessage("Are you sure you want to clear all system files? This will delete all uploads and current progress.");
                                setIsConfirmDestructive(true);
                                setConfirmCallback(() => async () => {
                                    try {
                                        await axios.post(`${API_URL}/cleanup`);
                                        setShowConfirmModal(false);
                                        setSuccessTitle("System Cleared");
                                        setSuccessMessage("System files have been successfully cleared.");
                                        setShowSuccessModal(true);
                                        // Reload will happen after closing success modal
                                    } catch (err) {
                                        console.error("Cleanup failed", err);
                                        alert("Cleanup failed");
                                    }
                                });
                                setShowConfirmModal(true);
                            }}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-all border border-red-500/20"
                        >
                            Clear System
                        </button>
                        <button
                            onClick={() => setMode("segment")}
                            className={clsx(
                                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                mode === "segment" ? "bg-white text-black" : "text-white/50 hover:text-white"
                            )}
                        >
                            Precision
                        </button>
                        <button
                            onClick={() => setMode("auto")}
                            className={clsx(
                                "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                                mode === "auto" ? "bg-white text-black" : "text-white/50 hover:text-white"
                            )}
                        >
                            Auto
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <div className="space-y-6">
                        {/* Upload */}
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
                                    <p className="text-sm text-white/50"><span className="text-white/70">Click to upload</span> or drag</p>
                                    <p className="text-xs text-white/30 mt-1">MP4, MOV (Max 60s)</p>
                                </label>
                            ) : (
                                <div
                                    className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/10 p-4 cursor-pointer hover:bg-white/[0.05] transition-colors group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Play size={18} className="text-white/70" />
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
                                            setFrameUrl(null);
                                            setImgDims(null);
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

                        {/* Bounding Box */}
                        {frameUrl && mode === "segment" && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70">2. Adjust Bounding Box</h2>
                                <p className="mb-4 text-xs text-white/40">Use sliders to select the subject.</p>

                                <div className="relative overflow-hidden rounded-xl bg-black/50 border border-white/10 mb-6">
                                    <canvas ref={canvasRef} className="w-full" />
                                </div>

                                {imgDims && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">X Min: {xmin}</label>
                                            <input type="range" min={0} max={imgDims.w} value={xmin} onChange={(e) => setXmin(Math.min(Number(e.target.value), xmax - 10))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Y Min: {ymin}</label>
                                            <input type="range" min={0} max={imgDims.h} value={ymin} onChange={(e) => setYmin(Math.min(Number(e.target.value), ymax - 10))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">X Max: {xmax}</label>
                                            <input type="range" min={0} max={imgDims.w} value={xmax} onChange={(e) => setXmax(Math.max(Number(e.target.value), xmin + 10))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-white/40 mb-1">Y Max: {ymax}</label>
                                            <input type="range" min={0} max={imgDims.h} value={ymax} onChange={(e) => setYmax(Math.max(Number(e.target.value), ymin + 10))} className="w-full" />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex items-center text-white/50 text-xs">
                                    <Check size={14} className="mr-2" />
                                    Box: [{xmin}, {ymin}, {xmax}, {ymax}]
                                </div>
                            </div>
                        )}

                        {/* Background Color */}
                        {videoId && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70 flex items-center gap-2">
                                    <Palette size={16} />
                                    {mode === "segment" ? "3. Background Color" : "2. Background Color"}
                                </h2>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {BG_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => { setBackgroundColor(preset.value); setShowCustomPicker(false); }}
                                            className={clsx(
                                                "relative h-10 w-10 rounded-lg transition-all border-2",
                                                preset.value === "transparent"
                                                    ? "bg-[linear-gradient(45deg,#333_25%,transparent_25%),linear-gradient(-45deg,#333_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#333_75%),linear-gradient(-45deg,transparent_75%,#333_75%)] bg-[length:10px_10px]"
                                                    : "",
                                                backgroundColor === preset.value
                                                    ? "border-white ring-2 ring-white/20"
                                                    : "border-white/10 hover:border-white/30"
                                            )}
                                            style={{ backgroundColor: preset.value !== "transparent" ? preset.value : undefined }}
                                        >
                                            {backgroundColor === preset.value && (
                                                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-lg" />
                                            )}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowCustomPicker(!showCustomPicker)}
                                        className={clsx(
                                            "h-10 px-4 rounded-lg text-sm font-medium transition-all border-2",
                                            showCustomPicker ? "border-white bg-white/10" : "border-white/10 hover:border-white/30"
                                        )}
                                    >
                                        Custom
                                    </button>
                                </div>

                                {showCustomPicker && (
                                    <div className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-lg border border-white/10">
                                        <input
                                            type="color"
                                            value={customColor}
                                            onChange={(e) => { setCustomColor(e.target.value); setBackgroundColor(e.target.value); }}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={customColor}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                                    setCustomColor(val);
                                                    if (val.length === 7) setBackgroundColor(val);
                                                }
                                            }}
                                            placeholder="#FF00FF"
                                            className="flex-1 bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                                        />
                                    </div>
                                )}

                                <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                                    <span>Selected:</span>
                                    <div
                                        className={clsx("w-5 h-5 rounded border border-white/20", backgroundColor === "transparent" && "bg-[linear-gradient(45deg,#333_25%,transparent_25%),linear-gradient(-45deg,#333_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#333_75%),linear-gradient(-45deg,transparent_75%,#333_75%)] bg-[length:6px_6px]")}
                                        style={{ backgroundColor: backgroundColor !== "transparent" ? backgroundColor : undefined }}
                                    />
                                    <span className="font-mono text-white/60">{backgroundColor}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Output */}
                    <div className="card p-6 min-h-[500px] flex flex-col">
                        <h2 className="mb-4 text-sm font-medium text-white/70">Output</h2>

                        {isSegmenting ? (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <LoadingMessage status={processingStatus} />
                                <div className="mt-6 w-full max-w-xs">
                                    <div className="flex justify-between text-xs text-white/40 mb-2">
                                        <span>Step {processingStep}/4</span>
                                        <span>{Math.min(processingStep * 25, 100)}%</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-1.5">
                                        <div className="bg-white h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(processingStep * 25, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        ) : resultUrl ? (
                            <div className="flex flex-1 flex-col">
                                <video src={resultUrl} controls autoPlay loop className="w-full rounded-xl border border-white/10" />
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={async () => {
                                            if (!resultUrl) return;
                                            try {
                                                const response = await axios.get(resultUrl, { responseType: 'blob' });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `bg_removed_${videoFile?.name || 'video'}.mp4`);
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
                                        Download Video
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <Video className="mb-4 h-12 w-12 text-white/15" />
                                <p className="text-white/30">Result will appear here</p>
                            </div>
                        )}

                        <div className="mt-6 border-t border-white/10 pt-6">
                            <button
                                onClick={handleSegment}
                                disabled={!videoId || isSegmenting}
                                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
                            >
                                {mode === "auto" ? "Start Auto Removal" : "Run Segmentation"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    if (successTitle === "System Cleared") {
                        window.location.reload();
                    }
                }}
                title={successTitle}
                message={successMessage}
            />

            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={confirmCallback}
                title={confirmTitle}
                message={confirmMessage}
                isDestructive={isConfirmDestructive}
                confirmText={isConfirmDestructive ? "Clear Everything" : "Confirm"}
            />
        </div >
    );
}
