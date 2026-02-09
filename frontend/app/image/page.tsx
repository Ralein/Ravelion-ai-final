"use client";

import { useState, useRef } from "react";
import axios from "axios";
import { Upload, X, Download, Loader2, ArrowLeft, Palette, Check } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import LoadingMessage from "../components/LoadingMessage";

const API_URL = "http://127.0.0.1:8000";

const BG_PRESETS = [
    { name: "Transparent", value: "transparent" },
    { name: "White", value: "#FFFFFF" },
    { name: "Black", value: "#000000" },
    { name: "Green", value: "#00FF00" },
    { name: "Blue", value: "#0000FF" },
];

export default function ImagePage() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [backgroundColor, setBackgroundColor] = useState("transparent");
    const [customColor, setCustomColor] = useState("#FF00FF");
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResultUrl(null);
        }
    };

    const handleRemoveBg = async () => {
        if (!imageFile) return;

        setIsProcessing(true);
        setProcessingStatus("Uploading image...");

        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("background_color", backgroundColor);

        try {
            setProcessingStatus("Removing background...");
            const res = await axios.post(`${API_URL}/remove-bg-pro`, formData);
            setResultUrl(res.data.image_url);
            setProcessingStatus("Complete!");
        } catch (err) {
            console.error("Processing failed", err);
            alert("Processing failed. Please try again.");
            setProcessingStatus("Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClear = () => {
        setImageFile(null);
        setImagePreview(null);
        setResultUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-white/[0.06] bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="text-sm">Back</span>
                    </Link>
                    <div className="h-5 w-px bg-white/10" />
                    <h1 className="text-lg font-medium">Image Background Removal</h1>
                </div>
            </header>

            <main className="container mx-auto py-10 px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Upload */}
                        <div className="card p-6">
                            <h2 className="mb-4 text-sm font-medium text-white/70">1. Upload Image</h2>

                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />

                            {!imageFile ? (
                                <label
                                    onClick={() => fileInputRef.current?.click()}
                                    className="upload-zone flex h-56 w-full cursor-pointer flex-col items-center justify-center"
                                >
                                    <Upload className="mb-3 h-10 w-10 text-white/30" />
                                    <p className="text-sm text-white/50">
                                        <span className="text-white/70">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="mt-1 text-xs text-white/30">PNG, JPG, WebP</p>
                                </label>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden bg-white/[0.02] group">
                                    <img
                                        src={imagePreview!}
                                        alt="Preview"
                                        className="w-full max-h-56 object-contain cursor-pointer transition-opacity hover:opacity-80"
                                        onClick={() => fileInputRef.current?.click()}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleClear();
                                        }}
                                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition-colors z-10"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Background Color */}
                        {imageFile && (
                            <div className="card p-6 animate-fade-in">
                                <h2 className="mb-4 text-sm font-medium text-white/70 flex items-center gap-2">
                                    <Palette size={16} />
                                    2. Background Color
                                </h2>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {BG_PRESETS.map((preset) => (
                                        <button
                                            key={preset.value}
                                            onClick={() => {
                                                setBackgroundColor(preset.value);
                                                setShowCustomPicker(false);
                                            }}
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
                                            showCustomPicker
                                                ? "border-white bg-white/10"
                                                : "border-white/10 hover:border-white/30"
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
                                            onChange={(e) => {
                                                setCustomColor(e.target.value);
                                                setBackgroundColor(e.target.value);
                                            }}
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

                                <button
                                    onClick={handleRemoveBg}
                                    disabled={!imageFile || isProcessing}
                                    className="mt-6 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {processingStatus}
                                        </span>
                                    ) : (
                                        "Remove Background"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Result */}
                    <div className="card p-6 min-h-[400px] flex flex-col">
                        <h2 className="mb-4 text-sm font-medium text-white/70">Result</h2>

                        {isProcessing ? (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <LoadingMessage status={processingStatus || "Processing Image..."} />
                            </div>
                        ) : resultUrl ? (
                            <div className="flex flex-1 flex-col">
                                <div
                                    className="relative rounded-xl overflow-hidden flex-1 flex items-center justify-center"
                                    style={{
                                        backgroundImage: backgroundColor === "transparent"
                                            ? "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)"
                                            : undefined,
                                        backgroundSize: "16px 16px",
                                        backgroundColor: backgroundColor !== "transparent" ? backgroundColor : "#1a1a1a"
                                    }}
                                >
                                    <img
                                        src={resultUrl}
                                        alt="Result"
                                        className="max-w-full max-h-72 object-contain"
                                    />
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
                                                link.setAttribute('download', `removed_bg.${backgroundColor === 'transparent' ? 'png' : 'jpg'}`);
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
                                        <Download size={16} />
                                        Download .{backgroundColor === 'transparent' ? 'PNG' : 'JPG'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col items-center justify-center text-center">
                                <div className="mb-4 h-20 w-20 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                                    <Upload className="h-8 w-8 text-white/20" />
                                </div>
                                <p className="text-white/30">Upload an image to get started</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
