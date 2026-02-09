# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
FFmpeg service - reusable video processing operations.
"""

import subprocess
import os
from typing import Optional, Tuple


def run_ffmpeg(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess:
    """
    Run FFmpeg command with error handling.
    
    Args:
        cmd: FFmpeg command as list of arguments
        check: Whether to raise on non-zero exit
        
    Returns:
        CompletedProcess result
    """
    try:
        result = subprocess.run(cmd, check=check, capture_output=True)
        return result
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode() if e.stderr else 'Unknown error'}")
        raise


def change_video_speed(
    input_path: str,
    output_path: str,
    speed: float,
    is_slowmo: bool = True
) -> str:
    """
    Change video speed (slow motion or fast motion).
    
    Args:
        input_path: Path to input video
        output_path: Path for output video
        speed: Speed multiplier (0.25-1.0 for slowmo, 1.0-4.0 for fastmo)
        is_slowmo: Whether this is slow motion
        
    Returns:
        Path to output video
    """
    pts_multiplier = 1.0 / speed
    
    try:
        # Try with audio
        if is_slowmo or speed <= 2.0:
            atempo = f'atempo={speed}'
        else:
            # atempo only works between 0.5 and 2.0, chain if needed
            atempo = f'atempo=2.0,atempo={speed/2.0}'
        
        cmd = [
            'ffmpeg', '-y',
            '-i', input_path,
            '-filter_complex', f'[0:v]setpts={pts_multiplier}*PTS[v];[0:a]{atempo}[a]',
            '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'fast',
            '-c:a', 'aac',
            output_path
        ]
        run_ffmpeg(cmd)
    except subprocess.CalledProcessError:
        # Fallback: try without audio
        cmd = [
            'ffmpeg', '-y',
            '-i', input_path,
            '-filter:v', f'setpts={pts_multiplier}*PTS',
            '-c:v', 'libx264', '-preset', 'fast',
            '-an',
            output_path
        ]
        run_ffmpeg(cmd)
    
    return output_path


def extract_audio(input_path: str, output_path: str) -> str:
    """
    Extract audio from video as MP3.
    
    Args:
        input_path: Path to input video
        output_path: Path for output MP3
        
    Returns:
        Path to output audio file
    """
    cmd = [
        'ffmpeg', '-y',
        '-i', input_path,
        '-vn',
        '-acodec', 'libmp3lame',
        '-q:a', '2',
        output_path
    ]
    run_ffmpeg(cmd)
    return output_path


def remove_audio(input_path: str, output_path: str) -> str:
    """
    Remove audio from video, output silent video.
    
    Args:
        input_path: Path to input video
        output_path: Path for silent output video
        
    Returns:
        Path to output video
    """
    cmd = [
        'ffmpeg', '-y',
        '-i', input_path,
        '-an',
        '-c:v', 'copy',
        output_path
    ]
    run_ffmpeg(cmd)
    return output_path


def convert_video(
    input_path: str,
    output_path: str,
    target_format: str
) -> str:
    """
    Convert video to different format.
    
    Args:
        input_path: Path to input video
        output_path: Path for output video
        target_format: Target format (mp4, mov, webm, avi)
        
    Returns:
        Path to output video
    """
    # Different codecs for different formats
    if target_format == "webm":
        codec_args = ['-c:v', 'libvpx-vp9', '-c:a', 'libopus']
    elif target_format == "avi":
        codec_args = ['-c:v', 'mpeg4', '-c:a', 'mp3']
    else:
        codec_args = ['-c:v', 'libx264', '-c:a', 'aac']
    
    cmd = ['ffmpeg', '-y', '-i', input_path] + codec_args + [output_path]
    run_ffmpeg(cmd)
    return output_path


def compress_video(
    input_path: str,
    output_path: str,
    quality: str = "medium"
) -> str:
    """
    Compress video with quality setting.
    
    Args:
        input_path: Path to input video
        output_path: Path for compressed output
        quality: Quality level (low, medium, high)
        
    Returns:
        Path to output video
    """
    # CRF values: lower = better quality, larger file
    crf_map = {
        "low": 35,      # Maximum compression
        "medium": 28,   # Balanced
        "high": 23      # Best quality
    }
    crf = crf_map.get(quality.lower(), 28)
    
    cmd = [
        'ffmpeg', '-y',
        '-i', input_path,
        '-c:v', 'libx264',
        '-crf', str(crf),
        '-preset', 'medium',
        '-c:a', 'aac',
        '-b:a', '128k',
        output_path
    ]
    run_ffmpeg(cmd)
    return output_path


def merge_audio_to_video(
    video_path: str,
    audio_source_path: str,
    output_path: str
) -> str:
    """
    Merge audio from one video to another.
    
    Args:
        video_path: Path to video (video stream source)
        audio_source_path: Path to audio source video
        output_path: Path for output with merged audio
        
    Returns:
        Path to output video
    """
    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-i', audio_source_path,
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-map', '0:v:0',
        '-map', '1:a:0',
        output_path
    ]
    run_ffmpeg(cmd)
    return output_path
