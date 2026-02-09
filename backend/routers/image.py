# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Image router - image processing endpoints.
"""

import os
import uuid
import json
import cv2
import numpy as np
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Request

from config import OUTPUT_DIR
from services.image_service import (
    remove_background,
    compress_image as service_compress_image,
    convert_image as service_convert_image,
    inpaint_region
)

router = APIRouter(tags=["image"])


@router.post("/remove-bg-pro")
async def remove_bg_pro(
    request: Request,
    file: UploadFile = File(...),
    background_color: str = Form("transparent")
):
    """Remove background from image using AI."""
    base_url = str(request.base_url).rstrip("/")
    
    try:
        contents = await file.read()
        result, ext = remove_background(contents, background_color)
        
        output_id = str(uuid.uuid4())
        output_filename = f"{output_id}_nobg.{ext}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        result.save(output_path)
        
        return {
            "status": "success",
            "image_url": f"{base_url}/outputs/{output_filename}"
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="rembg not installed")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")


@router.post("/compress-image")
async def compress_image(
    request: Request,
    file: UploadFile = File(...),
    quality: int = Form(50)
):
    """Compress image with specified quality."""
    base_url = str(request.base_url).rstrip("/")
    
    try:
        contents = await file.read()
        
        # Determine format from filename
        if file.filename:
            file_ext = file.filename.split('.')[-1].lower()
        else:
            file_ext = "jpg"
        
        compressed_bytes, ext = service_compress_image(contents, quality, file_ext)
        
        output_filename = f"compressed_{uuid.uuid4()}.{ext}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        with open(output_path, "wb") as f:
            f.write(compressed_bytes)
            
        return {
            "status": "success",
            "image_url": f"{base_url}/outputs/{output_filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image compression failed: {str(e)}")


@router.post("/convert-image")
async def convert_image(
    request: Request,
    file: UploadFile = File(...),
    format: str = Form(...)
):
    """Convert image to specified format."""
    base_url = str(request.base_url).rstrip("/")
    
    try:
        contents = await file.read()
        converted_bytes, ext = service_convert_image(contents, format)
        
        output_filename = f"converted_{uuid.uuid4()}.{ext}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        with open(output_path, "wb") as f:
            f.write(converted_bytes)
            
        return {
            "status": "success",
            "image_url": f"{base_url}/outputs/{output_filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Image conversion failed: {str(e)}")


@router.post("/remove-watermark-image")
async def remove_watermark_image(
    request: Request,
    file: UploadFile = File(...),
    bbox: str = Form(...)
):
    """Remove watermark from image using inpainting."""
    base_url = str(request.base_url).rstrip("/")
    
    try:
        bbox_list = json.loads(bbox)
        xmin, ymin, xmax, ymax = [int(c) for c in bbox_list]
    except:
        raise HTTPException(status_code=400, detail="Invalid bbox format")
    
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        result = inpaint_region(img, (xmin, ymin, xmax, ymax))
        
        output_filename = f"watermark_removed_{uuid.uuid4()}.jpg"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        cv2.imwrite(output_path, result)
        
        return {
            "status": "success",
            "image_url": f"{base_url}/outputs/{output_filename}"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Watermark removal failed: {str(e)}")
