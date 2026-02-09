"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, Moon } from "lucide-react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function WakeUpModal() {
    const [isAsleep, setIsAsleep] = useState(false);
    const [isRetrying, setIsRetrying] = useState(true);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                console.log(`Checking backend health at: ${API_URL}/ping`);
                await axios.get(`${API_URL}/ping`, { timeout: 30000 });
                setIsAsleep(false);
                setIsRetrying(false);
            } catch (error) {
                console.error("Backend health check failed:", error);
                setIsAsleep(true);
                // Retry logic: keep pinging every 5 seconds until awake
                setTimeout(checkHealth, 5000);
            }
        };

        // Initial check
        checkHealth();
    }, []);

    if (!isAsleep) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-md w-full p-8 shadow-2xl relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-neutral-800 flex items-center justify-center">
                            <Moon className="h-8 w-8 text-purple-400" />
                        </div>
                        {isRetrying && (
                            <div className="absolute -bottom-1 -right-1 bg-neutral-900 rounded-full p-1">
                                <Loader2 className="h-4 w-4 text-purple-500 animate-spin" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-white">Upload failed, Cleanup failed or backend is offline.</h3>
                        <p className="text-neutral-400">
                            The backend is currently waking up from inactivity. This may take about 5 minutes.
                            Please wait until it wakes up.
                        </p>
                    </div>

                    <div className="w-full h-px bg-neutral-800" />

                    <div className="space-y-4 w-full">
                        <p className="text-sm text-neutral-500">
                            If it doesn't wake up after a while:
                        </p>
                        <a
                            href="mailto:raleinnova@gmail.com?subject=Ravelion Backend Down&body=The backend seems to be stuck sleeping."
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors group"
                        >
                            <Mail className="h-4 w-4 text-neutral-400 group-hover:text-white transition-colors" />
                            Send mail to raleinnova@gmail.com
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
