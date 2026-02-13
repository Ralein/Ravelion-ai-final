
import requests
import io
from PIL import Image

# The remote URL from your .env.local
API_URL = "https://ravelion-ai-final-1.onrender.com"

def test_remove_bg():
    print(f"Testing {API_URL}/remove-bg-pro...")
    
    # Create a simple red dummy image
    img = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    files = {
        'file': ('test.png', img_byte_arr, 'image/png')
    }
    data = {
        'background_color': 'transparent'
    }

    try:
        response = requests.post(f"{API_URL}/remove-bg-pro", files=files, data=data, timeout=30)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Success! The backend is working.")
            print(f"Response: {response.json()}")
        else:
            print("❌ Error from backend:")
            try:
                # Print proper JSON error if available
                print(response.json())
            except:
                # Fallback to raw text
                print(response.text)
                
    except Exception as e:
        print(f"\nExample request failed: {e}")

if __name__ == "__main__":
    test_remove_bg()
