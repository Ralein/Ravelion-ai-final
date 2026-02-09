import os
from rembg import new_session

def download_models():
    print("Pre-downloading rembg models...")
    # This triggers the download of the default u2net model
    new_session("u2net")
    print("Done.")

if __name__ == "__main__":
    download_models()
