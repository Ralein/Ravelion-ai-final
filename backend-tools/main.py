# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Ravelion AI Backend - Tools Service
Handles lightweight processing: video tools (ffmpeg), image tools, audio tools.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from config import (
    UPLOAD_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR,
    CORS_ORIGINS
)
from routers import system, video_tools, image_tools, audio
from core.cleanup import cleanup_old_files


# ================== LIFESPAN EVENTS ==================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    print("🚀 Ravelion AI Backend (Tools Service) starting...")
    cleanup_task = asyncio.create_task(run_periodic_cleanup())
    yield
    cleanup_task.cancel()
    print("👋 Ravelion AI Backend (Tools Service) shutting down...")


async def run_periodic_cleanup():
    """Background task to clean old files every hour."""
    while True:
        try:
            await asyncio.sleep(3600)
            cleanup_old_files([UPLOAD_DIR, OUTPUT_DIR, FRAMES_DIR, TEMP_DIR])
            print("🧹 Periodic cleanup completed")
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Cleanup error: {e}")


# ================== APP INITIALIZATION ==================

app = FastAPI(
    title="Ravelion AI - Tools Service",
    description="Lightweight video/image/audio processing tools",
    version="2.0.0",
    lifespan=lifespan
)


# ================== MIDDLEWARE ==================

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and catch unhandled exceptions."""
    print(f"📨 [Tools] {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {str(e)}"}
        )


# ================== STATIC FILE MOUNTS ==================

app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ================== ROUTER REGISTRATION ==================

app.include_router(system.router)
app.include_router(video_tools.router)
app.include_router(image_tools.router)
app.include_router(audio.router)


# ================== MAIN ENTRY POINT ==================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
