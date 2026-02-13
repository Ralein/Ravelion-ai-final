"use client";

import { useState, useEffect, useRef } from "react";
import { Mail, Loader2, Moon, Terminal, ExternalLink, Clock, Copy, Check } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";
const AI_IMAGE_API_URL = process.env.NEXT_PUBLIC_AI_IMAGE_API_URL || "http://127.0.0.1:8002";

const REPO_URL = "https://github.com/Ralein/Ravelion-ai-final";
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function WakeUpModal() {
    const [isAsleep, setIsAsleep] = useState(false);
    const [isRetrying, setIsRetrying] = useState(true);
    const [showLocalInstructions, setShowLocalInstructions] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [copiedStep, setCopiedStep] = useState<number | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        // Skip health checks on localhost — wake-up modal is only for Render cold starts
        const isLocal = typeof window !== "undefined" &&
            (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
        if (isLocal) {
            setIsRetrying(false);
            return;
        }

        startTimeRef.current = Date.now();

        const timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsedSeconds(elapsed);

            if (elapsed >= TIMEOUT_MS / 1000) {
                setShowLocalInstructions(true);
                setIsRetrying(false);
                clearInterval(timerInterval);
            }
        }, 1000);

        const checkHealth = async () => {
            try {
                console.log(`Checking backend health...`);
                await Promise.all([
                    axios.get(`${API_URL}/ping`, { timeout: 30000 }),
                    axios.get(`${AI_API_URL}/ping`, { timeout: 30000 }),
                    axios.get(`${AI_IMAGE_API_URL}/ping`, { timeout: 30000 }),
                ]);
                setIsAsleep(false);
                setIsRetrying(false);
                clearInterval(timerInterval);
            } catch (error) {
                console.error("Backend health check failed:", error);
                setIsAsleep(true);

                if (Date.now() - startTimeRef.current < TIMEOUT_MS) {
                    setTimeout(checkHealth, 5000);
                }
            }
        };

        checkHealth();

        return () => clearInterval(timerInterval);
    }, []);

    const copyToClipboard = (text: string, step: number) => {
        navigator.clipboard.writeText(text);
        setCopiedStep(step);
        setTimeout(() => setCopiedStep(null), 2000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (!isAsleep) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 overflow-y-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden my-8">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center">
                            {showLocalInstructions ? (
                                <Terminal className="h-8 w-8 text-orange-400" />
                            ) : (
                                <Moon className="h-8 w-8 text-purple-400" />
                            )}
                        </div>
                        {isRetrying && (
                            <div className="absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-1">
                                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                            </div>
                        )}
                    </div>

                    {!showLocalInstructions ? (
                        /* ──── Waiting State ──── */
                        <>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white">Backend is waking up...</h3>
                                <p className="text-neutral-400">
                                    The backend servers are currently starting up from inactivity.
                                    This usually takes 2–5 minutes on the free tier.
                                </p>
                            </div>

                            {/* Timer */}
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <Clock className="h-4 w-4" />
                                <span>Waiting: {formatTime(elapsedSeconds)}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-neutral-800 rounded-full h-1.5">
                                <div
                                    className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
                                    style={{ width: `${Math.min((elapsedSeconds / 300) * 100, 100)}%` }}
                                />
                            </div>

                            <div className="w-full h-px bg-neutral-800" />

                            <div className="space-y-4 w-full">
                                <p className="text-sm text-neutral-500">
                                    If it doesn&apos;t wake up after 5 minutes, you&apos;ll get instructions to run locally.
                                </p>
                                <a
                                    href="mailto:raleinnova@gmail.com?subject=Ravelion Backend Down&body=The backend seems to be stuck sleeping."
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors group"
                                >
                                    <Mail className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors" />
                                    Send mail to raleinnova@gmail.com
                                </a>
                            </div>
                        </>
                    ) : (
                        /* ──── Local Setup Instructions ──── */
                        <>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-white">Backend didn&apos;t start in time</h3>
                                <p className="text-neutral-400">
                                    No worries! You can run Ravelion AI locally on your machine.
                                    Follow these steps:
                                </p>
                            </div>

                            <div className="w-full h-px bg-neutral-800" />

                            {/* Step-by-step instructions */}
                            <div className="w-full space-y-3 text-left">
                                {[
                                    { label: "Clone the repository", cmd: `git clone ${REPO_URL}.git && cd Ravelion-ai-final` },
                                    { label: "Install backend dependencies", cmd: "pip install -r backend-tools/requirements.txt -r backend-ai-image/requirements.txt" },
                                    { label: "Start the backends", cmd: "bash start_backends.sh" },
                                    { label: "Install & start frontend", cmd: "cd frontend && npm install && npm run dev" },
                                ].map((step, i) => (
                                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                                        <p className="text-sm text-neutral-400 mb-2">
                                            <span className="text-purple-400 font-semibold">Step {i + 1}.</span>{" "}
                                            {step.label}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-xs text-green-400 bg-black/40 rounded-lg px-3 py-2 overflow-x-auto font-mono">
                                                {step.cmd}
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(step.cmd, i)}
                                                className="shrink-0 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                                title="Copy command"
                                            >
                                                {copiedStep === i ? (
                                                    <Check className="h-3.5 w-3.5 text-green-400" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5 text-neutral-500" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-neutral-600">
                                Requires Python 3.10+, Node.js 18+, and FFmpeg installed.
                            </p>

                            <div className="flex gap-3 w-full">
                                <a
                                    href={REPO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Open GitHub Repo
                                </a>
                                <a
                                    href="mailto:raleinnova@gmail.com?subject=Ravelion Backend Down&body=The backend seems to be stuck sleeping."
                                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Mail className="h-4 w-4" />
                                    Contact
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
