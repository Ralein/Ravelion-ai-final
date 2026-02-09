# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Image processing service - reusable image operations.
"""

import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Optional


def remove_background(
    image_bytes: bytes,
    background_color: str = "transparent",
    max_dim: int = 1500
) -> Tuple[Image.Image, str]:
    """
    Remove background from image using rembg.
    
    Args:
        image_bytes: Raw image bytes
        background_color: "transparent" or hex color like "#FFFFFF"
        max_dim: Maximum dimension for processing (resize larger images)
        
    Returns:
        Tuple of (processed PIL Image, file extension)
    """
    from rembg import remove
    
    pil_img = Image.open(io.BytesIO(image_bytes))
    
    # Resize if too large to speed up inference
    if max(pil_img.size) > max_dim:
        pil_img.thumbnail((max_dim, max_dim), Image.LANCZOS)
    
    result = remove(pil_img)
    
    is_transparent = background_color.lower() == "transparent"
    
    if not is_transparent:
        bg_hex = background_color.lstrip("#")
        bg_rgb = tuple(int(bg_hex[i:i+2], 16) for i in (0, 2, 4))
        
        # Create background and composite
        bg = Image.new("RGBA", result.size, (*bg_rgb, 255))
        bg.paste(result, mask=result.split()[3])
        result = bg.convert("RGB")
        ext = "jpg"
    else:
        ext = "png"
    
    return result, ext


def compress_image(
    image_bytes: bytes,
    quality: int = 50,
    original_ext: str = "jpg"
) -> Tuple[bytes, str]:
    """
    Compress image with specified quality.
    
    Args:
        image_bytes: Raw image bytes
        quality: Quality 1-100
        original_ext: Original file extension
        
    Returns:
        Tuple of (compressed bytes, file extension)
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    output_format = 'JPEG'
    if original_ext == 'png':
        output_format = 'PNG'
    elif original_ext == 'webp':
        output_format = 'WEBP'
        
    # Handle RGBA -> JPEG conversion
    if output_format == 'JPEG' and img.mode in ('RGBA', 'LA'):
        background = Image.new(img.mode[:-1], img.size, (255, 255, 255))
        background.paste(img, img.split()[-1])
        img = background
        
    output_io = io.BytesIO()
    
    if output_format == 'PNG':
        # For PNG, quality affects quantization
        if quality < 80:
            img = img.quantize(colors=256, method=2)
        img.save(output_io, format=output_format, optimize=True)
    else:
        img.save(output_io, format=output_format, quality=quality, optimize=True)
    
    return output_io.getvalue(), original_ext


def convert_image(
    image_bytes: bytes,
    target_format: str
) -> Tuple[bytes, str]:
    """
    Convert image to specified format.
    
    Args:
        image_bytes: Raw image bytes
        target_format: Target format (png, jpg, webp, bmp, tiff)
        
    Returns:
        Tuple of (converted bytes, file extension)
    """
    img = Image.open(io.BytesIO(image_bytes))
    
    target_format = target_format.lower()
    if target_format == 'jpg':
        target_format = 'jpeg'
        
    # Handle RGBA -> JPEG
    if target_format == 'jpeg':
        if img.mode == 'RGBA':
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
    
    output_io = io.BytesIO()
    save_format = target_format.upper()
    if save_format == 'JPG':
        save_format = 'JPEG'
    
    img.save(output_io, format=save_format)
    
    # Return proper extension
    ext = target_format if target_format != 'jpeg' else 'jpg'
    return output_io.getvalue(), ext


def inpaint_region(
    image: np.ndarray,
    bbox: Tuple[int, int, int, int],
    inpaint_radius: int = 3
) -> np.ndarray:
    """
    Inpaint a region using OpenCV.
    
    Args:
        image: OpenCV image (BGR)
        bbox: Bounding box (xmin, ymin, xmax, ymax)
        inpaint_radius: Inpainting radius
        
    Returns:
        Inpainted image
    """
    xmin, ymin, xmax, ymax = bbox
    
    # Create mask
    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    mask[ymin:ymax, xmin:xmax] = 255
    
    # Inpaint using Telea method
    result = cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)
    return result
