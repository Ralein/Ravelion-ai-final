"use client";

import { X, CheckCircle } from "lucide-react";

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    buttonText?: string;
}

export default function SuccessModal({
    isOpen,
    onClose,
    title = "Success",
    message,
    buttonText = "OK",
}: SuccessModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a]/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-green-500/10 p-3 ring-1 ring-green-500/20">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>

                    <h3 className="mb-2 text-xl font-semibold text-white">
                        {title}
                    </h3>

                    <p className="mb-6 text-sm text-white/60 leading-relaxed">
                        {message}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-500"
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
