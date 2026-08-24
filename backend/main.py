"""
Strix backend API – FastAPI app serving on port 8000.

Run with:
    uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

Your React frontend (on port 8080) calls these endpoints.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

import json
import asyncio
from pathlib import Path

from backend import analyzer, generator

app = FastAPI(title="Strix Ready API", version="0.2.0")

# ---------------------------------------------------------------------------
# CORS – allow the React frontend to call this API
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Scan endpoint – consumed by the React frontend
# ---------------------------------------------------------------------------

@app.post("/scan")
async def scan(request: Request):
    """Clone a GitHub repo, analyse it, and generate Docker configuration
    files via AI.

    **Request body (JSON):**
    ```json
    { "url": "https://github.com/owner/repo", "os": "linux" }
    ```

    **Response (JSON):**
    ```json
    {
      "profile": { ... },
      "artifacts": {
        "Dockerfile": "...",
        "docker-compose.yml": "...",
        ".dockerignore": "...",
        ".env.example": "...",
        "notes": "..."
      },
      "written_files": ["/tmp/strix_.../Dockerfile", ...],
      "local_path": "/tmp/strix_.../repo"
    }
    ```
    """
    body = await request.json()
    url = body.get("url", "").strip()
    user_os = body.get("os", "linux").strip().lower()

    if not url:
        return JSONResponse({"detail": "url is required"}, status_code=400)

    # 1. Clone & analyse
    try:
        profile = analyzer.analyze_repo(url, user_os=user_os)
    except (ValueError, RuntimeError) as exc:
        return JSONResponse({"detail": str(exc)}, status_code=422)
    except Exception as exc:
        return JSONResponse({"detail": f"Clone/analysis failed: {exc}"}, status_code=500)

    # 2. Generate Docker artifacts from AI
    artifacts = generator.generate_docker(profile)

    # 3. Write artifacts to the cloned repo
    local_path = profile.get("local_path", ".")
    written_files = generator.write_artifacts(local_path, artifacts)

    return {
        "profile": {
            "name": profile.get("name"),
            "languages": profile.get("languages"),
            "frameworks": profile.get("frameworks"),
            "ports": profile.get("ports"),
            "local_path": profile.get("local_path"),
        },
        "artifacts": artifacts,
        "written_files": written_files,
        "local_path": local_path,
    }


@app.post("/scan/analyze")
async def scan_analyze_only(request: Request):
    """Clone and analyse only – don't execute anything.

    Useful for the frontend to preview commands before running.

    Returns profile + commands without executing.
    """
    body = await request.json()
    url = body.get("url", "").strip()
    user_os = body.get("os", "linux").strip().lower()

    if not url:
        return JSONResponse({"detail": "url is required"}, status_code=400)

    try:
        profile = analyzer.analyze_repo(url, user_os=user_os)
    except (ValueError, RuntimeError) as exc:
        return JSONResponse({"detail": str(exc)}, status_code=422)
    except Exception as exc:
        return JSONResponse({"detail": f"Clone/analysis failed: {exc}"}, status_code=500)

    commands = generator.generate(profile)

    return {
        "profile": {
            "name": profile.get("name"),
            "languages": profile.get("languages"),
            "frameworks": profile.get("frameworks"),
            "ports": profile.get("ports"),
            "local_path": profile.get("local_path"),
        },
        "commands": commands,
    }


@app.post("/run")
async def run_commands(request: Request):
    """Execute commands in a given directory.

    **Request body (JSON):**
    ```json
    {
      "local_path": "/tmp/strix_.../repo",
      "commands": {
        "install_command": "npm install",
        "dev_command": "npm run dev",
        "port": 5173
      }
    }
    ```
    """
    body = await request.json()
    local_path = body.get("local_path", "").strip()
    commands = body.get("commands", {})

    if not local_path:
        return JSONResponse({"detail": "local_path is required"}, status_code=400)
    if not commands.get("dev_command"):
        return JSONResponse({"detail": "commands.dev_command is required"}, status_code=400)

    result = generator.run_local(local_path, commands)
    return {"result": result}


# ---------------------------------------------------------------------------
# SSE streaming endpoint – live progress updates to the frontend
# ---------------------------------------------------------------------------

@app.get("/scan/stream")
async def scan_stream(url: str, os: str = "linux"):
    """Server-Sent Events endpoint that streams live progress.

    **Usage:**
    ```
    GET /scan/stream?url=https://github.com/owner/repo&os=linux
    ```

    **Events sent (one JSON per line):**
    ```
    data: {"step": "clone", "message": "Cloning repository...", "data": null}
    data: {"step": "analyze", "message": "Analysis complete...", "data": {...}}
    data: {"step": "ai", "message": "AI returned commands", "data": {...}}
    data: {"step": "install", "message": "Installing dependencies: npm install", "data": null}
    data: {"step": "install", "message": "Dependencies installed successfully.", "data": null}
    data: {"step": "dev", "message": "Starting dev server: npm run dev", "data": null}
    data: {"step": "done", "message": "App running at http://localhost:5173", "data": {"running": true, "port": 5173, "pid": 12345}}
    ```

    Steps: clone, analyze, ai, commands, pre_install, install, post_install, dev, done, error
    """
    queue: asyncio.Queue = asyncio.Queue()
    loop = asyncio.get_event_loop()

    def on_log(step: str, message: str, data: dict = None):
        """Push a status event into the async queue from sync code."""
        asyncio.run_coroutine_threadsafe(
            queue.put({"step": step, "message": message, "data": data}),
            loop,
        )

    async def run_scan():
        """Run the full scan flow in a thread pool, pushing events."""
        def _do_scan():
            try:
                # 1. Clone & analyse
                profile = analyzer.analyze_repo(url, user_os=os, on_log=on_log)

                # 2. Get commands from AI
                commands = generator.generate(profile, on_log=on_log)

                # Send the commands as a dedicated event
                asyncio.run_coroutine_threadsafe(
                    queue.put({
                        "step": "commands",
                        "message": "Setup plan ready",
                        "data": commands,
                    }),
                    loop,
                )

                # 3. Execute locally
                local_path = profile.get("local_path", ".")
                generator.run_local(local_path, commands, on_log=on_log)

            except Exception as e:
                asyncio.run_coroutine_threadsafe(
                    queue.put({"step": "error", "message": str(e), "data": None}),
                    loop,
                )

            # Signal end of stream
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)

        await asyncio.get_event_loop().run_in_executor(None, _do_scan)

    # Start the scan in the background
    asyncio.create_task(run_scan())

    async def event_generator():
        while True:
            event = await queue.get()
            if event is None:
                # Send a final "end" event so frontend knows the stream is done
                yield f"data: {json.dumps({'step': 'end', 'message': 'Stream complete', 'data': None})}\n\n"
                break
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
