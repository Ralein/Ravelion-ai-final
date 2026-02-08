import sys

def check_import(module_name):
    try:
        __import__(module_name)
        print(f"✅ {module_name} imported successfully")
        return True
    except ImportError as e:
        print(f"❌ {module_name} failed to import: {e}")
        return False

print("Verifying Ravelion AI Environment...")

required_modules = [
    "fastapi",
    "uvicorn",
    "cv2",
    "numpy",
    "torch",
    "mobile_sam",
    # "yolov7" # This is the tricky one
]

all_good = True
for mod in required_modules:
    if not check_import(mod):
        all_good = False

print("\nChecking YOLOv7...")
try:
    import yolov7
    print("✅ yolov7 imported successfully")
except ImportError:
    try:
        import yolov7detect
        print("✅ yolov7detect imported successfully")
    except ImportError:
        print("❌ YOLOv7 not found. Please install via 'pip install git+https://github.com/WongKinYiu/yolov7.git' or 'pip install yolov7detect'")
        all_good = False

if all_good:
    print("\n🎉 Environment looks good!")
else:
    print("\n⚠️ Some dependencies are missing. Check README.md.")
