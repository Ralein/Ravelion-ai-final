import os
import cv2
import shutil
import wget
import numpy as np
import subprocess

def autorotate_video(video_path):
    """
    Check for rotation metadata and create a temporary rotated copy if needed.
    Returns path to rotated video (or original if no rotation needed).
    """
    try:
        # Check rotation with ffprobe
        cmd = [
            'ffprobe', 
            '-v', 'error', 
            '-select_streams', 'v:0', 
            '-show_entries', 'stream_tags=rotate', 
            '-of', 'default=nw=1:nk=1', 
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        rotation = result.stdout.strip()
        
        if rotation and rotation != "0":
            # Needs rotation
            directory = os.path.dirname(video_path)
            filename = os.path.basename(video_path)
            rotated_path = os.path.join(directory, f"rotated_{filename}")
            
            # Use ffmpeg to re-encode with rotation applied
            # -map_metadata 0 copies metadata, but we want to reset rotation tag
            # actually ffmpeg auto-rotates by default when re-encoding
            subprocess.run([
                'ffmpeg', '-y', 
                '-i', video_path, 
                '-c:a', 'copy', 
                rotated_path
            ], check=True, capture_output=True)
            
            return rotated_path
    except Exception as e:
        print(f"Autorotate check failed: {e}")
    
    return video_path

def extract_first_frame(video_path, output_image_path):
    """
    Extract the first frame from a video file and save it to disk.
    Handles rotation metadata.
    """
    # Use ffmpeg to extract first frame - it handles rotation automatically
    try:
        subprocess.run([
            'ffmpeg', '-y',
            '-i', video_path,
            '-vframes', '1',
            '-q:v', '2',
            output_image_path
        ], check=True, capture_output=True)
        return output_image_path
    except subprocess.CalledProcessError:
        # Fallback to cv2 if ffmpeg fails (though cv2 might ignore rotation)
        print("FFmpeg frame extraction failed, falling back to cv2")
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Error: Unable to open video file: {video_path}")
        ret, frame = cap.read()
        cap.release()
        if not ret:
            raise ValueError("Error: Unable to read the first frame from the video.")
        cv2.imwrite(output_image_path, frame)
        return output_image_path

def video_to_images(video_path, output_dir, image_start=0, image_end=0):
    """
    Convert video to a sequence of images.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    vid = cv2.VideoCapture(video_path)
    total_frames = int(vid.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = vid.get(cv2.CAP_PROP_FPS) # Return FPS for later use
    success, image = vid.read()
    count = 0
    ok_count = 0
    
    if image_end == 0:
        image_end = total_frames

    zfill_max = len(str(total_frames))
    
    while success:
        if count >= image_start and count <= image_end:
            # image is BGR, cv2.imwrite saves BGR. Correct.
            cv2.imwrite(
                f"{output_dir}/frame_{str(ok_count).zfill(zfill_max)}.png", image
            )
            ok_count += 1
        success, image = vid.read()
        count += 1
    
    vid.release()
    return fps, ok_count

def images_to_video(images_dir, output_video_path, fps=30):
    """
    Convert a sequence of images to video using FFmpeg for H.264 encoding.
    """
    filenames = sorted([f for f in os.listdir(images_dir) if f.endswith(".png")])
    if not filenames:
        raise ValueError("No images found in directory")

    # Use FFmpeg to create H.264 MP4
    # Pattern for input files
    first_file = filenames[0]
    # Extract pattern like frame_%04d.png
    prefix = first_file.rsplit('_', 1)[0]
    digits = len(first_file.rsplit('_', 1)[1].split('.')[0])
    pattern = f"{prefix}_%0{digits}d.png"
    
    cmd = [
        'ffmpeg', '-y',
        '-framerate', str(fps),
        '-i', os.path.join(images_dir, pattern),
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p', # Important for browser compatibility
        '-preset', 'fast',
        '-crf', '23', # Good balance of quality/size
        output_video_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        # Fallback to OpenCV if FFmpeg fails (better than nothing)
        print("Falling back to OpenCV (mp4v)...")
        
        # Read first image to get properties
        first_img_path = os.path.join(images_dir, filenames[0])
        img = cv2.imread(first_img_path)
        if img is None:
            raise ValueError(f"Could not read image {first_img_path}")
            
        height, width, layers = img.shape
        size = (width, height)

        fourcc = cv2.VideoWriter_fourcc(*"mp4v") 
        out = cv2.VideoWriter(output_video_path, fourcc, fps, size)

        for filename in filenames:
            img_path = os.path.join(images_dir, filename)
            img = cv2.imread(img_path)
            out.write(img)

        out.release()
        
    return output_video_path

def images_to_video_transparent(images_dir, output_video_path, fps=30):
    """
    Convert a sequence of RGBA PNG images to WebM video with alpha channel.
    Uses FFmpeg for proper alpha channel support.
    """
    filenames = sorted([f for f in os.listdir(images_dir) if f.endswith(".png")])
    if not filenames:
        raise ValueError("No images found in directory")
    
    # Ensure output is WebM
    if not output_video_path.endswith('.webm'):
        output_video_path = output_video_path.rsplit('.', 1)[0] + '.webm'
    
    # Use FFmpeg to create WebM with alpha
    # Pattern for input files
    first_file = filenames[0]
    # Extract pattern like frame_%04d.png
    prefix = first_file.rsplit('_', 1)[0]
    digits = len(first_file.rsplit('_', 1)[1].split('.')[0])
    pattern = f"{prefix}_%0{digits}d.png"
    
    cmd = [
        'ffmpeg', '-y',
        '-framerate', str(fps),
        '-i', os.path.join(images_dir, pattern),
        '-c:v', 'libvpx-vp9',
        '-pix_fmt', 'yuva420p',
        '-b:v', '2M',
        output_video_path
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        # Fallback to regular video if FFmpeg fails
        alt_path = output_video_path.replace('.webm', '.mp4')
        images_to_video(images_dir, alt_path, fps)
        return alt_path
    except FileNotFoundError:
        print("FFmpeg not found, falling back to regular MP4 output")
        alt_path = output_video_path.replace('.webm', '.mp4')
        images_to_video(images_dir, alt_path, fps)
        return alt_path
    
    return output_video_path

def download_mobile_sam_weight(path):
    if not os.path.exists(path):
        print(f"Downloading MobileSAM weights to {path}...")
        sam_weights = "https://raw.githubusercontent.com/ChaoningZhang/MobileSAM/master/weights/mobile_sam.pt"
        os.makedirs(os.path.dirname(path), exist_ok=True)
        wget.download(sam_weights, path)

