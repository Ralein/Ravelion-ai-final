# Base Image - using full image to avoid missing dependencies in slim
FROM python:3.10

# Set working directory
WORKDIR /app

# Install system dependencies
# ffmpeg: required for video processing
# libgl1, libglib2.0-0: required for opencv-python
# git: required since some pip packages are installed from git
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
# Using --no-cache-dir to keep image size smaller
# Upgrade pip first to avoid issues
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (FastAPI default)
EXPOSE 8000

# Run the application
# Using 0.0.0.0 to allow external access within container network
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
