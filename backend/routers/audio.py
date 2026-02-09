# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Audio router - audio extraction and removal endpoints.
"""

import os
from fastapi import APIRouter, Form, HTTPException, Request

from config import UPLOAD_DIR, OUTPUT_DIR
from services.ffmpeg_service import extract_audio as ffmpeg_extract_audio
from services.ffmpeg_service import remove_audio as ffmpeg_remove_audio

router = APIRouter(prefix="/audio", tags=["audio"])


def find_video_path(video_id: str) -> str | None:
    """Helper to find video by ID."""
    video_files = [f for f in os.listdir(UPLOAD_DIR) if f.startswith(video_id)]
    if not video_files:
        return None
    return os.path.join(UPLOAD_DIR, video_files[0])


@router.post("/extract-audio")
async def extract_audio(request: Request, video_id: str = Form(...)):
    """Extract audio from video as MP3."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    output_filename = f"{video_id}_audio.mp3"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        ffmpeg_extract_audio(video_path, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio extraction failed: {str(e)}")
    
    return {
        "status": "success",
        "audio_url": f"{base_url}/outputs/{output_filename}"
    }


@router.post("/remove-audio")
async def remove_audio(request: Request, video_id: str = Form(...)):
    """Remove audio from video, output silent video."""
    base_url = str(request.base_url).rstrip("/")
    
    video_path = find_video_path(video_id)
    if not video_path:
        raise HTTPException(status_code=404, detail="Video not found")
    
    output_filename = f"{video_id}_silent.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        ffmpeg_remove_audio(video_path, output_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio removal failed: {str(e)}")
    
    return {
        "status": "success",
        "video_url": f"{base_url}/outputs/{output_filename}"
    }
