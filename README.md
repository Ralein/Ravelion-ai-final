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

## 📁 Project Structure

```
Ravelion-ai-final/
├── frontend/                        # Next.js 16 Web UI
│   ├── app/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── WakeUpModal.tsx      # Backend health check + local fallback modal
│   │   │   ├── LoadingMessage.tsx   # Dynamic loading messages
│   │   │   ├── Navbar.tsx           # Navigation bar
│   │   │   └── DragDropUpload.tsx   # Shared upload component
│   │   ├── image/page.tsx           # Image background removal tool
│   │   ├── editor/page.tsx          # Video editor (segmentation)
│   │   ├── compress/page.tsx        # Video compression tool
│   │   ├── convert/page.tsx         # Video format converter
│   │   ├── slowmo/page.tsx          # Slow motion tool
│   │   ├── fastmo/page.tsx          # Fast motion tool
│   │   ├── audio/page.tsx           # Audio extraction tool
│   │   ├── watermark/page.tsx       # Watermark tool
│   │   ├── image-compress/page.tsx  # Image compression tool
│   │   ├── admin/page.tsx           # Admin dashboard
│   │   ├── login/page.tsx           # Admin login
│   │   ├── layout.tsx               # Root layout
│   │   ├── page.tsx                 # Landing page
│   │   └── globals.css              # Global styles
│   ├── public/                      # Static assets
│   ├── .env.local                   # Environment variables (API URLs)
│   ├── package.json
│   ├── Dockerfile
│   ├── next.config.ts
│   └── tsconfig.json
│
├── backend-ai-video/                # AI Video Service (Port 8000)
│   │                                # MobileSAM video segmentation
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Service configuration
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile
│   ├── routers/
│   │   ├── system.py                # Health check & cleanup endpoints
│   │   └── video_ai.py              # /upload-video, /segment-video, /auto-remove
│   └── core/
│       ├── engine.py                # MobileSAM + YOLOv7 segmentation engine
│       ├── utils.py                 # Video frame extraction utilities
│       └── cleanup.py               # File cleanup logic
│
├── backend-ai-image/                # AI Image Service (Port 8002)
│   │                                # rembg background removal
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Service configuration
│   ├── requirements.txt             # Python dependencies
│   ├── download_models.py           # Pre-download rembg AI models
│   ├── Dockerfile
│   ├── routers/
│   │   ├── system.py                # Health check & cleanup endpoints
│   │   └── image_ai.py              # /remove-bg-pro
│   ├── services/
│   │   └── image_service.py         # rembg processing logic
│   └── core/
│       └── cleanup.py               # File cleanup logic
│
├── backend-tools/                   # Lightweight Tools Service (Port 8001)
│   │                                # FFmpeg-based video/image/audio tools
│   ├── main.py                      # FastAPI app entry point
│   ├── config.py                    # Service configuration
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile
│   ├── routers/
│   │   ├── system.py                # Health check & cleanup endpoints
│   │   ├── video_tools.py           # /compress, /convert, /slowmo, /fastmo
│   │   ├── image_tools.py           # /image-compress, /image-convert
│   │   └── audio.py                 # /extract-audio
│   ├── services/
│   │   ├── video_service.py         # FFmpeg video processing
│   │   └── image_service.py         # Image compress/convert logic
│   └── core/
│       └── cleanup.py               # File cleanup logic
│
├── docker-compose.yml               # Run all services with Docker
├── start_backends.sh                # Quick-start script for local backends
├── LICENSE
└── README.md
```

---

## 🛠️ Technology Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://reactjs.org/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+), [Uvicorn](https://www.uvicorn.org/)
- **AI/ML**: [PyTorch](https://pytorch.org/), [MobileSAM](https://github.com/ChaoningZhang/MobileSAM), [YOLOv7](https://github.com/WongKinYiu/yolov7), [rembg](https://github.com/danielgatis/rembg)
- **Media Engine**: [FFmpeg](https://ffmpeg.org/) (The industry standard for video/audio processing)
- **Deployment**: [Vercel](https://vercel.com/) (Frontend), [Render](https://render.com/) (Dockerized Backends)

---

## 📋 Prerequisites

Before getting started, ensure you have the following installed:

| Requirement     | Version  | Check Command       |
| --------------- | -------- | ------------------- |
| **Python**      | 3.10+    | `python3 --version` |
| **Node.js**     | 18+      | `node --version`    |
| **npm**         | 9+       | `npm --version`     |
| **FFmpeg**      | Latest   | `ffmpeg -version`   |
| **Git**         | Latest   | `git --version`     |

### Installing FFmpeg

```bash
# macOS (Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# Windows (Chocolatey)
choco install ffmpeg
```

---

## 🚀 Quick Start (Local Development)

### Option 1: One-Command Setup (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/Ralein/Ravelion-ai-final.git
cd Ravelion-ai-final

# 2. Start all backend services (installs deps automatically)
bash start_backends.sh

# 3. Setup and start the frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** — you're all set! 🎉

### Option 2: Manual Setup (Step-by-Step)

#### 1. Clone the Repository

```bash
git clone https://github.com/Ralein/Ravelion-ai-final.git
cd Ravelion-ai-final
```

#### 2. Backend Setup

Each backend is an independent microservice. You can start only the ones you need:

**Tools Service** (Video compress/convert, image tools, audio — lightweight):
```bash
cd backend-tools
pip install -r requirements.txt
python3 main.py
# Runs on http://localhost:8001
```

**Image AI Service** (AI background removal):
```bash
cd backend-ai-image
pip install -r requirements.txt
python3 main.py
# Runs on http://localhost:8002
# Note: First request may take ~30s to download the AI model (~170MB)
```

**Video AI Service** (Video segmentation — heavy, requires PyTorch):
```bash
cd backend-ai-video
pip install -r requirements.txt
python3 main.py
# Runs on http://localhost:8000
# Note: Requires ~1GB+ RAM for MobileSAM model
```

> **💡 Tip**: If you only need basic tools (compress, convert, slow-mo), you can skip the AI services entirely. The Tools Service is lightweight and runs independently.

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create or update `frontend/.env.local` with local backend URLs:

```env
NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001
NEXT_PUBLIC_AI_IMAGE_API_URL=http://127.0.0.1:8002
```

Start the dev server:

```bash
npm run dev
```

Frontend runs on **http://localhost:3000**.

### Option 3: Docker Compose (All-in-One)

```bash
git clone https://github.com/Ralein/Ravelion-ai-final.git
cd Ravelion-ai-final
docker-compose up --build
```

This starts all services:
| Service          | Container Port | Host Port | URL                        |
| ---------------- | -------------- | --------- | -------------------------- |
| Video AI Backend | 8000           | 8000      | http://localhost:8000       |
| Tools Backend    | 8000           | 8001      | http://localhost:8001       |
| Image AI Backend | 8000           | 8002      | http://localhost:8002       |
| Frontend         | 3000           | 3000      | http://localhost:3000       |

---

## 🌐 Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                     │
│                    http://localhost:3000                       │
└──────────┬──────────────────┬──────────────────┬─────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌──────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ backend-ai-video │ │  backend-tools    │ │ backend-ai-image  │
│   Port 8000      │ │   Port 8001       │ │   Port 8002       │
│                  │ │                   │ │                   │
│ • Video segment  │ │ • Compress video  │ │ • Remove BG (AI)  │
│ • Auto-remove BG │ │ • Convert format  │ │                   │
│ • MobileSAM      │ │ • Slow/Fast mo    │ │ • rembg + u2net   │
│ • YOLOv7         │ │ • Image compress  │ │ • onnxruntime     │
│                  │ │ • Extract audio   │ │                   │
│ ~300-400MB RAM   │ │ ~30-50MB RAM      │ │ ~150-200MB RAM    │
└──────────────────┘ └───────────────────┘ └───────────────────┘
```

### Environment Variables

| Variable                       | Points To         | Default (Local)            |
| ------------------------------ | ----------------- | -------------------------- |
| `NEXT_PUBLIC_AI_API_URL`       | Video AI Service  | `http://127.0.0.1:8000`   |
| `NEXT_PUBLIC_API_URL`          | Tools Service     | `http://127.0.0.1:8001`   |
| `NEXT_PUBLIC_AI_IMAGE_API_URL` | Image AI Service  | `http://127.0.0.1:8002`   |

---

## 🔧 Troubleshooting

### Backend won't start

```bash
# Check if ports are in use
lsof -i :8000
lsof -i :8001
lsof -i :8002

# Kill processes on those ports
lsof -ti:8000 | xargs kill -9
lsof -ti:8001 | xargs kill -9
lsof -ti:8002 | xargs kill -9
```

### Frontend shows "Backend is waking up" modal

This only appears in production (Render free tier). The backends go to sleep after 15 minutes of inactivity and take 2–5 minutes to wake up. If they don't start within 5 minutes, the modal will show local setup instructions.

**To avoid this entirely**, run locally using the instructions above.

### FFmpeg not found

Make sure FFmpeg is installed and in your system PATH:
```bash
ffmpeg -version
# If not found, install it (see Prerequisites section)
```

### Apple Silicon (M1/M2/M3/M4)

The system automatically detects MPS (Metal Performance Shaders) for accelerated AI inference. No extra configuration needed.

### Checking backend logs

```bash
# If started with start_backends.sh
tail -f Video-AI.log Tools-Service.log Image-AI.log

# Stop all backends
pkill -f "python3 main.py"
```

---

## ☁️ Cloud Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub.
2. Import the repo on [Vercel](https://vercel.com).
3. Set the **Root Directory** to `frontend`.
4. Add environment variables pointing to your Render backend URLs:
   ```
   NEXT_PUBLIC_AI_API_URL=https://your-video-ai.onrender.com
   NEXT_PUBLIC_API_URL=https://your-tools.onrender.com
   NEXT_PUBLIC_AI_IMAGE_API_URL=https://your-image-ai.onrender.com
   ```

### Backends → Render

Each backend is deployed as a separate **Web Service** on Render:

1. Create 3 Web Services on [Render](https://render.com), each pointing to the same repo.
2. For each service, set the **Root Directory** to the respective backend folder (`backend-ai-video`, `backend-tools`, `backend-ai-image`).
3. Select **Docker** as the environment.
4. Render will use the `Dockerfile` in each folder automatically.

> ⚠️ **Free Tier Note**: Render's free tier has 512MB RAM. The `backend-ai-video` service may run out of memory. Consider upgrading to a paid plan for the video AI service, or use it locally only.

---

## 📖 Usage

1. Open **http://localhost:3000**.
2. Select a tool from the dashboard (e.g., Video BG Removal, Image Compress).
3. Upload your file.
4. Adjust settings (Speed, Quality, Format, etc.).
5. Process the file.
6. Preview and download the result directly.

---

© 2026 **Ralein Nova**. All Rights Reserved. This software is proprietary and confidential. Unauthorized copying is prohibited. See [LICENSE](LICENSE) for details.
