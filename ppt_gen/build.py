from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from ppt_gen.paths import DECKS_DIR, OUTPUT_DIR, ROOT, ensure_dirs
from ppt_gen.preprocess import preprocess_deck
from ppt_gen.theme.compile import compile_theme
from ppt_gen.theme.tokens import list_themes


def _deck_path(name: str) -> Path:
    stem = name.replace(".md", "")
    path = DECKS_DIR / f"{stem}.md"
    if not path.exists():
        raise FileNotFoundError(f"Deck not found: {path}")
    return path


def _marp_bin() -> str:
    local = ROOT / "node_modules" / ".bin" / "marp"
    if local.exists():
        return str(local)
    found = shutil.which("marp")
    if found:
        return found
    raise RuntimeError(
        "Marp CLI not found. Run: npm install\n"
        "PDF/PPTX export also requires Chrome, Edge, or Firefox."
    )


def compile_all_themes() -> None:
    for name in list_themes():
        compile_theme(name)


def render_deck(name: str, fmt: str = "pdf", *, theme: str | None = None) -> Path:
    ensure_dirs()
    deck_path = _deck_path(name)
    built = preprocess_deck(deck_path, theme_name=theme)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUTPUT_DIR / f"{deck_path.stem}.{fmt}"
    marp = _marp_bin()
    theme_name = theme or "scientific"
    theme_css = ROOT / "themes" / theme_name / "theme.css"
    cmd = [
        marp,
        str(built),
        "--theme-set",
        str(theme_css.parent),
    ]
    if fmt == "pdf":
        cmd.append("--pdf")
    elif fmt == "pptx":
        cmd.append("--pptx")
    cmd.extend(["-o", str(out), "--allow-local-files", "--no-stdin"])
    subprocess.run(cmd, cwd=ROOT, check=True)
    return out


def build_all(name: str, fmt: str = "pdf", *, theme: str | None = None) -> Path:
    compile_all_themes()
    return render_deck(name, fmt=fmt, theme=theme)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="ppt-gen deck builder")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("compile-themes", help="Compile all themes from tokens.yaml")

    p_render = sub.add_parser("render", help="Preprocess and render a deck")
    p_render.add_argument("deck", help="Deck name (without .md)")
    p_render.add_argument("--format", "-f", default="pdf", choices=["pdf", "pptx", "html"])
    p_render.add_argument("--theme", default=None)

    p_all = sub.add_parser("all", help="Compile themes, preprocess, render")
    p_all.add_argument("deck", help="Deck name (without .md)")
    p_all.add_argument("--format", "-f", default="pdf", choices=["pdf", "pptx", "html"])
    p_all.add_argument("--theme", default=None)

    p_pre = sub.add_parser("preprocess", help="Expand directives only")
    p_pre.add_argument("deck")
    p_pre.add_argument("--theme", default=None)

    args = parser.parse_args(argv)

    try:
        if args.command == "compile-themes":
            compile_all_themes()
            print("Themes compiled.")
        elif args.command == "preprocess":
            path = preprocess_deck(_deck_path(args.deck), theme_name=args.theme)
            print(f"Wrote {path}")
        elif args.command == "render":
            out = render_deck(args.deck, fmt=args.format, theme=args.theme)
            print(f"Wrote {out}")
        elif args.command == "all":
            out = build_all(args.deck, fmt=args.format, theme=args.theme)
            print(f"Wrote {out}")
    except (FileNotFoundError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
