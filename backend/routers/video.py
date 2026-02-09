# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Video router - video processing endpoints.
"""

import os
import uuid
import json
import shutil
import cv2
import numpy as np
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Request

from config import UPLOAD_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR, MOBILE_SAM_WEIGHTS
from core.engine import segment_video_logic
from core.utils import extract_first_frame
from services.ffmpeg_service import (
    change_video_speed,
    convert_video as ffmpeg_convert_video,
    compress_video as ffmpeg_compress_video,
    merge_audio_to_video
)
from services.image_service import inpaint_region

router = APIRouter(tags=["video"])


def find_video_path(video_id: str) -> str | None:
    """Helper to find video by ID."""
    video_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(video_id)]
    if not video_files:
        return None
    return os.path.join(UPLOAD_DIR, video_files[0])


@router.post("/upload-video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    """Upload a video and extract first frame."""
    base_url = str(request.base_url).rstrip("/")
    
    video_id = str(uuid.uuid4())
    original_ext = file.filename.split(".")[-1] if file.filename else "mp4"
    video_filename = f"{video_id}.{original_ext}"
    video_path = os.path.join(UPLOAD_DIR, video_filename)
    
    # Save uploaded video
    with open(video_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Extract first frame
    frame_filename = f"{video_id}.jpg"
    frame_path = os.path.join(FRAMES_DIR, frame_filename)
    
    try:
        extract_first_frame(video_path, frame_path)
    except Exception as e:
        # Fallback to cv2 if ffmpeg fails
        cap = cv2.VideoCapture(video_path)
        ret, frame = cap.read()
        cap.release()
        if ret:
            cv2.imwrite(frame_path, frame)
        else:
            raise HTTPException(status_code=400, detail="Could not read video")
    
    return {
        "video_id": video_id,
        "first_frame_url": f"{base_url}/frames/{frame_filename}",
        "video_url": f"{base_url}/uploads/{video_filename}"
    }


@router.post("/segment-video")
def segment_video(
    request: Request,
    video_id: str = Form(...),
    bbox: str = Form(...),
    frame_start: int = Form(0),
    frame_end: int = Form(0),
    background_color: str = Form("#00FF00")
):
    """Segment video using MobileSAM."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        bbox_list = json.loads(bbox)
    except:
        raise HTTPException(status_code=400, detail="Invalid bbox format")
    
    is_transparent = background_color.lower() == "transparent"
    output_ext = "webm" if is_transparent else "mp4"
    output_filename = f"{video_id}_segmented.{output_ext}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        task_temp_dir = os.path.join(TEMP_DIR, video_id)
        
        result_path = segment_video_logic(
            video_path=video_path,
            bbox_list=bbox_list,
            frame_start=frame_start,
            frame_end=frame_end,
            mobile_sam_weights=MOBILE_SAM_WEIGHTS,
            output_video_path=output_path,
            tracker_name="yolov7",
            background_color=background_color,
            work_dir=task_temp_dir
        )
        
        actual_filename = os.path.basename(result_path)
        
        # Cleanup
        if os.path.exists(task_temp_dir):
            shutil.rmtree(task_temp_dir)
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
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")


@router.post("/auto-remove")
def auto_remove(
    request: Request,
    video_id: str = Form(...),
    background_color: str = Form("#00FF00")
):
    """Automatically remove background using center-focused bbox."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Get video dimensions
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Could not open video")
    
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()
    
    # Create center-focused bbox (~70% of frame)
    margin_x = int(width * 0.15)
    margin_y = int(height * 0.1)
    bbox_list = [margin_x, margin_y, width - margin_x, height - margin_y]
    
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
            mobile_sam_weights=MOBILE_SAM_WEIGHTS,
            output_video_path=output_path,
            tracker_name="yolov7",
            background_color=background_color,
            work_dir=task_temp_dir
        )
        
        actual_filename = os.path.basename(result_path)
        
        # Cleanup
        if os.path.exists(task_temp_dir):
            shutil.rmtree(task_temp_dir)
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


@router.post("/slowmo")
async def slowmo(
    request: Request,
    video_id: str = Form(...),
    speed: float = Form(0.5)
):
    """Apply slow motion effect."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    speed = max(0.25, min(1.0, speed))
    
    output_filename = f"{video_id}_slowmo.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        change_video_speed(video_path, output_path, speed, is_slowmo=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Slow motion failed: {str(e)}")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


@router.post("/fastmo")
async def fastmo(
    request: Request,
    video_id: str = Form(...),
    speed: float = Form(2.0)
):
    """Apply fast motion effect."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    speed = max(1.0, min(4.0, speed))
    
    output_filename = f"{video_id}_fastmo.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        change_video_speed(video_path, output_path, speed, is_slowmo=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fast motion failed: {str(e)}")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


@router.post("/convert")
async def convert_video(
    request: Request,
    video_id: str = Form(...),
    format: str = Form("mp4")
):
    """Convert video to different format."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    allowed_formats = ["mp4", "mov", "webm", "avi"]
    if format.lower() not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"Format must be one of: {allowed_formats}")
    
    output_filename = f"{video_id}_converted.{format}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        ffmpeg_convert_video(video_path, output_path, format)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


@router.post("/compress")
async def compress_video(
    request: Request,
    video_id: str = Form(...),
    quality: str = Form("medium")
):
    """Compress video with quality setting."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    output_filename = f"{video_id}_compressed.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        ffmpeg_compress_video(video_path, output_path, quality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compression failed: {str(e)}")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }


@router.post("/remove-watermark-video")
def remove_watermark_video(
    request: Request,
    video_id: str = Form(...),
    bbox: str = Form(...)
):
    """Remove watermark from video using frame-by-frame inpainting."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    try:
        bbox_list = json.loads(bbox)
        xmin, ymin, xmax, ymax = [int(c) for c in bbox_list]
    except:
        raise HTTPException(status_code=400, detail="Invalid bbox format")
    
    output_filename = f"{video_id}_watermark_removed.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Create persistent mask
        mask = np.zeros((height, width), dtype=np.uint8)
        mask[ymin:ymax, xmin:xmax] = 255
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            inpainted_frame = cv2.inpaint(frame, mask, 3, cv2.INPAINT_TELEA)
            out.write(inpainted_frame)
        
        cap.release()
        out.release()
        
        # Try to merge audio back
        try:
            temp_output = output_path.replace(".mp4", "_temp.mp4")
            shutil.move(output_path, temp_output)
            merge_audio_to_video(temp_output, video_path, output_path)
            if os.path.exists(temp_output):
                os.remove(temp_output)
        except Exception as e:
            print(f"Audio merge failed, returning silent video: {e}")
            if os.path.exists(temp_output):
                shutil.move(temp_output, output_path)
        
        return {
            "status": "success",
            "video_url": f"{base_url}/outputs/{output_filename}"
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Watermark removal failed: {str(e)}")
