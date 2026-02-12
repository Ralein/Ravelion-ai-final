import os
import time
import shutil
import logging

logger = logging.getLogger("uvicorn")

def cleanup_old_files(directories, max_age_seconds=3600):
    """
    Delete files in specified directories that are older than max_age_seconds.
    """
    now = time.time()
    deleted_count = 0
    
    for directory in directories:
        if not os.path.exists(directory):
            continue
            
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            try:
                # Check file age
                if os.stat(file_path).st_mtime < (now - max_age_seconds):
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.remove(file_path)
                        deleted_count += 1
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                        deleted_count += 1
            except Exception as e:
                logger.error(f"Error deleting {file_path}: {e}")
                
    if deleted_count > 0:
        logger.info(f"Cleanup: Deleted {deleted_count} old files/directories.")

def cleanup_all_contents(directories):
    """
    Delete all contents of specified directories without removing the directories themselves.
    """
    deleted_count = 0
    for directory in directories:
        if not os.path.exists(directory):
            continue
            
        for filename in os.listdir(directory):
            file_path = os.path.join(directory, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
                deleted_count += 1
            except Exception as e:
                logger.error(f"Error deleting {file_path}: {e}")
                
    return deleted_count
