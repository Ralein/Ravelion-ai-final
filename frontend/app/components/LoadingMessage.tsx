"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const MESSAGES = [
    "Processing your file...",
    "Larger files might take a while, please wait...",
    "Ravelion is working on it...",
    "Oof, too many pixels boss...",
    "Nah, I'd win...",
    "Still crunching the numbers...",
    "Almost there...",
];

export default function LoadingMessage({ status }: { status: string }) {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 3000); // Change message every 3 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center animate-fade-in">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-white/50" />
            <h3 className="text-lg font-medium mb-2">{status}</h3>
            <p className="text-white/40 text-sm h-5 transition-all duration-300">
                {MESSAGES[messageIndex]}
            </p>
        </div>
    );
}
