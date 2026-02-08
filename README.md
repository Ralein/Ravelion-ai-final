# Ravelion AI

Ravelion AI is a powerful, local-first media processing suite designed for high-quality video and image editing powered by state-of-the-art AI. Built for creators, developers, and power users, Ravelion offers professional-grade tools like background removal, cinematic slow-motion, and smart compression—all within a sleek, modern, and privacy-focused interface.

## Why Ravelion AI?

Most media tools are either too complex (command-line FFmpeg) or too expensive (subscription-based cloud tools). Ravelion AI bridges this gap by providing a **Hybrid Architecture**: the speed of a local Python backend paired with the accessibility of a modern Next.js web interface.

---

## 🚀 Core Features

### 🎥 Professional Video Suite
- **Advanced Background Removal**:
    - **Auto Mode**: Uses **BiRefNet** for lightning-fast, high-accuracy background extraction.
    - **Precision Mode**: Leverages **MobileSAM + YOLOv7** for interactive segmentation. Simply draw a box around your subject and let the AI do the heavy lifting.
    - **Optimized for Hardware**: Supports Apple Silicon (MPS) and NVIDIA (CUDA) for blazing-fast inference.
- **Cinematic Time Control**:
    - **Slow Motion**: Create smooth, professional slow-motion effects (ranging from 0.25x to 1x).
    - **Fast Motion**: Speed up long clips smoothly (up to 4x).
- **Universal Converter**: Convert between all major formats (**MP4, MOV, WebM, AVI**) with high-fidelity output.
- **Smart Compressor**: Reduce file sizes by up to 80% while preserving visual clarity. Select from Low, Medium, or High quality presets.

### 🖼️ Intelligent Image Suite
- **AI Background Removal**: Instantly remove backgrounds with high precision. Choose between transparent, solid colors, or custom backgrounds.
- **Slider-Based Compression**: Gain granular control over image size vs. quality with a visual slider (10-100%). Includes smart **PNG quantization** for massive size reductions.
- **Format Conversion**: Effortlessly switch between **JPG, PNG, and WebP** formats.

### 🛠️ System & UX
- **Privacy First**: All data is processed locally (or on your private cloud instance). No data mining, no tracking.
- **Dynamic Loading**: Features a fun, rotating loading message system ("Oof, too many pixels boss...") to keep you engaged while the AI works.
- **System Cleanup**: A dedicated utility to clear temporary files and uploads with one click, keeping your storage lean.
- **Modern Aesthetics**: A premium, dark-mode focused UI with smooth transitions, responsive layouts, and intuitive controls.
- **Direct Downloads**: No external redirects. Processed files are served directly as browser downloads.

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React](https://reactjs.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+), [Uvicorn](https://www.uvicorn.org/)
- **AI/ML**: [PyTorch](https://pytorch.org/), [MobileSAM](https://github.com/ChaoningZhang/MobileSAM), [YOLOv7](https://github.com/WongKinYiu/yolov7), [BiRefNet](https://github.com/ZhengPeng7/BiRefNet)
- **Media Engine**: [FFmpeg](https://ffmpeg.org/) (The industry standard for video/audio processing)
- **Deployment**: [Vercel](https://vercel.com/) (Frontend), [Render](https://render.com/) (Dockerized Backend)

## Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (Must be installed and in system PATH)

## Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Note for Apple Silicon (M1/M2/M3)**:  
The system automatically detects MPS (Metal Performance Shaders) for accelerated inference.

### 2. Frontend Setup
```bash
cd frontend
npm install
```

## Running the App

1. **Start Backend**:
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --reload
   ```
   Backend runs on `http://localhost:8000`.

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`.

## Deployment Architecture

Ravelion AI is designed with a modern hybrid architecture:

**User → Vercel (Next.js UI)**
             ↓ API calls
**Render (Docker + Python + AI Models)**

### 1. Cloud Deployment
- **Frontend**: Deploy the `frontend` folder to [Vercel](https://vercel.com).  
  (Set `NEXT_PUBLIC_API_URL` environment variable to your Render backend URL).
- **Backend**: Deploy the `backend` folder to [Render](https://render.com) using the included `Dockerfile`.  
  (Select "Web Service" > "Docker" on Render).

### 2. Local Usage
Simply follow the "Running the App" instructions above to run everything on your own machine.

## Usage
1. Open `http://localhost:3000`.
2. Select a tool from the dashboard (e.g., Video BG Removal, Image Compress).
3. Upload your file.
4. Adjust settings (Speed, Quality, Format, etc.).
5. Process the file (Updates with "Ravelion is working on it...").
6. Preview and Download the result directly.

---
© 2026 **Ralein Nova**. All Rights Reserved. This software is proprietary and confidential. Unauthorized copying is prohibited. See [LICENSE](LICENSE) for details.
