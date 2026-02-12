# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Image AI router - AI-powered image processing endpoints.
Handles: remove-bg-pro (rembg)
"""

import os
import uuid
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, Request

from config import OUTPUT_DIR
from services.image_service import remove_background

router = APIRouter(tags=["image-ai"])


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
