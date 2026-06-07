from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from ppt_gen.paths import MERMAID_DIR, ROOT, theme_dir
from ppt_gen.theme.tokens import ThemeTokens


def mermaid_source_path(name: str) -> Path:
    path = MERMAID_DIR / f"{name}.mmd"
    if not path.exists():
        raise FileNotFoundError(f"Mermaid diagram not found: {path}")
    return path


def _mmdc_bin() -> str | None:
    local = ROOT / "node_modules" / ".bin" / "mmdc"
    if local.exists():
        return str(local)
    return shutil.which("mmdc")


def wrap_mermaid_source(source: str, tokens: ThemeTokens) -> str:
    mermaid_json = theme_dir(tokens.name) / "mermaid.json"
    if mermaid_json.exists():
        config = json.loads(mermaid_json.read_text())
    else:
        config = {"theme": "base", "themeVariables": {}}
    init = {
        "theme": config.get("theme", "base"),
        "themeVariables": config.get("themeVariables", {}),
    }
    init_line = f"%%{{init: {json.dumps(init)}}}%%\n"
    if source.strip().startswith("%%{init"):
        return source
    return init_line + source


def render_mermaid(
    name: str,
    tokens: ThemeTokens,
    output_path: Path,
) -> Path:
    source_path = mermaid_source_path(name)
    wrapped = wrap_mermaid_source(source_path.read_text(), tokens)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    mmdc = _mmdc_bin()
    if not mmdc:
        raise RuntimeError(
            "mmdc not found. Run: npm install\n"
            "(@mermaid-js/mermaid-cli is listed in package.json devDependencies)"
        )

    tmp = output_path.with_suffix(".mmd.tmp")
    tmp.write_text(wrapped)
    try:
        result = subprocess.run(
            [
                mmdc,
                "-i",
                str(tmp),
                "-o",
                str(output_path),
                "-b",
                tokens.facecolor,
            ],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            stderr = result.stderr.strip() or result.stdout.strip()
            raise RuntimeError(f"mmdc failed for diagram '{name}': {stderr}")
    finally:
        tmp.unlink(missing_ok=True)

    return output_path
