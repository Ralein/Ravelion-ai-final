"use client";

import { useEffect } from "react";

export default function CopyProtection() {
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Disable common devtools shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12") {
                e.preventDefault();
            }
            // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
                e.preventDefault();
            }
            // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
                e.preventDefault();
            }
            // Ctrl+U (View Source)
            if ((e.ctrlKey || e.metaKey) && e.key === "u") {
                e.preventDefault();
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return null;
}
