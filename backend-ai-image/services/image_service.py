# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Image processing service - AI background removal only.
"""

import io
from PIL import Image
from typing import Tuple


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
