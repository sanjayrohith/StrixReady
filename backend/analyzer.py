import os
import subprocess
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List, Callable

from backend.utils import colors

# Type alias for the optional log callback
LogCallback = Optional[Callable[[str, str, Optional[dict]], None]]


# --- Configuration ---
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")


def parse_repo_url(repo_url: str) -> Optional[str]:
    """Extracts 'owner/repo' from a GitHub URL.

    Also handles malformed double-prefix URLs such as
    ``https://github.com/https://github.com/owner/repo``.
    """
    try:
        if "github.com/" not in repo_url:
            if len(repo_url.split("/")) == 2:
                return repo_url
            raise ValueError("Invalid format")

        raw = repo_url
        while raw.count("github.com/") > 1:
            raw = raw.split("github.com/", 1)[1]

        parts = raw.split("github.com/")[-1].split("/")
        owner = parts[0]
        repo = parts[1].replace(".git", "") if len(parts) > 1 else ""
        if not owner or not repo:
            return None
        return f"{owner}/{repo}"
    except Exception:
        return None


def _build_clone_url(repo_url: str) -> str:
    """Normalise any GitHub URL into an HTTPS clone URL."""
    repo_path = parse_repo_url(repo_url)
    if not repo_path:
        raise ValueError(f"Cannot parse GitHub URL: {repo_url}")
    return f"https://github.com/{repo_path}.git"


# ---------------------------------------------------------------------------
# Clone
# ---------------------------------------------------------------------------

def clone_repo(repo_url: str, target_dir: Optional[str] = None, on_log: LogCallback = None) -> Path:
    """Clone ``repo_url`` into ``target_dir`` (or a temp directory).

    Returns the absolute Path to the cloned repo on disk.
    """
    clone_url = _build_clone_url(repo_url)
    repo_path = parse_repo_url(repo_url)
    repo_name = repo_path.split("/")[-1] if repo_path else "repo"

    if target_dir:
        dest = Path(target_dir) / repo_name
    else:
        dest = Path(tempfile.mkdtemp(prefix="strix_")) / repo_name

    if dest.exists():
        msg = f"Directory {dest} already exists – reusing."
        print(f"{colors.YELLOW}{msg}{colors.END}")
        if on_log:
            on_log("clone", msg)
        return dest.resolve()

    msg = f"Cloning {clone_url} → {dest}"
    print(f"{colors.BLUE}{msg}{colors.END}")
    if on_log:
        on_log("clone", msg)

    env = os.environ.copy()
    if GITHUB_TOKEN:
        env["GIT_ASKPASS"] = "echo"
        clone_url = clone_url.replace(
            "https://", f"https://x-access-token:{GITHUB_TOKEN}@"
        )

    subprocess.run(
        ["git", "clone", "--depth", "1", clone_url, str(dest)],
        check=True,
        capture_output=True,
        text=True,
        env=env,
    )
    msg = "Cloned successfully."
    print(f"{colors.GREEN}{msg}{colors.END}")
    if on_log:
        on_log("clone", msg)
    return dest.resolve()


# ---------------------------------------------------------------------------
# Local file scanning
# ---------------------------------------------------------------------------

_CONFIG_FILES = [
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "requirements.txt",
    "pyproject.toml",
    "Pipfile",
    "Makefile",
    "Gemfile",
    "go.mod",
    "pom.xml",
    "build.gradle",
    ".env",
    ".env.example",
    "tsconfig.json",
    "vite.config.ts",
    "vite.config.js",
    "next.config.js",
    "next.config.mjs",
]


def _read_if_exists(repo_dir: Path, name: str) -> Optional[str]:
    p = repo_dir / name
    if p.is_file():
        try:
            return p.read_text(errors="replace")
        except Exception:
            return None
    return None


def _detect_languages(repo_dir: Path) -> Dict[str, int]:
    """Walk the repo and count files by extension."""
    ext_map = {
        ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
        ".jsx": "JavaScript", ".tsx": "TypeScript",
        ".java": "Java", ".go": "Go", ".rb": "Ruby",
        ".rs": "Rust", ".php": "PHP", ".cs": "C#",
        ".cpp": "C++", ".c": "C", ".swift": "Swift",
        ".kt": "Kotlin", ".scala": "Scala",
    }
    counts: Dict[str, int] = {}
    for f in repo_dir.rglob("*"):
        if f.is_file() and ".git" not in f.parts:
            lang = ext_map.get(f.suffix.lower())
            if lang:
                counts[lang] = counts.get(lang, 0) + 1
    return counts


def _detect_frameworks(config_files: Dict[str, str]) -> tuple[List[str], List[int]]:
    """Return (frameworks, ports) based on config file contents."""
    frameworks: List[str] = []
    ports: List[int] = []

    pkg = config_files.get("package.json")
    if pkg:
        try:
            pkg_json = json.loads(pkg)
            deps = {
                **pkg_json.get("dependencies", {}),
                **pkg_json.get("devDependencies", {}),
            }
            if "next" in deps:
                frameworks.append("Next.js"); ports.append(3000)
            elif "react-scripts" in deps:
                frameworks.append("Create React App"); ports.append(3000)
            elif "nuxt" in deps:
                frameworks.append("Nuxt"); ports.append(3000)
            elif "vite" in deps:
                frameworks.append("Vite"); ports.append(5173)
            elif "express" in deps:
                frameworks.append("Express"); ports.append(3000)
            elif "vue" in deps:
                frameworks.append("Vue"); ports.append(5173)
            if "react" in deps and "Next.js" not in frameworks and "Create React App" not in frameworks:
                frameworks.append("React")
        except json.JSONDecodeError:
            pass

    req_text = (config_files.get("requirements.txt") or "") + (
        config_files.get("pyproject.toml") or ""
    )
    if req_text:
        lower = req_text.lower()
        if "django" in lower:
            frameworks.append("Django"); ports.append(8000)
        elif "flask" in lower:
            frameworks.append("Flask"); ports.append(5000)
        elif "fastapi" in lower:
            frameworks.append("FastAPI"); ports.append(8000)

    return frameworks, ports


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def analyze_repo(repo_url: str, user_os: str = "linux", on_log: LogCallback = None) -> Dict[str, Any]:
    """Clone a GitHub repository locally and return a structured profile.

    Parameters
    ----------
    repo_url : str
        Full GitHub URL (e.g. ``https://github.com/owner/repo``).
    user_os : str
        The operating system the user is running (``linux``, ``macos``, ``windows``).
    on_log : callable, optional
        Callback ``(step, message, data)`` for live status streaming.

    Returns
    -------
    dict
        A profile dict consumed by ``generator.generate()``.
    """
    repo_path_str = parse_repo_url(repo_url)
    if not repo_path_str:
        raise ValueError(
            f"Invalid GitHub URL '{repo_url}'. "
            "Use the format https://github.com/owner/repo"
        )

    # 1. Clone
    local_path = clone_repo(repo_url, on_log=on_log)

    # 2. Read config files from disk
    if on_log:
        on_log("analyze", "Reading config files...")
    config_files: Dict[str, str] = {}
    for fname in _CONFIG_FILES:
        content = _read_if_exists(local_path, fname)
        if content:
            config_files[fname] = content

    # 3. Read README
    readme = ""
    for rname in ["README.md", "readme.md", "README.rst", "README"]:
        content = _read_if_exists(local_path, rname)
        if content:
            readme = content
            break

    # 4. Detect languages & frameworks
    languages = _detect_languages(local_path)
    frameworks, ports = _detect_frameworks(config_files)

    repo_name = repo_path_str.split("/")[-1]

    profile: Dict[str, Any] = {
        "url": repo_url,
        "repo_path": repo_path_str,
        "name": repo_name,
        "local_path": str(local_path),
        "os": user_os,
        "languages": languages,
        "frameworks": frameworks,
        "ports": ports,
        "config_files": config_files,
        "readme": readme,
    }

    msg = (
        f"Analysis complete – "
        f"languages: {list(languages.keys())}, "
        f"frameworks: {frameworks}, "
        f"cloned to: {local_path}"
    )
    print(f"{colors.GREEN}{msg}{colors.END}")
    if on_log:
        on_log("analyze", msg, {
            "languages": list(languages.keys()),
            "frameworks": frameworks,
            "ports": ports,
        })
    return profile