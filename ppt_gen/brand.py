from __future__ import annotations

import hashlib
import random
from pathlib import Path

from ppt_gen.theme.tokens import ThemeTokens


def _seed_from_tokens(tokens: ThemeTokens) -> int:
    digest = hashlib.sha256(tokens.name.encode()).hexdigest()
    return int(digest[:8], 16)


def _build_logo_svg(tokens: ThemeTokens) -> str:
    rng = random.Random(_seed_from_tokens(tokens))
    accent = tokens.colors["accent"]
    series = tokens.series_colors
    border = tokens.colors.get("border", "#3a3a5c")
    bg = tokens.facecolor

    card_w, card_h = 28, 34
    cards = [
        (series[0], 2 + rng.uniform(0, 1.5), 12 + rng.uniform(0, 1.5)),
        (accent, 10 + rng.uniform(0, 1.5), 7 + rng.uniform(0, 1.5)),
        (
            series[1] if len(series) > 1 else accent,
            18 + rng.uniform(0, 1.5),
            2 + rng.uniform(0, 1.5),
        ),
    ]

    shapes = []
    for fill, x, y in cards:
        shapes.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{card_w}" height="{card_h}" rx="4" '
            f'fill="{fill}" stroke="{border}" stroke-width="1.5"/>'
        )
        shapes.append(
            f'<line x1="{x + 5:.1f}" y1="{y + 8:.1f}" x2="{x + 20:.1f}" y2="{y + 8:.1f}" '
            f'stroke="{bg}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>'
        )
        shapes.append(
            f'<line x1="{x + 5:.1f}" y1="{y + 14:.1f}" x2="{x + 17:.1f}" y2="{y + 14:.1f}" '
            f'stroke="{bg}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>'
        )

    body = "\n  ".join(shapes)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img" '
        'aria-label="ppt-gen logo">\n'
        f"  {body}\n"
        "</svg>\n"
    )


def write_logo(path: Path, tokens: ThemeTokens) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(_build_logo_svg(tokens))
    return path


def ensure_logo(path: Path, tokens: ThemeTokens) -> Path:
    return write_logo(path, tokens)
