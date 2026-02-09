# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
System router - utility endpoints for health checks and cleanup.
"""

import os
import shutil
from fastapi import APIRouter

from config import UPLOAD_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR

router = APIRouter(tags=["system"])


@router.get("/")
def read_root():
    return {"message": "Ravelion AI Backend", "version": "2.0.0"}


@router.get("/ping")
def ping():
    return {"status": "alive"}


@router.post("/cleanup")
def cleanup_system():
    """
    Clear all temporary directories and reset system state.
    """
    dirs_to_clean = [UPLOAD_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR]
    cleaned = []
    
    for dir_path in dirs_to_clean:
        if os.path.exists(dir_path):
            for item in os.listdir(dir_path):
                item_path = os.path.join(dir_path, item)
                try:
                    if os.path.isfile(item_path):
                        os.remove(item_path)
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                    cleaned.append(item_path)
                except Exception as e:
                    print(f"Failed to clean {item_path}: {e}")
    
    return {"status": "success", "cleaned_items": len(cleaned)}
