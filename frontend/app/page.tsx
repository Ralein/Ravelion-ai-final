/**
 * Copyright (c) 2026 Ralein Nova. All rights reserved.
 * Proprietary and confidential. Unauthorized copying is prohibited.
 */
"use client";

import Link from "next/link";
import { Image, Video, Clock, Zap, Music, FileType, Minimize2, ArrowRight, Github, Eraser } from "lucide-react";
import { useState } from "react";
import ConfirmationModal from "./components/ConfirmationModal";
import SuccessModal from "./components/SuccessModal";
import { cleanupSystem } from "./lib/api";

const features = [
  {
    title: "Image BG Removal",
    description: "AI-powered background removal for images",
    icon: Image,
    href: "/image",
  },
  {
    title: "Video BG Removal",
    description: "Professional video segmentation with MobileSAM",
    icon: Video,
    href: "/editor",
  },
  {
    title: "Slow Motion",
    description: "Cinematic slow-motion effects (0.25x - 1x)",
    icon: Clock,
    href: "/tools/slowmo",
  },
  {
    title: "Fast Motion",
    description: "Speed up videos smoothly (1x - 4x)",
    icon: Zap,
    href: "/tools/fastmo",
  },
  {
    title: "Audio Tools",
    description: "Extract or remove audio from videos",
    icon: Music,
    href: "/tools/audio",
  },
  {
    title: "Video Convert",
    description: "MP4, MOV, WebM, AVI conversion",
    icon: FileType,
    href: "/tools/convert",
  },
  {
    title: "Video Compress",
    description: "Reduce video size, keep quality",
    icon: Minimize2,
    href: "/tools/compress",
  },
  {
    title: "Image Compress",
    description: "Shrink images efficiently",
    icon: Minimize2,
    href: "/tools/image-compress",
  },
  {
    title: "Image Convert",
    description: "Convert JPG, PNG, WebP",
    icon: FileType,
    href: "/tools/image-convert",
  },
  {
    title: "Watermark Remover",
    description: "Remove watermarks from images & videos",
    icon: Eraser,
    href: "/tools/watermark",
  },
];

export default function Home() {
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCleanup = () => {
    setShowCleanupModal(true);
  };

  const confirmCleanup = async () => {
    try {
      await cleanupSystem();
      setShowCleanupModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Cleanup failed", err);
      alert("Cleanup failed or backend is offline.");
      setShowCleanupModal(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Gradient orb */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-white/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-white/[0.06] sticky top-0 z-50 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-transparent flex items-center justify-center shadow-lg shadow-white/10 p-1">
              <img src="/logo.png" alt="Ravelion Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Ravelion AI</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCleanup}
              className="hidden md:inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-all border border-red-500/20"
            >
              Clear System
            </button>

            <button
              onClick={() => window.open("https://github.com/Ralein/Ravelion-ai-final", "_blank")}
              className="hidden md:inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all border border-white/10"
            >
              <Github size={14} />
              GitHub
            </button>



          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 pt-24 pb-16 text-center">
        <div className="animate-fade-in">


          <h1 className="mb-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            Media Editing
            <br />
            <span className="text-white/40">Powered by AI</span>
          </h1>

          <p className="mx-auto mb-12 max-w-lg text-lg text-white/40 leading-relaxed">
            Professional video and image tools. Background removal, speed control, audio extraction, and more.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/editor"
              className="btn-primary inline-flex items-center gap-2"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#features"
              className="btn-secondary"
            >
              View All Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative container mx-auto px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-semibold mb-3">All Tools</h2>
          <p className="text-white/40">Select a tool to get started</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((feature, index) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="group card p-6"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06] group-hover:bg-white/10 transition-colors">
                <feature.icon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors" />
              </div>

              <h3 className="mb-1.5 text-[15px] font-medium text-white group-hover:text-white transition-colors">
                {feature.title}
              </h3>

              <p className="text-sm text-white/35 leading-relaxed">
                {feature.description}
              </p>

              <div className="mt-4 flex items-center text-xs text-white/25 group-hover:text-white/50 transition-colors">
                <span>Open</span>
                <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] py-8">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/25">
          <span>Built with MobileSAM & FFmpeg</span>
          <span>© 2026 Ralein Nova. All Rights Reserved.</span>
        </div>
      </footer>

      <ConfirmationModal
        isOpen={showCleanupModal}
        onClose={() => setShowCleanupModal(false)}
        onConfirm={confirmCleanup}
        title="Clear System?"
        message="Are you sure you want to clear all system files? This will delete all uploads and current progress. This action cannot be undone."
        confirmText="Clear System"
        isDestructive={true}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="System Cleared"
        message="All temporary files and uploads have been successfully removed."
        buttonText="Great!"
      />
    </main>
  );
}
