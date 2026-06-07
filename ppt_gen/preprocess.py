from __future__ import annotations

import os
import re
from pathlib import Path

from ppt_gen.cache import content_hash, is_cache_valid, write_cache_meta
from ppt_gen.mermaid import render_mermaid
from ppt_gen.paths import (
    BUILD_DIR,
    CACHE_DIR,
    DIAGRAMS_ASSETS_DIR,
    PLOTS_ASSETS_DIR,
    ensure_dirs,
)
from ppt_gen.registry import get_plot, load_data
from ppt_gen.save import save_figure
from ppt_gen.slide_context import SlideContext
from ppt_gen.table import get_table_data, render_table_markdown
from ppt_gen.theme.compile import compile_theme
from ppt_gen.theme.tokens import ThemeTokens, load_theme

DIRECTIVE_RE = re.compile(
    r"\{\{(plot|table|mermaid):([a-zA-Z0-9_/\-]+)(?:\s*\|\s*([^}]*))?\}\}"
)

OPTION_RE = re.compile(r"(\w+)\s*=\s*([^|]+)")


def _parse_options(options_str: str | None) -> dict[str, str]:
    if not options_str:
        return {}
    return {m.group(1).strip(): m.group(2).strip() for m in OPTION_RE.finditer(options_str)}


def _inject_branding_frontmatter(text: str, tokens: ThemeTokens) -> str:
    branding = tokens.raw.get("branding", {})
    footer = branding.get("footer")
    if not footer or not text.startswith("---"):
        return text

    end = text.find("---", 3)
    if end == -1:
        return text

    front = text[3:end]
    body = text[end + 3 :]
    lines = front.splitlines()
    has_footer = any(line.strip().startswith("footer:") for line in lines)
    if has_footer:
        return text

    insert_at = len(lines)
    for idx, line in enumerate(lines):
        if line.strip().startswith("paginate:"):
            insert_at = idx + 1
            break

    lines.insert(insert_at, f'footer: "{footer}"')
    return f"---\n" + "\n".join(lines) + f"\n---{body}"


def _parse_theme_from_deck(text: str) -> str:
    if not text.startswith("---"):
        return "scientific"
    end = text.find("---", 3)
    if end == -1:
        return "scientific"
    front = text[3:end]
    for line in front.splitlines():
        if line.strip().startswith("theme:"):
            return line.split(":", 1)[1].strip()
    return "scientific"


def _ensure_theme_compiled(theme_name: str) -> ThemeTokens:
    theme_path = Path(__file__).resolve().parent.parent / "themes" / theme_name
    tokens_file = theme_path / "tokens.yaml"
    css_file = theme_path / "theme.css"
    if not css_file.exists() or (
        tokens_file.exists() and tokens_file.stat().st_mtime > css_file.stat().st_mtime
    ):
        compile_theme(theme_name)
    return load_theme(theme_name)


def _render_plot_directive(
    name: str,
    options: dict[str, str],
    tokens: ThemeTokens,
    data: dict,
) -> str:
    slot = options.get("slot", "full")
    ctx = SlideContext(tokens=tokens, slot_name=slot, data=data)
    plot_fn = get_plot(name)
    source_path = Path(__file__).resolve().parent.parent / "plots" / f"{name.replace('/', '_')}.py"
    if not source_path.exists():
        # try nested name
        parts = name.split("/")
        source_path = Path(__file__).resolve().parent.parent / "plots" / f"{parts[-1]}.py"

    tokens_hash = content_hash(tokens.source_path.read_text(), tokens.name)
    data_hash = content_hash({k: str(v.shape) if hasattr(v, "shape") else str(v) for k, v in data.items()})
    plot_hash = content_hash(
        name,
        slot,
        tokens_hash,
        data_hash,
        source_path.read_text() if source_path.exists() else name,
    )
    out_path = PLOTS_ASSETS_DIR / f"{name.replace('/', '_')}.png"
    if not is_cache_valid(CACHE_DIR, f"plot-{name}", expected_hash=plot_hash, output_path=out_path):
        fig = plot_fn(ctx)
        save_figure(fig, ctx, out_path)
        write_cache_meta(CACHE_DIR, f"plot-{name}", hash_value=plot_hash, output=out_path)

    width_pct = tokens.figure_width_pct
    rel = _asset_href(out_path)
    return f"![width:{width_pct}%]({rel})"


def _asset_href(path: Path) -> str:
    return Path(os.path.relpath(path.resolve(), BUILD_DIR.resolve())).as_posix()


def _render_table_directive(
    name: str,
    options: dict[str, str],
    tokens: ThemeTokens,
    data: dict,
) -> str:
    max_rows = int(options["max_rows"]) if "max_rows" in options else None
    df = get_table_data(name, data)
    return render_table_markdown(df, tokens, max_rows=max_rows)


def _render_mermaid_directive(name: str, tokens: ThemeTokens) -> str:
    out_path = DIAGRAMS_ASSETS_DIR / f"{name}.svg"
    mermaid_src = Path(__file__).resolve().parent.parent / "mermaid" / f"{name}.mmd"
    tokens_hash = content_hash(tokens.source_path.read_text(), tokens.name)
    src_hash = content_hash(mermaid_src.read_text() if mermaid_src.exists() else name)
    diagram_hash = content_hash(name, tokens_hash, src_hash)

    if not is_cache_valid(
        CACHE_DIR, f"mermaid-{name}", expected_hash=diagram_hash, output_path=out_path
    ):
        render_mermaid(name, tokens, out_path)
        write_cache_meta(CACHE_DIR, f"mermaid-{name}", hash_value=diagram_hash, output=out_path)

    width_pct = tokens.figure_width_pct
    rel = _asset_href(out_path)
    return f"![width:{width_pct}%]({rel})"


def preprocess_deck(deck_path: Path, *, theme_name: str | None = None) -> Path:
    ensure_dirs()
    text = deck_path.read_text()
    theme = theme_name or _parse_theme_from_deck(text)
    tokens = _ensure_theme_compiled(theme)
    data = load_data()

    def replacer(match: re.Match[str]) -> str:
        kind, name, opts_raw = match.group(1), match.group(2), match.group(3)
        options = _parse_options(opts_raw)
        if kind == "plot":
            return _render_plot_directive(name, options, tokens, data)
        if kind == "table":
            return _render_table_directive(name, options, tokens, data)
        if kind == "mermaid":
            return _render_mermaid_directive(name, tokens)
        return match.group(0)

    processed = DIRECTIVE_RE.sub(replacer, text)
    processed = _inject_branding_frontmatter(processed, tokens)
    BUILD_DIR.mkdir(parents=True, exist_ok=True)
    out_path = BUILD_DIR / deck_path.name
    out_path.write_text(processed)
    return out_path
