"""
commands.py – Deterministic command inference as a fallback.

This module reads config files from the repo profile and infers
install/dev commands without AI. Used when GROQ_API_KEY is not set.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional


def infer_commands(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Infer install and dev commands from the repo profile.

    Returns a dict with:
      install_command, dev_command, port, env_notes
    """
    config_files = profile.get("config_files", {})
    frameworks = profile.get("frameworks", [])
    ports = profile.get("ports", [])

    result: Dict[str, Any] = {
        "install_command": None,
        "dev_command": None,
        "port": ports[0] if ports else None,
        "env_vars": {},
        "env_notes": None,
        "pre_install": None,
        "post_install": None,
    }

    # --- Node.js ---
    if "package.json" in config_files:
        result["install_command"] = "npm install"
        try:
            pj = json.loads(config_files["package.json"])
            scripts = pj.get("scripts", {})
            if "dev" in scripts:
                result["dev_command"] = "npm run dev"
            elif "start" in scripts:
                result["dev_command"] = "npm start"
            elif "serve" in scripts:
                result["dev_command"] = "npm run serve"
            else:
                result["dev_command"] = "npm start"
        except json.JSONDecodeError:
            result["dev_command"] = "npm start"

        if not result["port"]:
            if any(f in frameworks for f in ["Vite", "Vue"]):
                result["port"] = 5173
            else:
                result["port"] = 3000

    # --- Python ---
    elif "requirements.txt" in config_files or "pyproject.toml" in config_files:
        if "requirements.txt" in config_files:
            result["install_command"] = "pip install -r requirements.txt"
        elif "Pipfile" in config_files:
            result["install_command"] = "pipenv install"
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

    # --- Go ---
    elif "go.mod" in config_files:
        result["install_command"] = "go mod download"
        result["dev_command"] = "go run ."
        result["port"] = result["port"] or 8080

    # --- Ruby ---
    elif "Gemfile" in config_files:
        result["install_command"] = "bundle install"
        result["dev_command"] = "bundle exec rails server" if "rails" in (config_files.get("Gemfile", "")).lower() else "ruby app.rb"
        result["port"] = result["port"] or 3000

    return result
