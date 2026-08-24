"""
generator.py – Ask AI for install/dev commands, then execute them locally.

Flow:
  1. Send repo profile to Groq AI
  2. AI returns: install_command, dev_command, env_vars, port, notes
  3. Strix executes the commands locally in the cloned repo
  4. App runs on localhost
"""

import os
import json
import re
import subprocess
import shlex
from pathlib import Path
from typing import Dict, Any, Optional, Callable

from dotenv import load_dotenv
from groq import Groq

from backend.utils import colors

# Type alias for the optional log callback
LogCallback = Optional[Callable[[str, str, Optional[dict]], None]]

# Load .env from project root
load_dotenv(Path(__file__).parent.parent / ".env")

# ---------------------------------------------------------------------------
# Load system prompts
# ---------------------------------------------------------------------------
_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "generate_artifacts_prompt.txt"
try:
    SYSTEM_PROMPT = _PROMPT_PATH.read_text()
except FileNotFoundError:
    SYSTEM_PROMPT = (
        "You are an expert developer assistant. Given a repository profile, "
        "return a JSON object with keys: install_command, dev_command, port, "
        "env_vars, env_notes, pre_install, post_install."
    )

_DOCKER_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "generate_docker_prompt.txt"
try:
    DOCKER_SYSTEM_PROMPT = _DOCKER_PROMPT_PATH.read_text()
except FileNotFoundError:
    DOCKER_SYSTEM_PROMPT = (
        "You are an expert DevOps engineer. Given a repository profile, "
        "return a JSON object with keys: Dockerfile, docker-compose.yml, "
        ".dockerignore, .env.example, notes. Each value is the full file content."
    )


# ---------------------------------------------------------------------------
# Build prompt from profile
# ---------------------------------------------------------------------------

def _build_user_prompt(profile: Dict[str, Any]) -> str:
    """Serialise the repo profile into a prompt the LLM can reason about."""
    MAX_README = 4000
    readme = profile.get("readme", "")
    if len(readme) > MAX_README:
        readme = readme[:MAX_README] + "\n... (truncated)"

    config_files = profile.get("config_files", {})
    config_summaries = []
    for fname, content in config_files.items():
        snippet = content[:2000] + ("\n... (truncated)" if len(content) > 2000 else "")
        config_summaries.append(f"--- {fname} ---\n{snippet}")

    cfg_text = "\n".join(config_summaries)

    return (
        f"Repository: {profile.get('name', 'N/A')}\n"
        f"Languages: {json.dumps(profile.get('languages', {}))}\n"
        f"Detected frameworks: {profile.get('frameworks', [])}\n"
        f"Detected ports: {profile.get('ports', [])}\n"
        f"Target OS: {profile.get('os', 'linux')}\n\n"
        f"--- README ---\n{readme}\n\n"
        f"--- Config files ---\n{cfg_text}\n\n"
        "Based on this information, return the JSON with the exact commands "
        "to install dependencies and run the local dev server."
    )


# ---------------------------------------------------------------------------
# Parse AI response
# ---------------------------------------------------------------------------

def _parse_ai_response(raw: str) -> Optional[Dict[str, Any]]:
    """Parse AI response, stripping markdown fences if present."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    try:
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
    except json.JSONDecodeError:
        pass

    # Try to find JSON object in the response
    match = re.search(r'\{[^{}]*\}', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None


# ---------------------------------------------------------------------------
# Fallback: infer commands deterministically
# ---------------------------------------------------------------------------

def _fallback_commands(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Deterministic command inference when AI is unavailable."""
    config_files = profile.get("config_files", {})
    frameworks = profile.get("frameworks", [])
    ports = profile.get("ports", [])

    result = {
        "install_command": None,
        "dev_command": None,
        "port": ports[0] if ports else None,
        "env_vars": {},
        "env_notes": None,
        "pre_install": None,
        "post_install": None,
    }

    # Node.js projects
    if "package.json" in config_files:
        result["install_command"] = "npm install"
        try:
            pj = json.loads(config_files["package.json"])
            scripts = pj.get("scripts", {})
            if "dev" in scripts:
                result["dev_command"] = "npm run dev"
            elif "start" in scripts:
                result["dev_command"] = "npm start"
            else:
                result["dev_command"] = "npm start"
        except json.JSONDecodeError:
            result["dev_command"] = "npm start"

        if not result["port"]:
            if any(f in frameworks for f in ["Vite", "Vue"]):
                result["port"] = 5173
            else:
                result["port"] = 3000

    # Python projects
    elif "requirements.txt" in config_files or "pyproject.toml" in config_files:
        if "requirements.txt" in config_files:
            result["install_command"] = "pip install -r requirements.txt"
        else:
            result["install_command"] = "pip install -e ."

        if "FastAPI" in frameworks:
            result["dev_command"] = "uvicorn main:app --reload --host 0.0.0.0 --port 8000"
            result["port"] = 8000
        elif "Flask" in frameworks:
            result["dev_command"] = "flask run --host=0.0.0.0 --port=5000"
            result["port"] = 5000
        elif "Django" in frameworks:
            result["dev_command"] = "python manage.py runserver 0.0.0.0:8000"
            result["port"] = 8000
        else:
            result["dev_command"] = "python main.py"
            result["port"] = result["port"] or 8000

    return result


# ---------------------------------------------------------------------------
# AI-powered command generation
# ---------------------------------------------------------------------------

def generate(profile: Dict[str, Any], on_log: LogCallback = None) -> Dict[str, Any]:
    """Send the repo profile to Groq and return commands to run locally.

    Returns a dict with keys:
      install_command, dev_command, port, env_vars, env_notes,
      pre_install, post_install
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        msg = "GROQ_API_KEY not set – using fallback detection."
        print(f"{colors.YELLOW}{msg}{colors.END}")
        if on_log:
            on_log("ai", msg)
        return _fallback_commands(profile)

    client = Groq(api_key=api_key)
    user_prompt = _build_user_prompt(profile)

    if on_log:
        on_log("ai", "Contacting AI for setup commands...")

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=1024,
        )
        raw = completion.choices[0].message.content or ""
        result = _parse_ai_response(raw)

        if result and "install_command" in result:
            msg = "AI returned commands successfully."
            print(f"{colors.GREEN}{msg}{colors.END}")
            if on_log:
                on_log("ai", msg, result)
            return result

        msg = "AI response missing required fields – using fallback."
        print(f"{colors.YELLOW}{msg}{colors.END}")
        if on_log:
            on_log("ai", msg)
        return _fallback_commands(profile)

    except Exception as e:
        msg = f"Groq API error: {e}"
        print(f"{colors.RED}{msg}{colors.END}")
        if on_log:
            on_log("ai", msg)
        return _fallback_commands(profile)


# ---------------------------------------------------------------------------
# Docker artifact generation (Generate button)
# ---------------------------------------------------------------------------

def generate_docker(profile: Dict[str, Any], on_log: LogCallback = None) -> Dict[str, str]:
    """Send the repo profile to AI and get Docker config files back.

    Returns a dict with keys: Dockerfile, docker-compose.yml, .dockerignore,
    .env.example, notes.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        msg = "GROQ_API_KEY not set"
        if on_log:
            on_log("ai", msg)
        return _fallback_docker(profile)

    client = Groq(api_key=api_key)
    user_prompt = _build_user_prompt(profile)

    if on_log:
        on_log("ai", "Contacting AI for Docker configuration...")

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": DOCKER_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            max_tokens=2048,
        )
        raw = completion.choices[0].message.content or ""
        result = _parse_ai_response(raw)

        if result and "Dockerfile" in result:
            msg = "AI returned Docker config successfully."
            print(f"{colors.GREEN}{msg}{colors.END}")
            if on_log:
                on_log("ai", msg, result)
            return result

        msg = "AI response missing Dockerfile – using fallback."
        print(f"{colors.YELLOW}{msg}{colors.END}")
        if on_log:
            on_log("ai", msg)
        return _fallback_docker(profile)

    except Exception as e:
        msg = f"Groq API error: {e}"
        print(f"{colors.RED}{msg}{colors.END}")
        if on_log:
            on_log("ai", msg)
        return _fallback_docker(profile)


def _fallback_docker(profile: Dict[str, Any]) -> Dict[str, str]:
    """Minimal Docker files when AI is unavailable."""
    langs = profile.get("languages", [])
    name = profile.get("name", "app")

    if "JavaScript" in langs or "TypeScript" in langs:
        dockerfile = (
            "FROM node:20-alpine\n"
            "WORKDIR /app\n"
            "COPY package*.json ./\n"
            "RUN npm install\n"
            "COPY . .\n"
            "EXPOSE 3000\n"
            'CMD ["npm", "run", "dev"]\n'
        )
        compose = (
            "services:\n"
            f"  {name}:\n"
            "    build: .\n"
            "    ports:\n"
            '      - "3000:3000"\n'
            "    volumes:\n"
            "      - .:/app\n"
            "      - /app/node_modules\n"
            "    env_file: [.env]\n"
        )
    elif "Python" in langs:
        dockerfile = (
            "FROM python:3.12-slim\n"
            "WORKDIR /app\n"
            "COPY requirements.txt ./\n"
            "RUN pip install --no-cache-dir -r requirements.txt\n"
            "COPY . .\n"
            "EXPOSE 8000\n"
            'CMD ["python", "main.py"]\n'
        )
        compose = (
            "services:\n"
            f"  {name}:\n"
            "    build: .\n"
            "    ports:\n"
            '      - "8000:8000"\n'
            "    volumes:\n"
            "      - .:/app\n"
            "    env_file: [.env]\n"
        )
    else:
        dockerfile = (
            "FROM ubuntu:22.04\n"
            "WORKDIR /app\n"
            "COPY . .\n"
            "EXPOSE 8080\n"
            'CMD ["bash"]\n'
        )
        compose = (
            "services:\n"
            f"  {name}:\n"
            "    build: .\n"
            "    ports:\n"
            '      - "8080:8080"\n'
            "    volumes:\n"
            "      - .:/app\n"
        )

    return {
        "Dockerfile": dockerfile,
        "docker-compose.yml": compose,
        ".dockerignore": "node_modules\n.git\n.env\n.env.local\ndist\n__pycache__\n.venv\n*.log\n.DS_Store\n",
        ".env.example": "# Add your environment variables here\n",
        "notes": "Fallback Docker config generated (AI unavailable).",
    }


# ---------------------------------------------------------------------------
# Write generated Docker artifacts to disk
# ---------------------------------------------------------------------------

def write_artifacts(target_dir: str, artifacts: Dict[str, str], on_log: LogCallback = None) -> list:
    """Write Docker config files into the project directory.

    Returns a list of file paths that were written.
    """
    cwd = Path(target_dir)
    written = []

    file_keys = ["Dockerfile", "docker-compose.yml", ".dockerignore", ".env.example"]

    for key in file_keys:
        content = artifacts.get(key)
        if not content:
            continue

        file_path = cwd / key
        # Don't overwrite existing files without notice
        if file_path.exists():
            msg = f"  {key} already exists – overwriting."
            print(f"{colors.YELLOW}{msg}{colors.END}")
            if on_log:
                on_log("write", msg)

        file_path.write_text(content)
        msg = f"  wrote {file_path}"
        print(f"{colors.GREEN}{msg}{colors.END}")
        if on_log:
            on_log("write", msg)
        written.append(str(file_path))

    return written


# ---------------------------------------------------------------------------
# Write .env file if needed
# ---------------------------------------------------------------------------

def write_env_file(target_dir: str, env_vars: Dict[str, str]) -> None:
    """Write a .env file with the provided variables if one doesn't exist."""
    env_path = Path(target_dir) / ".env"
    if env_path.exists():
        print(f"{colors.YELLOW}  .env already exists – skipping.{colors.END}")
        return

    if not env_vars:
        return

    lines = []
    for key, value in env_vars.items():
        lines.append(f"{key}={value}")

    env_path.write_text("\n".join(lines) + "\n")
    print(f"{colors.GREEN}  wrote {env_path}{colors.END}")


# ---------------------------------------------------------------------------
# Execute commands locally
# ---------------------------------------------------------------------------

def run_local(target_dir: str, commands: Dict[str, Any], on_log: LogCallback = None) -> Dict[str, Any]:
    """Execute install + dev commands in the cloned repo directory.

    Returns a dict with:
      - running: bool
      - port: int or None
      - pid: process id of dev server
      - error: optional error message
    """
    cwd = Path(target_dir)
    if not cwd.exists():
        return {"running": False, "port": None, "error": f"Directory not found: {target_dir}"}

    port = commands.get("port")
    env_vars = commands.get("env_vars", {})
    pre_install = commands.get("pre_install")
    install_cmd = commands.get("install_command")
    post_install = commands.get("post_install")
    dev_cmd = commands.get("dev_command")

    # Write .env if env_vars provided
    if env_vars:
        write_env_file(target_dir, env_vars)

    # Run pre-install
    if pre_install:
        msg = f"Running pre-install: {pre_install}"
        print(f"{colors.CYAN}{msg}{colors.END}")
        if on_log:
            on_log("pre_install", msg)
        try:
            subprocess.run(
                pre_install, shell=True, cwd=str(cwd),
                check=True, timeout=120,
            )
        except subprocess.CalledProcessError as e:
            msg = f"Pre-install warning: {e}"
            print(f"{colors.YELLOW}{msg}{colors.END}")
            if on_log:
                on_log("pre_install", msg)
        except subprocess.TimeoutExpired:
            msg = "Pre-install timed out."
            print(f"{colors.YELLOW}{msg}{colors.END}")
            if on_log:
                on_log("pre_install", msg)

    # Run install
    if install_cmd:
        msg = f"Installing dependencies: {install_cmd}"
        print(f"{colors.CYAN}{msg}{colors.END}")
        if on_log:
            on_log("install", msg)
        try:
            result = subprocess.run(
                install_cmd, shell=True, cwd=str(cwd),
                check=True, timeout=300, text=True,
                capture_output=True,
            )
            msg = "Dependencies installed successfully."
            print(f"{colors.GREEN}{msg}{colors.END}")
            if on_log:
                on_log("install", msg)
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr or e.stdout or str(e)
            msg = f"Install failed: {error_msg}"
            print(f"{colors.RED}{msg}{colors.END}")
            if on_log:
                on_log("install", msg)
            return {"running": False, "port": port, "error": msg}
        except subprocess.TimeoutExpired:
            msg = "Install timed out after 5 minutes"
            if on_log:
                on_log("install", msg)
            return {"running": False, "port": port, "error": msg}

    # Run post-install
    if post_install:
        msg = f"Running post-install: {post_install}"
        print(f"{colors.CYAN}{msg}{colors.END}")
        if on_log:
            on_log("post_install", msg)
        try:
            subprocess.run(
                post_install, shell=True, cwd=str(cwd),
                check=True, timeout=120,
            )
        except subprocess.CalledProcessError as e:
            msg = f"Post-install warning: {e}"
            print(f"{colors.YELLOW}{msg}{colors.END}")
            if on_log:
                on_log("post_install", msg)
        except subprocess.TimeoutExpired:
            msg = "Post-install timed out."
            print(f"{colors.YELLOW}{msg}{colors.END}")
            if on_log:
                on_log("post_install", msg)

    # Start dev server
    if dev_cmd:
        msg = f"Starting dev server: {dev_cmd}"
        print(f"{colors.CYAN}{msg}{colors.END}")
        if on_log:
            on_log("dev", msg)
        try:
            # Capture stdout so we can parse the real port the server chose
            process = subprocess.Popen(
                dev_cmd, shell=True, cwd=str(cwd),
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                text=True,
            )

            # Read output for up to 15 seconds looking for the real URL/port
            import time
            actual_port = port
            collected_output = []
            deadline = time.time() + 15

            while time.time() < deadline:
                if process.poll() is not None:
                    # Process exited — read remaining output
                    rest = process.stdout.read() if process.stdout else ""
                    collected_output.append(rest)
                    break

                # Non-blocking read: check if there's a line available
                line = process.stdout.readline()
                if line:
                    stripped = line.strip()
                    collected_output.append(stripped)
                    print(stripped)  # echo to terminal

                    # Parse real port from common dev server output patterns:
                    #   Vite:   ➜  Local:   http://localhost:8081/
                    #   Next:   - Local:    http://localhost:3000
                    #   CRA:    Local:      http://localhost:3000
                    #   Flask:  Running on http://127.0.0.1:5000
                    #   Uvicorn: Uvicorn running on http://0.0.0.0:8000
                    port_match = re.search(
                        r'https?://(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)',
                        stripped,
                    )
                    if port_match:
                        actual_port = int(port_match.group(1))
                        # Found the real port — stop waiting
                        break
                else:
                    time.sleep(0.1)

            if process.poll() is not None and process.returncode != 0:
                output_text = "\n".join(collected_output)
                msg = f"Dev server exited with code {process.returncode}: {output_text[:500]}"
                if on_log:
                    on_log("dev", msg)
                return {
                    "running": False,
                    "port": actual_port,
                    "error": msg,
                }

            # Drain remaining stdout in background so the pipe doesn't block
            import threading

            def _drain(pipe):
                try:
                    for line in pipe:
                        print(line.rstrip())
                except Exception:
                    pass

            if process.stdout:
                threading.Thread(target=_drain, args=(process.stdout,), daemon=True).start()

            msg = f"Dev server started on port {actual_port}"
            print(f"{colors.GREEN}{msg}{colors.END}")
            if on_log:
                on_log("done", f"App running at http://localhost:{actual_port}", {
                    "running": True,
                    "port": actual_port,
                    "pid": process.pid,
                })
            return {
                "running": True,
                "port": actual_port,
                "pid": process.pid,
                "error": None,
            }
        except Exception as e:
            msg = str(e)
            if on_log:
                on_log("dev", msg)
            return {"running": False, "port": port, "error": msg}
    else:
        msg = "No dev command found"
        if on_log:
            on_log("dev", msg)
        return {"running": False, "port": port, "error": msg}
