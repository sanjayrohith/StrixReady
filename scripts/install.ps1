#Requires -Version 5.1
<#
StrixReady CLI installer for Windows (PowerShell).

    irm https://raw.githubusercontent.com/sanjayrohith/StrixReady/main/scripts/install.ps1 | iex

Installs the `strix` CLI directly from GitHub, in an isolated environment via
pipx when available (falling back to `pip install --user`).
#>

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/sanjayrohith/StrixReady.git"

function Write-Info($msg)  { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-WarnMsg($msg) { Write-Host "!! $msg" -ForegroundColor Yellow }
function Write-ErrorMsg($msg) { Write-Host "ERROR $msg" -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------------------
# 1. Find a usable Python 3.10+
# ---------------------------------------------------------------------------
$python = $null
foreach ($candidate in @("python", "python3", "py")) {
    $cmd = Get-Command $candidate -ErrorAction SilentlyContinue
    if ($cmd) {
        try {
            $versionOutput = & $candidate -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null
            if ($versionOutput) {
                $parts = $versionOutput.Split(".")
                $major = [int]$parts[0]
                $minor = [int]$parts[1]
                if ($major -eq 3 -and $minor -ge 10) {
                    $python = $candidate
                    break
                }
            }
        } catch {}
    }
}

if (-not $python) {
    Write-ErrorMsg "Python 3.10+ is required but wasn't found. Install it from https://www.python.org/downloads/ and re-run this script."
}
$pyVersion = & $python --version
Write-Info "Using $pyVersion ($python)"

# ---------------------------------------------------------------------------
# 2. Prefer pipx (isolated env, no dependency conflicts); fall back to pip --user
# ---------------------------------------------------------------------------
$havePipx = [bool](Get-Command pipx -ErrorAction SilentlyContinue)

if (-not $havePipx) {
    Write-Info "pipx not found, installing it with $python -m pip..."
    & $python -m pip install --user --quiet pipx
    if ($LASTEXITCODE -eq 0) {
        & $python -m pipx ensurepath | Out-Null
        $havePipx = $true
    } else {
        Write-WarnMsg "Could not install pipx, falling back to 'pip install --user'."
    }
}

$installed = $false
if ($havePipx) {
    Write-Info "Installing StrixReady CLI with pipx..."
    if (Get-Command pipx -ErrorAction SilentlyContinue) {
        pipx install --force "git+$RepoUrl"
    } else {
        & $python -m pipx install --force "git+$RepoUrl"
    }
    if ($LASTEXITCODE -eq 0) {
        $installed = $true
    } else {
        Write-WarnMsg "pipx install failed, falling back to 'pip install --user'."
    }
}

if (-not $installed) {
    Write-Info "Installing StrixReady CLI with pip --user..."
    & $python -m pip install --user --upgrade "git+$RepoUrl"
}

# ---------------------------------------------------------------------------
# 3. Verify strix is on PATH
# ---------------------------------------------------------------------------
$strixCmd = Get-Command strix -ErrorAction SilentlyContinue
if ($strixCmd) {
    Write-Info "strix is installed and ready ($($strixCmd.Source))"
    Write-Host ""
    Write-Info "Get started:"
    Write-Host "    mkdir `$HOME\.strixready -Force | Out-Null; 'GROQ_API_KEY=gsk_your_key_here' | Out-File `$HOME\.strixready\.env -Encoding utf8"
    Write-Host "    strix scan https://github.com/owner/repo"
} else {
    Write-WarnMsg "strix was installed but isn't on your PATH yet."
    Write-WarnMsg "Open a new terminal, or add the pipx/pip user scripts directory to PATH, then run: strix --help"
}
