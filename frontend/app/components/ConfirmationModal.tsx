"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDestructive = false,
}: ConfirmationModalProps) {
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
                    <div className="mb-4 rounded-full bg-red-500/10 p-3 ring-1 ring-red-500/20">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>

                    <h3 className="mb-2 text-xl font-semibold text-white">
                        {title}
                    </h3>

                    <p className="mb-6 text-sm text-white/60 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex w-full gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white transition-all shadow-lg ${isDestructive
                                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                                }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
