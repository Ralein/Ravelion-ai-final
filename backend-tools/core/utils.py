"""
Core utility functions for the Tools service.
Only contains extract_first_frame (no SAM/AI dependencies).
"""

import os
import cv2
import subprocess


def extract_first_frame(video_path, output_image_path):
    """
    Extract the first frame from a video file and save it to disk.
    Handles rotation metadata.
    """
    # Use ffmpeg to extract first frame - it handles rotation automatically
    try:
        subprocess.run([
            'ffmpeg', '-y',
            '-ss', '0',
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
