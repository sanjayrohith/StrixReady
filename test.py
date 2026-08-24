#!/usr/bin/env python3
"""
Quick test script: clone & analyze a GitHub repo, call the Groq model
with the same prompt the generator uses, save the raw model output to
AI.raw.txt, and write any parsed artifacts to disk.

Usage:
  python test.py https://github.com/owner/repo

If `GROQ_API_KEY` is not set, this script will fall back to the
deterministic artifacts provided by `generator._fallback_artifacts()`
and will write a short note to `AI.raw.txt`.
"""
import os
import sys
import json
import traceback
from pathlib import Path

from backend import analyzer, generator

try:
    from groq import Groq
except Exception:
    Groq = None


def main():
    if len(sys.argv) < 2:
        print("Usage: python test.py <github_repo_url>")
        sys.exit(2)

    repo_url = sys.argv[1]
    try:
        profile = analyzer.analyze_repo(repo_url)
    except Exception as e:
        print(f"analyze_repo failed: {e}")
        traceback.print_exc()
        sys.exit(1)

    # Determine output directory (use cloned path if available)
    output_dir = Path(profile.get("local_path") or Path.cwd() / "strix-output" / profile.get("name", "repo"))
    output_dir.mkdir(parents=True, exist_ok=True)

    # Build the user prompt using the same helper in generator
    try:
        user_prompt = generator._build_user_prompt(profile)
    except Exception:
        user_prompt = "(failed to build prompt)"

    groq_key = os.environ.get("GROQ_API_KEY")
    raw_output = None

    if not groq_key or Groq is None:
        note = "GROQ_API_KEY not set or groq library not available. Using fallback artifacts."
        print(note)
        raw_output = note
        artifacts = generator._fallback_artifacts(profile)
        # write fallback artifacts
        generator.write_artifacts(str(output_dir), artifacts)

    else:
        try:
            client = Groq(api_key=groq_key)
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": generator.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=4096,
            )
            # Extract raw string
            raw_output = completion.choices[0].message.content or ""

            # Save raw output
            raw_path = output_dir / "AI.raw.txt"
            raw_path.write_text(raw_output)
            print(f"Wrote raw AI output to: {raw_path}")

            # Try to clean and parse JSON (reuse same logic as generator)
            cleaned = raw_output.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
                if isinstance(parsed, dict) and "Dockerfile" in parsed:
                    artifacts = parsed
                    generator.write_artifacts(str(output_dir), artifacts)
                    print(f"Parsed JSON artifacts and wrote {len(artifacts)} files to {output_dir}")
                else:
                    # Not the expected structured JSON
                    fallback = {
                        "Dockerfile": "# AI output was not valid JSON; see AI.raw.txt\n",
                        "docker-compose.dev.yml": "# AI output was not valid JSON; see AI.raw.txt\n",
                        ".env.example": "# AI output was not valid JSON; see AI.raw.txt\n",
                        "PROJECT.md": raw_output,
                    }
                    generator.write_artifacts(str(output_dir), fallback)
                    print("AI did not return structured JSON; wrote raw output into PROJECT.md")
            except json.JSONDecodeError:
                fallback = {
                    "Dockerfile": "# AI output was not valid JSON; see AI.raw.txt\n",
                    "docker-compose.dev.yml": "# AI output was not valid JSON; see AI.raw.txt\n",
                    ".env.example": "# AI output was not valid JSON; see AI.raw.txt\n",
                    "PROJECT.md": raw_output,
                }
                generator.write_artifacts(str(output_dir), fallback)
                print("AI did not return structured JSON; wrote raw output into PROJECT.md")

        except Exception as e:
            print(f"Error calling Groq: {e}")
            traceback.print_exc()
            raw_output = f"Groq call failed: {e}\n" + (raw_output or "")
            raw_path = output_dir / "AI.raw.txt"
            raw_path.write_text(raw_output)
            artifacts = generator._fallback_artifacts(profile)
            generator.write_artifacts(str(output_dir), artifacts)

    # Ensure raw output exists on disk even for fallback path
    if raw_output is not None:
        raw_path = output_dir / "AI.raw.txt"
        raw_path.write_text(raw_output)
        print(f"AI raw output written to: {raw_path}")

    print("Done. Check the output directory:", output_dir)


if __name__ == "__main__":
    main()
