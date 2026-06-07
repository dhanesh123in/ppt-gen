from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

from ppt_gen.paths import THEMES_DIR, theme_dir

_TOKEN_REF = re.compile(r"^\{([^}]+)\}$")


@dataclass
class SlotConfig:
    width_frac: float
    height_frac: float


@dataclass
class ThemeTokens:
    name: str
    variant: str
    canvas: dict[str, Any]
    colors: dict[str, Any]
    typography: dict[str, Any]
    layout: dict[str, Any]
    plot: dict[str, Any]
    table: dict[str, Any]
    mermaid: dict[str, Any]
    slots: dict[str, SlotConfig]
    source_path: Path
    raw: dict[str, Any] = field(repr=False, default_factory=dict)

    @property
    def slide_width_px(self) -> int:
        return int(self.canvas["width_px"])

    @property
    def slide_height_px(self) -> int:
        return int(self.canvas["height_px"])

    @property
    def dpi(self) -> int:
        return int(self.plot["dpi"])

    @property
    def facecolor(self) -> str:
        return str(self.colors["background"])

    @property
    def foreground(self) -> str:
        return str(self.colors["foreground"])

    @property
    def series_colors(self) -> list[str]:
        return [str(c) for c in self.colors["series"]]

    @property
    def figure_width_frac(self) -> float:
        return float(self.layout["figure_width_frac"])

    @property
    def figure_width_pct(self) -> int:
        return round(self.figure_width_frac * 100)

    @property
    def pad_inches(self) -> float:
        return float(self.layout.get("pad_inches", 0.08))

    def resolve_ref(self, value: str) -> str:
        if not isinstance(value, str):
            return str(value)
        match = _TOKEN_REF.match(value.strip())
        if not match:
            return value
        parts = match.group(1).split(".")
        node: Any = self.raw
        for part in parts:
            if part.isdigit():
                node = node[int(part)]
            else:
                node = node[part]
        return str(node)

    def table_header_bg(self) -> str:
        return self.resolve_ref(self.table["header_bg"])

    def table_zebra_bg(self) -> str:
        return self.resolve_ref(self.table["zebra_bg"])

    def slot(self, name: str) -> SlotConfig:
        if name not in self.slots:
            raise KeyError(f"Unknown slot '{name}'. Available: {list(self.slots)}")
        return self.slots[name]

    def mplstyle_path(self) -> Path:
        return theme_dir(self.name) / "plot.mplstyle"


def load_theme(name: str) -> ThemeTokens:
    path = theme_dir(name) / "tokens.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Theme not found: {name} ({path})")
    raw = yaml.safe_load(path.read_text())
    slots_raw = raw.get("slots", {})
    slots = {
        k: SlotConfig(
            width_frac=float(v["width_frac"]),
            height_frac=float(v["height_frac"]),
        )
        for k, v in slots_raw.items()
    }
    return ThemeTokens(
        name=raw["name"],
        variant=raw.get("variant", "dark"),
        canvas=raw["canvas"],
        colors=raw["colors"],
        typography=raw["typography"],
        layout=raw["layout"],
        plot=raw["plot"],
        table=raw["table"],
        mermaid=raw["mermaid"],
        slots=slots,
        source_path=path,
        raw=raw,
    )


def list_themes() -> list[str]:
    if not THEMES_DIR.exists():
        return []
    return sorted(
        p.name for p in THEMES_DIR.iterdir() if p.is_dir() and (p / "tokens.yaml").exists()
    )
