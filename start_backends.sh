#!/bin/bash

# Kill any existing python processes running on these ports (optional but good for cleanup)
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:8001 | xargs kill -9 2>/dev/null
lsof -ti:8002 | xargs kill -9 2>/dev/null

echo "🚀 Starting Ravelion Local Backends..."

# Function to start a service
start_service() {
    service_dir=$1
    port=$2
    name=$3
    
    echo "📦 Setting up $name ($service_dir) on port $port..."
    cd $service_dir
    
    # Check if venv exists, if not create one (optional, but good practice)
    # For now, assuming global or user python is fine
    
    # Install deps quietly
    echo "   Installing dependencies for $name..."
    pip install -r requirements.txt > /dev/null 2>&1
    
    # Run uvicorn in background
    echo "   Starting $name..."
    python3 main.py > ../$name.log 2>&1 &
    pid=$!
    echo "   Started $name with PID $pid (Log: $name.log)"
    
    cd ..
}

start_service "backend-ai-video" 8000 "Video-AI"
start_service "backend-tools" 8001 "Tools-Service"
start_service "backend-ai-image" 8002 "Image-AI"

echo "✅ All backends started!"
echo "---------------------------------------------------"
echo "Video AI: http://127.0.0.1:8000"
echo "Tools:    http://127.0.0.1:8001"
echo "Image AI: http://127.0.0.1:8002"
echo "---------------------------------------------------"
echo "To stop them, run: pkill -f 'python3 main.py'"
