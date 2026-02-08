# Ravelion AI

Ravelion AI is a powerful, local-first media processing suite designed for high-quality video and image editing powered by AI.

## Features

### Video Tools
- **Video Background Removal**: 
  - **Auto Mode**: Automatic background removal using BiRefNet (High Accuracy).
  - **Precision Mode**: Interactive segmentation using MobileSAM + YOLOv7.
  - Supports Apple Silicon (MPS) acceleration and CUDA.
- **Slow Motion**: Cinematic slow-motion effects (0.25x - 0.5x speed) with smooth frame handling.
- **Fast Motion**: Speed up videos smoothly (2x - 4x speed).
- **Audio Tools**: Extract audio from video or remove audio tracks.
- **Video Converter**: Convert between MP4, MOV, WebM, and AVI formats.
- **Video Compressor**: Efficient video compression with adjustable quality (Low/Medium/High).

### Image Tools
- **Image Background Removal**: AI-powered removal with transparent, color, or custom background options.
- **Image Compressor**: Slider-based compression (10-100%) with smart PNG quantization.
- **Image Converter**: Convert between JPG, PNG, and WebP formats.

### System
- **Local Processing**: All data stays on your machine.
- **System Cleanup**: One-click utility to clear temporary files and uploads.
- **Modern UI**: Dark-themed, responsive interface with smooth animations.

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
