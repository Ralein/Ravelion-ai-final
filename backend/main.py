# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import os
import shutil
import uuid
import json
from typing import Optional
from fastapi import Request
import warnings

# Suppress warnings from timm/mobile_sam
warnings.filterwarnings("ignore", category=FutureWarning, module="timm")
warnings.filterwarnings("ignore", category=UserWarning, module="mobile_sam")

# Import core logic
# Ensure core is a package 
# In backend directory, core/ is a package.
from core.engine import segment_video_logic
from core.engine import segment_video_logic
from core.utils import extract_first_frame
from core.cleanup import cleanup_old_files, cleanup_all_contents
import asyncio

app = FastAPI(title="Ravelion AI Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
FRAMES_DIR = "frames" # For storing first frames
TEMP_DIR = "temp_work"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(FRAMES_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs("models", exist_ok=True)

# Background Task for Cleanup
async def run_periodic_cleanup():
    while True:
        try:
            # Check every 30 minutes
            await asyncio.sleep(1800) 
            print("Running periodic cleanup...")
            cleanup_old_files([UPLOAD_DIR, FRAMES_DIR, TEMP_DIR, OUTPUT_DIR], max_age_seconds=3600)
        except Exception as e:
            print(f"Cleanup task error: {e}")
            await asyncio.sleep(60) # Retry after 1 min on error

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(run_periodic_cleanup())

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        import traceback
        print(f"ERROR: Unhandled exception during {request.url.path}")
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal Server Error: {str(e)}", "traceback": traceback.format_exc()}
        )

# Mount static for serving results
app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")

@app.get("/")
def read_root():
    return {"message": "Ravelion AI Backend is running"}

@app.get("/ping")
async def ping():
    return {"status": "ok"}

@app.post("/cleanup")
async def cleanup_system():
    """
    Clear all temporary directories and reset system state.
    """
    try:
        # Directories to clear
        dirs_to_clear = [UPLOAD_DIR, FRAMES_DIR, TEMP_DIR, OUTPUT_DIR]
        
        count = cleanup_all_contents(dirs_to_clear)
                
        return {"status": "success", "message": f"System cleanup complete. Removed {count} items."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@app.post("/upload-video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    video_id = str(uuid.uuid4())
    video_ext = file.filename.split(".")[-1]
    video_filename = f"{video_id}.{video_ext}"
    video_path = os.path.join(UPLOAD_DIR, video_filename)
    
    base_url = str(request.base_url).rstrip("/")
    
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Extract first frame
    frame_filename = f"{video_id}.jpg"
    frame_path = os.path.join(FRAMES_DIR, frame_filename)
    try:
        extract_first_frame(video_path, frame_path)
    except Exception as e:
        # If extraction fails, maybe video is invalid
        os.remove(video_path)
        raise HTTPException(status_code=400, detail=f"Failed to process video: {str(e)}")
        
    return {
        "video_id": video_id,
        "video_url": f"/uploads/{video_filename}", 
        "frame_url": f"{base_url}/frames/{frame_filename}",
        "raw_video_path": video_path
    }

# Also need to serve uploads if we want to play original video
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.post("/segment-video")
def segment_video(
    request: Request,
    video_id: str = Form(...),
    bbox: str = Form(...), # JSON string "[xmin, ymin, xmax, ymax]"
    frame_start: int = Form(0),
    frame_end: int = Form(0),
    background_color: str = Form("#00FF00")
):
    base_url = str(request.base_url).rstrip("/")
    # Find video
    # We need extraction of path logic. 
    # Simply looking for file in uploads.
    video_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(video_id)]
    if not video_files:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = os.path.join(UPLOAD_DIR, video_files[0])
    
    try:
        bbox_list = json.loads(bbox)
    except:
        raise HTTPException(status_code=400, detail="Invalid bbox format")
    
    # Determine output extension based on background
    is_transparent = background_color.lower() == "transparent"
    output_ext = "webm" if is_transparent else "mp4"
    output_filename = f"{video_id}_segmented.{output_ext}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # We should run this in background or separate thread, but for simplicity of this demo, we run blocking.
    # For production, use Celery or BackgroundTasks.
    # FastAPI BackgroundTasks runs after response, so we can't return URL immediately if we wait.
    # But user wants a result. 
    # We can make it blocking for now (simplest for "mini tool").
    
    try:
        # Create unique temp dir for this process
        task_temp_dir = os.path.join(TEMP_DIR, video_id)
        
        result_path = segment_video_logic(
            video_path=video_path,
            bbox_list=bbox_list,
            frame_start=frame_start,
            frame_end=frame_end,
            mobile_sam_weights="models/mobile_sam.pt",
            output_video_path=output_path,
            tracker_name="yolov7",
            background_color=background_color,
            work_dir=task_temp_dir
        )
        
        # Get actual filename from result path (may have changed extension)
        actual_filename = os.path.basename(result_path)
        
        if os.path.exists(task_temp_dir):
            shutil.rmtree(task_temp_dir)
            
        # Cleanup uploaded video and frames if needed
        # Since the user requested "no need to save temp or upload", we delete them now.
        if os.path.exists(video_path):
            os.remove(video_path)
            
        # Also clean up the first frame image if it exists
        frame_path = os.path.join(FRAMES_DIR, f"{video_id}.jpg")
        if os.path.exists(frame_path):
            os.remove(frame_path)
            
        return {
            "status": "success",
            "video_url": f"{base_url}/outputs/{actual_filename}"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")

@app.post("/auto-remove")
def auto_remove(
    request: Request,
    video_id: str = Form(...),
    background_color: str = Form("#00FF00")
):
    base_url = str(request.base_url).rstrip("/")
    # Find video
    video_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(video_id)]
    if not video_files:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_path = os.path.join(UPLOAD_DIR, video_files[0])
    
    # Get video dimensions for full-frame bbox
    import cv2
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video")
    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    # Create a center-focused bbox covering ~70% of frame
    margin_x = int(width * 0.15)
    margin_y = int(height * 0.1)
    bbox_list = [margin_x, margin_y, width - margin_x, height - margin_y]
    
    # Determine output extension based on background
    is_transparent = background_color.lower() == "transparent"
    output_ext = "webm" if is_transparent else "mp4"
    output_filename = f"{video_id}_auto.{output_ext}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        task_temp_dir = os.path.join(TEMP_DIR, f"{video_id}_auto")
        
        result_path = segment_video_logic(
            video_path=video_path,
            bbox_list=bbox_list,
            frame_start=0,
            frame_end=0,
            mobile_sam_weights="models/mobile_sam.pt",
            output_video_path=output_path,
            tracker_name="yolov7",
            background_color=background_color,
            work_dir=task_temp_dir
        )
        
        actual_filename = os.path.basename(result_path)
        
        if os.path.exists(task_temp_dir):
            shutil.rmtree(task_temp_dir)
            
        # Cleanup uploaded video and frames if needed
        if os.path.exists(video_path):
            os.remove(video_path)

        frame_path = os.path.join(FRAMES_DIR, f"{video_id}.jpg")
        if os.path.exists(frame_path):
            os.remove(frame_path)
            
        return {
            "status": "success",
            "video_url": f"{base_url}/outputs/{actual_filename}"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Auto removal failed: {str(e)}")


# ================== IMAGE BACKGROUND REMOVAL ==================

@app.post("/remove-bg-pro")
async def remove_bg_pro(
    request: Request,
    file: UploadFile = File(...),
    background_color: str = Form("transparent")
):
    base_url = str(request.base_url).rstrip("/")
    # ... (rembg logic stays same)
    # Skip unchanged code for brevity in tool call if possible? No, need full block for replace.
    import cv2
    import numpy as np
    from PIL import Image
    import io
    
    # Read uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")
    
    # Try to use rembg if available, otherwise fallback to simple threshold
    try:
        from rembg import remove
        from PIL import Image
        
        pil_img = Image.open(io.BytesIO(contents))
        
        # Optimize: Resize if too large to speed up inference
        max_dim = 1500
        original_size = pil_img.size
        if max(pil_img.size) > max_dim:
            pil_img.thumbnail((max_dim, max_dim), Image.LANCZOS)
        
        result = remove(pil_img)
        
        # Determine output format and background
        is_transparent = background_color.lower() == "transparent"
        
        if not is_transparent:
            bg_hex = background_color.lstrip("#")
            bg_rgb = tuple(int(bg_hex[i:i+2], 16) for i in (0, 2, 4))
            
            # Create background
            bg = Image.new("RGBA", result.size, (*bg_rgb, 255))
            bg.paste(result, mask=result.split()[3])
            result = bg.convert("RGB")
            ext = "jpg"
        else:
            # Enforce PNG for transparency
            ext = "png"
        
    except ImportError:
        # Fallback: simple GrabCut-like approach
        mask = np.zeros(img.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)
        h, w = img.shape[:2]
        rect = (int(w*0.05), int(h*0.05), int(w*0.9), int(h*0.9))
        cv2.grabCut(img, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)
        mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype("uint8")
        
        if background_color.lower() == "transparent":
            result_img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
            result_img[:, :, 3] = mask2 * 255
            result = Image.fromarray(cv2.cvtColor(result_img, cv2.COLOR_BGRA2RGBA))
            ext = "png"
        else:
            bg_hex = background_color.lstrip("#")
            bg_rgb = tuple(int(bg_hex[i:i+2], 16) for i in (0, 2, 4))
            bg = np.ones_like(img) * np.array(bg_rgb[::-1], dtype=np.uint8)
            fg = img * mask2[:, :, np.newaxis]
            bg_masked = bg * (1 - mask2[:, :, np.newaxis])
            combined = (fg + bg_masked).astype(np.uint8)
            result = Image.fromarray(cv2.cvtColor(combined, cv2.COLOR_BGR2RGB))
            ext = "jpg"
    
    # Save result
    output_id = str(uuid.uuid4())
    output_filename = f"{output_id}_nobg.{ext}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    result.save(output_path)
    
    return {
        "status": "success",
        "image_url": f"{base_url}/outputs/{output_filename}"
    }


# ================== VIDEO SPEED CONTROL ==================

def find_video_path(video_id: str):
    """Helper to find video by ID"""
    video_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(video_id)]
    if not video_files:
        return None
    return os.path.join(UPLOAD_DIR, video_files[0])


@app.post("/slowmo")
async def slowmo(
    request: Request,
    video_id: str = Form(...),
    speed: float = Form(0.5)
):
    base_url = str(request.base_url).rstrip("/")
    """Apply slow motion effect using FFmpeg."""
    import subprocess
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Clamp speed
    speed = max(0.25, min(1.0, speed))
    
    output_filename = f"{video_id}_slowmo.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # FFmpeg setpts filter for slowmo
    pts_multiplier = 1.0 / speed
    
    try:
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-filter_complex', f'[0:v]setpts={pts_multiplier}*PTS[v];[0:a]atempo={speed}[a]',
            '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'fast',
            '-c:a', 'aac',
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError:
        # Try without audio
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-filter:v', f'setpts={pts_multiplier}*PTS',
            '-c:v', 'libx264', '-preset', 'fast',
            '-an',
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    
    return {
        "status": "success",
        "video_url": f"http://localhost:8000/outputs/{output_filename}"
    }


@app.post("/fastmo")
async def fastmo(
    request: Request,
    video_id: str = Form(...),
    speed: float = Form(2.0)
):
    base_url = str(request.base_url).rstrip("/")
    """Apply fast motion effect using FFmpeg."""
    import subprocess
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Clamp speed
    speed = max(1.0, min(4.0, speed))
    
    output_filename = f"{video_id}_fastmo.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    pts_multiplier = 1.0 / speed
    
    try:
        # atempo only works between 0.5 and 2.0, so chain if needed
        if speed <= 2.0:
            atempo = f'atempo={speed}'
        else:
            atempo = f'atempo=2.0,atempo={speed/2.0}'
        
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-filter_complex', f'[0:v]setpts={pts_multiplier}*PTS[v];[0:a]{atempo}[a]',
            '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'fast',
            '-c:a', 'aac',
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError:
        # Try without audio
        cmd = [
            'ffmpeg', '-y',
            '-i', video_path,
            '-filter:v', f'setpts={pts_multiplier}*PTS',
            '-c:v', 'libx264', '-preset', 'fast',
            '-an',
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
    
    return {
        "status": "success",
        "video_url": f"http://localhost:8000/outputs/{output_filename}"
    }


# ================== AUDIO TOOLS ==================

@app.post("/extract-audio")
async def extract_audio(request: Request, video_id: str = Form(...)):
    base_url = str(request.base_url).rstrip("/")
    """Extract audio from video as MP3."""
    import subprocess
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    output_filename = f"{video_id}_audio.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-vn',
        '-acodec', 'libmp3lame',
        '-q:a', '2',
        output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail="Audio extraction failed")
    
    return {
        "status": "success",
        "audio_url": f"{base_url}/outputs/{output_filename}"
    }


@app.post("/remove-audio")
async def remove_audio(request: Request, video_id: str = Form(...)):
    base_url = str(request.base_url).rstrip("/")
    """Remove audio from video, output silent video."""
    import subprocess
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    output_filename = f"{video_id}_silent.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-an',
        '-c:v', 'copy',
        output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail="Audio removal failed")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


# ================== FORMAT CONVERSION ==================

@app.post("/convert")
async def convert_video(
    request: Request,
    video_id: str = Form(...),
    format: str = Form("mp4")
):
    base_url = str(request.base_url).rstrip("/")
    """Convert video to different format."""
    import subprocess
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Validate format
    allowed_formats = ["mp4", "mov", "webm", "avi"]
    if format.lower() not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"Format must be one of: {allowed_formats}")
    
    output_filename = f"{video_id}_converted.{format}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    # Different codecs for different formats
    if format == "webm":
        codec_args = ['-c:v', 'libvpx-vp9', '-c:a', 'libopus']
    elif format == "avi":
        codec_args = ['-c:v', 'mpeg4', '-c:a', 'mp3']
    else:
        codec_args = ['-c:v', 'libx264', '-c:a', 'aac']
    
    cmd = ['ffmpeg', '-y', '-i', video_path] + codec_args + [output_path]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail="Conversion failed")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


# ================== VIDEO COMPRESSION ==================

@app.post("/compress")
async def compress_video(
    request: Request,
    video_id: str = Form(...),
    quality: str = Form("medium")
):
    base_url = str(request.base_url).rstrip("/")
    """Compress video with different quality levels."""
    import subprocess
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # CRF values: lower = better quality, larger file
    crf_map = {
        "low": 35,      # Maximum compression
        "medium": 28,   # Balanced
        "high": 23      # Best quality
    }
    
    crf = crf_map.get(quality.lower(), 28)
    
    output_filename = f"{video_id}_compressed.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-c:v', 'libx264',
        '-crf', str(crf),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail="Compression failed")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


# ================== IMAGE TOOLS ==================

@app.post("/compress-image")
async def compress_image(
    request: Request,
    file: UploadFile = File(...),
    quality: int = Form(50)  # 1-100
):
    base_url = str(request.base_url).rstrip("/")
    """Compress image with specified quality."""
    import io
    from PIL import Image
    import uuid
    
    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        
        # Determine format
        if file.filename:
            file_ext = file.filename.split('.')[-1].lower()
        else:
            file_ext = "jpg"
            
        output_format = 'JPEG'
        if file_ext == 'png':
            output_format = 'PNG'
        elif file_ext == 'webp':
            output_format = 'WEBP'
            
        # Convert to RGB if saving as JPEG (handling RGBA)
        if output_format == 'JPEG' and img.mode in ('RGBA', 'LA'):
            background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
            background.paste(img, img.split()[-1])
            img = background
            
        # Output buffer
        output_io = io.BytesIO()
        
        # Save compressed
        # For PNG, quality is ignored by save(), uses compress_level/optimize
        if output_format == 'PNG':
             # If quality is low (< 80), try to quantize to reduce colors for file size
             if quality < 80:
                 img = img.quantize(colors=256, method=2)
             img.save(output_io, format=output_format, optimize=True)
        else:
             img.save(output_io, format=output_format, quality=quality, optimize=True)
        
        output_filename = f"compressed_{uuid.uuid4()}.{file_ext}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        with open(output_path, "wb") as f:
            f.write(output_io.getvalue())
            
        return {
            "status": "success",
            "image_url": f"{base_url}/outputs/{output_filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image compression failed: {str(e)}")

@app.post("/convert-image")
async def convert_image(
    request: Request,
    file: UploadFile = File(...),
    format: str = Form(...) # png, jpg, webp, bmp, tiff
):
    base_url = str(request.base_url).rstrip("/")
    """Convert image to specified format."""
    import io
    from PIL import Image
    import uuid

    try:
        contents = await file.read()
        img = Image.open(io.BytesIO(contents))
        
        target_format = format.lower()
        if target_format == 'jpg':
            target_format = 'jpeg'
            
        # Handle RGBA -> JPEG
        if target_format == 'jpeg':
            if img.mode == 'RGBA':
                # Create white background
                background = Image.new("RGB", img.size, (255, 255, 255))
                # Paste utilizing alpha channel as mask
                background.paste(img, mask=img.split()[3])
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
        output_io = io.BytesIO()
        
        # Map extension to PIL format
        save_format = target_format.upper()
        if save_format == 'JPG': save_format = 'JPEG'
        
        img.save(output_io, format=save_format)
        
        output_filename = f"converted_{uuid.uuid4()}.{target_format}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        with open(output_path, "wb") as f:
            f.write(output_io.getvalue())
            
        return {
            "status": "success",
            "image_url": f"{base_url}/outputs/{output_filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image conversion failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
