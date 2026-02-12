# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Centralized configuration for the Ravelion AI Backend (Video AI Service).
"""

import os

# Directory Configuration
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
FRAMES_DIR = "frames"
TEMP_DIR = "temp_work"
MODELS_DIR = "models"

# Ensure directories exist
for directory in [UPLOAD_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR, MODELS_DIR]:
    os.makedirs(directory, exist_ok=True)

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://ravelion.vercel.app",
    "*",
]

# Model Paths
MOBILE_SAM_WEIGHTS = "models/mobile_sam.pt"
