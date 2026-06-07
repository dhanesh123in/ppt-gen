from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import quote

from ppt_gen.brand import ensure_logo
from ppt_gen.paths import ASSETS_DIR, theme_dir
from ppt_gen.theme.tokens import ThemeTokens, load_theme


def _mermaid_theme_variables(tokens: ThemeTokens) -> dict[str, str | bool]:
    series = tokens.series_colors
    return {
        "darkMode": bool(tokens.mermaid.get("dark_mode", tokens.variant == "dark")),
        "background": tokens.facecolor,
        "primaryColor": series[0] if series else tokens.colors["accent"],
        "primaryTextColor": tokens.foreground,
        "primaryBorderColor": tokens.colors.get("border", series[0]),
        "secondaryColor": series[1] if len(series) > 1 else series[0],
        "secondaryTextColor": tokens.foreground,
        "secondaryBorderColor": tokens.colors.get("border", series[1] if len(series) > 1 else series[0]),
        "tertiaryColor": series[2] if len(series) > 2 else series[0],
        "tertiaryTextColor": tokens.foreground,
        "tertiaryBorderColor": tokens.colors.get("border", series[0]),
        "lineColor": tokens.foreground,
        "textColor": tokens.foreground,
        "fontFamily": tokens.typography["sans"],
        "fontSize": f"{tokens.typography['mermaid']['font_px']}px",
        "noteBkgColor": tokens.colors.get("border", "#3a3a5c"),
        "noteTextColor": tokens.foreground,
        "noteBorderColor": tokens.colors.get("muted", "#6c6c8a"),
    }


def _logo_data_uri(svg: str) -> str:
    return "data:image/svg+xml," + quote(svg.strip())


def _generate_css(tokens: ThemeTokens, *, logo_data_uri: str) -> str:
    t = tokens
    slide = t.typography["slide"]
    header_bg = t.table_header_bg()
    zebra_bg = t.table_zebra_bg()
    accent = t.colors["accent"]
    muted = t.colors["muted"]
    mono = t.typography["mono"]
    caption_px = slide["caption_px"]

    pad = t.layout.get("content_padding_px", 48)
    border = t.colors.get("border", "#3a3a5c")
    width_px = t.canvas["width_px"]
    height_px = t.canvas["height_px"]
    branding = t.raw.get("branding", {})
    logo_h = int(branding.get("logo_height_px", 44))
    logo_top = int(branding.get("logo_top_px", 28))
    logo_right = int(branding.get("logo_right_px", 36))

    return f"""/* @theme {t.name} */
/* generated from tokens.yaml; edit tokens, recompile */
section {{
  background: {t.facecolor};
  color: {t.foreground};
  font-family: {t.typography['sans']};
  font-size: {slide['body_px']}px;
  width: {width_px}px;
  height: {height_px}px;
  padding: {pad}px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  place-content: start start;
}}
section:has(> h1) {{
  justify-content: center;
  place-content: center center;
  text-align: center;
}}
section::before {{
  content: "";
  position: absolute;
  top: {logo_top}px;
  right: {logo_right}px;
  width: {logo_h}px;
  height: {logo_h}px;
  background: url("{logo_data_uri}") no-repeat center / contain;
  pointer-events: none;
}}
h1 {{
  color: {accent};
  font-size: {slide['title_px']}px;
  margin: 0;
}}
section:not(:has(> h1)) > h2:first-of-type {{
  color: {t.foreground};
  font-size: {slide['heading_px']}px;
  margin: 0 0 0.5em 0;
  margin-block: 0 0.5em;
  padding-bottom: 0.35em;
  border-bottom: 2px solid {border};
  width: 100%;
  flex-shrink: 0;
}}
h2 {{
  color: {t.foreground};
  font-size: {slide['heading_px']}px;
  margin-block: 0 0.5em;
}}
strong {{
  color: {accent};
}}
code {{
  font-family: {mono};
  background: {zebra_bg};
}}
table {{
  font-size: {t.table['font_px']}px;
  border-collapse: collapse;
  width: 100%;
}}
table th {{
  background: {header_bg};
  color: {t.foreground};
  padding: 0.4em 0.6em;
}}
table td {{
  border: 1px solid {t.colors.get('border', '#3a3a5c')};
  padding: 0.35em 0.6em;
}}
table tr:nth-child(even) {{
  background: {zebra_bg};
}}
.figure-caption, .table-caption {{
  font-size: {caption_px}px;
  color: {muted};
  margin-top: 0.5em;
}}
footer {{
  position: absolute;
  bottom: 0;
  left: 0;
  color: {muted};
  font-size: 0.55em;
  padding: inherit;
  width: calc(100% - 5em);
}}
"""


def _q(color: str) -> str:
    """Quote hex colors for mplstyle (# starts comments in style files)."""
    return f'"{color}"'


def _generate_mplstyle(tokens: ThemeTokens) -> str:
    plot_typo = tokens.typography["plot"]
    p = tokens.plot
    fg = tokens.foreground
    bg = tokens.facecolor
    border = tokens.colors.get("border", "#3a3a5c")
    cycle = ", ".join(_q(c) for c in tokens.series_colors)

    return f"""font.family: sans-serif
font.size: {plot_typo['base_pt']}
axes.labelsize: {plot_typo['base_pt'] + 2}
axes.titlesize: {plot_typo['title_pt']}
xtick.labelsize: {plot_typo['tick_pt']}
ytick.labelsize: {plot_typo['tick_pt']}
legend.fontsize: {plot_typo['legend_pt']}
lines.linewidth: {p['linewidth']}
lines.markersize: {p['markersize']}
axes.linewidth: 1.2
axes.edgecolor: {_q(border)}
axes.labelcolor: {_q(fg)}
axes.facecolor: {_q(bg)}
figure.facecolor: {_q(bg)}
figure.edgecolor: {_q(bg)}
text.color: {_q(fg)}
xtick.color: {_q(fg)}
ytick.color: {_q(fg)}
grid.color: {_q(border)}
axes.grid: true
grid.alpha: {p['grid_alpha']}
figure.dpi: {p['dpi']}
savefig.dpi: {p['dpi']}
savefig.facecolor: {_q(bg)}
savefig.edgecolor: {_q(bg)}
axes.prop_cycle: cycler('color', [{cycle}])
"""


def _merge_overrides(css: str, theme_name: str) -> str:
    overrides = theme_dir(theme_name) / "overrides.css"
    if overrides.exists():
        css += f"\n/* overrides */\n{overrides.read_text()}\n"
    return css


def compile_theme(name: str) -> dict[str, Path]:
    tokens = load_theme(name)
    out_dir = theme_dir(name)
    out_dir.mkdir(parents=True, exist_ok=True)

    logo_path = ensure_logo(out_dir / "logo.svg", tokens)
    brand_dir = ASSETS_DIR / "brand"
    brand_dir.mkdir(parents=True, exist_ok=True)
    brand_logo = brand_dir / "logo.svg"
    brand_logo.write_text(logo_path.read_text())
    logo_data_uri = _logo_data_uri(logo_path.read_text())

    css_path = out_dir / "theme.css"
    mpl_path = out_dir / "plot.mplstyle"
    mermaid_path = out_dir / "mermaid.json"

    css_content = _merge_overrides(_generate_css(tokens, logo_data_uri=logo_data_uri), name)
    css_path.write_text(css_content)
    mpl_path.write_text(_generate_mplstyle(tokens))

    mermaid_config = {
        "theme": tokens.mermaid.get("theme", "base"),
        "themeVariables": _mermaid_theme_variables(tokens),
    }
    mermaid_path.write_text(json.dumps(mermaid_config, indent=2))

    return {"css": css_path, "mplstyle": mpl_path, "mermaid": mermaid_path, "logo": logo_path}


def main(argv: list[str] | None = None) -> None:
    import sys

    args = argv if argv is not None else sys.argv[1:]
    if len(args) < 2 or args[0] != "compile":
        print("Usage: python -m ppt_gen.theme compile <theme-name>")
        sys.exit(1)
    name = args[1]
    paths = compile_theme(name)
    for kind, path in paths.items():
        print(f"Wrote {kind}: {path}")


if __name__ == "__main__":
    main()
