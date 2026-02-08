import os
import cv2
import numpy as np
import torch
from mobile_sam import SamPredictor, sam_model_registry
from PIL import Image

from .utils import video_to_images, images_to_video, images_to_video_transparent, download_mobile_sam_weight, autorotate_video


def segment_video_logic(
    video_path,
    bbox_list,  # passed as list [xmin, ymin, xmax, ymax]
    frame_start,
    frame_end,
    mobile_sam_weights,
    output_video_path,
    tracker_name="yolov7",
    background_color="#00FF00",  # Default Green, or "transparent"
    work_dir="temp_work"
):
    """
    Segment video using MobileSAM with a static bounding box.
    The bbox is used for all frames (no tracking).
    Supports transparent background output when background_color="transparent".
    """
    # Setup directories
    frames_dir = os.path.join(work_dir, "frames")
    processed_dir = os.path.join(work_dir, "processed")
    if os.path.exists(work_dir):
        import shutil
        shutil.rmtree(work_dir)
    os.makedirs(frames_dir)
    os.makedirs(processed_dir)

    is_transparent = background_color.lower() == "transparent"
    
    # Adjust output path for transparent (WebM)
    if is_transparent and not output_video_path.endswith('.webm'):
        output_video_path = output_video_path.rsplit('.', 1)[0] + '.webm'

    # 1. Video to Images
    # 1. Video to Images
    # Ensure video is rotated correctly (cv2 ignores metadata, so we physically rotate if needed)
    processing_video_path = autorotate_video(video_path)
    print(f"Processing video: {processing_video_path}")
    
    fps, count = video_to_images(processing_video_path, frames_dir, frame_start, frame_end)
    print(f"Extracted {count} frames at {fps} FPS")
    
    # 2. Setup MobileSAM
    download_mobile_sam_weight(mobile_sam_weights)
    
    device = "cpu"
    if torch.cuda.is_available():
        device = "cuda"
    elif torch.backends.mps.is_available():
        device = "mps"
    
    print(f"Using device: {device}")

    # Load SAM
    sam = sam_model_registry["vit_t"](checkpoint=mobile_sam_weights)
    sam.to(device=device)
    sam.eval()
    predictor = SamPredictor(sam)

    # Prepare background color (if not transparent)
    if not is_transparent:
        bg_color_hex = background_color.lstrip("#")
        bg_color_rgb = np.array([int(bg_color_hex[i : i + 2], 16) for i in (0, 2, 4)])
    
    # Use user-provided bbox for all frames (static)
    input_box = np.array(bbox_list)
    print(f"Using bounding box: {input_box}")
    print(f"Background: {'Transparent' if is_transparent else background_color}")

    frames = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])
    print(f"Processing {len(frames)} frames...")
    
    for idx, frame_name in enumerate(frames):
        image_path = os.path.join(frames_dir, frame_name)
        image_pil = Image.open(image_path)
        image_np = np.array(image_pil)
        
        # Set image for SAM
        predictor.set_image(image_np)
        
        # Predict mask using bbox
        masks, scores, _ = predictor.predict(
            point_coords=None,
            point_labels=None,
            box=input_box[None, :],
            multimask_output=True,
        )
        
        # Choose best mask (highest score)
        best_mask_idx = np.argmax(scores)
        mask = masks[best_mask_idx]
        
        h, w = mask.shape[-2:]
        mask_reshaped = mask.reshape(h, w, 1).astype(np.float32)
        
        if is_transparent:
            # Create RGBA image with alpha channel from mask
            alpha = (mask_reshaped * 255).astype(np.uint8).squeeze()
            rgba = np.dstack([image_np, alpha])
            
            # Save as PNG (preserves alpha)
            out_frame_path = os.path.join(processed_dir, frame_name)
            Image.fromarray(rgba, 'RGBA').save(out_frame_path)
        else:
            # Create background
            bg_image = np.ones((h, w, 3), dtype=np.uint8) * bg_color_rgb
            
            # Composite: foreground (masked) + background (inverted mask)
            foreground = image_np * mask_reshaped
            background = bg_image * (1 - mask_reshaped)
            combined = (foreground + background).astype(np.uint8)
            
            # Save frame (convert RGB to BGR for OpenCV)
            out_frame_path = os.path.join(processed_dir, frame_name)
            combined_bgr = cv2.cvtColor(combined, cv2.COLOR_RGB2BGR)
            cv2.imwrite(out_frame_path, combined_bgr)
        
        if (idx + 1) % 10 == 0:
            print(f"Processed {idx + 1}/{len(frames)} frames")
        
    # 3. Images to Video
    print("Creating output video...")
    if is_transparent:
        images_to_video_transparent(processed_dir, output_video_path, fps=int(fps))
    else:
        images_to_video(processed_dir, output_video_path, fps=int(fps))
    
    print(f"Done! Output saved to {output_video_path}")
    print(f"Done! Output saved to {output_video_path}")
    
    # Cleanup rotated video if it was created
    if processing_video_path != video_path and os.path.exists(processing_video_path):
        os.remove(processing_video_path)
        
    return output_video_path

