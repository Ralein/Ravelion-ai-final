# Copyright (c) 2026 Ralein Nova. All rights reserved.
# Proprietary and confidential. Unauthorized copying is prohibited.

"""
Ravelion AI Backend - Image AI Service
Handles image background removal using rembg.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from config import UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR, CORS_ORIGINS
from routers import system, image_ai
from core.cleanup import cleanup_old_files


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Ravelion AI Backend (Image AI) starting...")
    cleanup_task = asyncio.create_task(run_periodic_cleanup())
    yield
    cleanup_task.cancel()
    print("👋 Ravelion AI Backend (Image AI) shutting down...")


async def run_periodic_cleanup():
    while True:
        try:
            await asyncio.sleep(3600)
            cleanup_old_files([UPLOAD_DIR, OUTPUT_DIR, TEMP_DIR])
            print("🧹 Periodic cleanup completed")
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Cleanup error: {e}")


app = FastAPI(
    title="Ravelion AI - Image AI Service",
    description="AI-powered image background removal",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📨 [Image-AI] {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        import traceback
        traceback.print_exc()
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(e)}"})


app.mount("/outputs", StaticFiles(directory=OUTPUT_DIR), name="outputs")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(system.router)
app.include_router(image_ai.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
