#!/bin/sh
# StrixReady CLI installer for Linux and macOS.
#
#   curl -fsSL https://raw.githubusercontent.com/sanjayrohith/StrixReady/main/scripts/install.sh | sh
#
# Installs the `strix` CLI directly from GitHub, in an isolated environment
# via pipx when available (falling back to `pip install --user`).

set -eu

REPO_URL="https://github.com/sanjayrohith/StrixReady.git"

info()  { printf '\033[1;34m==>\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m!!\033[0m %s\n' "$1" >&2; }
error() { printf '\033[1;31mERROR\033[0m %s\n' "$1" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Find a usable Python 3.10+
# ---------------------------------------------------------------------------
PYTHON=""
for candidate in python3 python; do
    if command -v "$candidate" >/dev/null 2>&1; then
        version="$("$candidate" -c 'import sys; print("%d.%d" % sys.version_info[:2])' 2>/dev/null || echo 0.0)"
        major="$(echo "$version" | cut -d. -f1)"
        minor="$(echo "$version" | cut -d. -f2)"
        if [ "$major" -eq 3 ] && [ "$minor" -ge 10 ]; then
            PYTHON="$candidate"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    error "Python 3.10+ is required but wasn't found. Install it from https://www.python.org/downloads/ and re-run this script."
fi
info "Using $($PYTHON --version) ($PYTHON)"

# ---------------------------------------------------------------------------
# 2. Prefer pipx (isolated env, no dependency conflicts); fall back to pip --user
# ---------------------------------------------------------------------------
if ! command -v pipx >/dev/null 2>&1; then
    info "pipx not found, installing it with $PYTHON -m pip..."
    if "$PYTHON" -m pip install --user --quiet pipx; then
        "$PYTHON" -m pipx ensurepath >/dev/null 2>&1 || true
    else
        warn "Could not install pipx, falling back to 'pip install --user'."
    fi
fi

installed=false
if command -v pipx >/dev/null 2>&1 || "$PYTHON" -m pipx --version >/dev/null 2>&1; then
    info "Installing StrixReady CLI with pipx..."
    if command -v pipx >/dev/null 2>&1; then
        pipx_cmd="pipx"
    else
        pipx_cmd="$PYTHON -m pipx"
    fi
    if $pipx_cmd install --force "git+${REPO_URL}"; then
        installed=true
    else
        warn "pipx install failed, falling back to 'pip install --user'."
    fi
fi

if [ "$installed" = false ]; then
    info "Installing StrixReady CLI with pip --user..."
    "$PYTHON" -m pip install --user --upgrade "git+${REPO_URL}"
fi

# ---------------------------------------------------------------------------
# 3. Verify strix is on PATH
# ---------------------------------------------------------------------------
if command -v strix >/dev/null 2>&1; then
    info "strix is installed and ready ($(command -v strix))"
    echo
    info "Get started:"
    echo "    mkdir -p ~/.strixready && echo 'GROQ_API_KEY=gsk_your_key_here' > ~/.strixready/.env   # or export GROQ_API_KEY=..."
    echo "    strix scan https://github.com/owner/repo"
else
    warn "strix was installed but isn't on your PATH yet."
    warn "Open a new terminal, or add the pipx/pip user bin directory to PATH, then run: strix --help"
fi
