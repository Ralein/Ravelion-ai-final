# Ravelion AI

Ravelion AI is a free, local/cloud hybrid video background removal tool.

## Features
- **Auto Mode**: (Planned) Use free APIs to remove background.
- **Precision Mode**: Interactive segmentation using MobileSAM + YOLOv7 on CPU.
- **Video Editing**: (Planned) Trim, crop, speed control.

## Prerequisites
- Python 3.10+
- Node.js 18+
- FFmpeg (installed and in system PATH)

## Installation

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Note on YOLOv7**:
This project uses `yolov7detect`. If you encounter issues, please install from source:
```bash
pip install git+https://github.com/WongKinYiu/yolov7.git
```

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

## Usage
1. Open `http://localhost:3000`.
2. Click "Start Creating".
3. Upload a video.
4. Draw a box around the subject.
5. Click "Run Segmentation".
6. Wait for processing (check backend console for progress).
7. Download result.
