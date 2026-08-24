"""
CLI entry-point for Strix.

Commands:
  strix scan <github_url>       – Clone, analyse, install deps, run dev server
  strix gui                     – Start the backend API for the React frontend
  strix doctor                  – Health-check running services
"""

import subprocess
import signal
import sys
from pathlib import Path

import typer
from rich.console import Console

from backend import analyzer, generator, health

app = typer.Typer()
console = Console()


@app.command()
def scan(
    github_url: str,
    os_name: str = typer.Option("linux", "--os", help="Target OS: linux, macos, windows"),
):
    """Scan a GitHub repo, detect stack, and run the local dev server."""

    console.print("[bold green]Starting analysis of repository:[/]", github_url)

    # 1. Clone & analyse locally
    try:
        with console.status("[bold yellow]Cloning and analysing repo..."):
            profile = analyzer.analyze_repo(github_url, user_os=os_name)
    except (ValueError, RuntimeError, subprocess.CalledProcessError) as exc:
        console.print(f"[bold red]Analysis failed:[/] {exc}")
        raise typer.Exit(code=1)

    console.print(
        f"[bold cyan]Detected languages:[/] {list(profile.get('languages', {}).keys())}  "
        f"[bold cyan]Frameworks:[/] {profile.get('frameworks', [])}"
    )

    # 2. Get commands from AI
    console.print("[bold green]Getting setup commands from AI...[/]")
    with console.status("[bold yellow]Contacting Groq..."):
        commands = generator.generate(profile)

    local_path = profile.get("local_path", ".")

    # 3. Show what we're about to do
    console.print("\n[bold blue]═══ Setup Plan ═══[/]")
    if commands.get("pre_install"):
        console.print(f"  [yellow]Pre-install:[/] {commands['pre_install']}")
    console.print(f"  [yellow]Install:[/]     {commands.get('install_command', 'N/A')}")
    if commands.get("post_install"):
        console.print(f"  [yellow]Post-install:[/] {commands['post_install']}")
    console.print(f"  [yellow]Dev server:[/]  {commands.get('dev_command', 'N/A')}")
    console.print(f"  [yellow]Port:[/]        {commands.get('port', 'unknown')}")
    if commands.get("env_notes"):
        console.print(f"  [yellow]Notes:[/]       {commands['env_notes']}")
    console.print()

    # 4. Execute locally
    console.print("[bold green]Running setup...[/]")
    result = generator.run_local(local_path, commands)

    if result.get("running"):
        port = result.get("port", "unknown")
        console.print(f"\n[bold green]✓ Dev server is running at:[/] http://localhost:{port}")
        console.print(f"[bold blue]  Project dir:[/] {local_path}")
        console.print(f"[bold blue]  PID:[/] {result.get('pid', 'N/A')}")
        console.print("[bold yellow]  Press Ctrl+C to stop.[/]\n")

        # Keep the CLI alive until user kills it
        try:
            signal.pause()
        except (KeyboardInterrupt, AttributeError):
            # AttributeError: signal.pause() not available on Windows
            try:
                while True:
                    pass
            except KeyboardInterrupt:
                pass
        console.print("\n[bold yellow]Stopped.[/]")
    else:
        console.print(f"\n[bold red]✗ Failed:[/] {result.get('error', 'unknown error')}")
        console.print(f"[bold blue]  Project dir:[/] {local_path}")
        raise typer.Exit(code=1)


@app.command()
def gui(port: int = 8000):
    """Start the Strix backend API (default port 8000)."""
    console.print(f"[bold green]Starting Strix API at[/] http://localhost:{port}")
    try:
        subprocess.run(
            ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", str(port), "--reload"],
            check=True,
        )
    except KeyboardInterrupt:
        console.print("\n[bold yellow]GUI stopped.[/]")
    except FileNotFoundError:
        console.print("[bold red]uvicorn not found – run: pip install uvicorn[/]")
        raise typer.Exit(code=1)


@app.command()
def doctor():
    """Check health of running application and services."""
    console.print("[bold blue]Running health checks...[/]")
    ok = health.check_all()
    if ok:
        console.print("[bold green]All systems healthy![/]")
    else:
        console.print("[bold red]Some services are unhealthy. See logs above.[/]")


if __name__ == "__main__":
    app()


def main():
    app()
