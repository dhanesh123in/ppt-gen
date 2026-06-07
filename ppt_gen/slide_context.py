from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import matplotlib.pyplot as plt
from matplotlib.axes import Axes
from matplotlib.figure import Figure

from ppt_gen.theme.tokens import SlotConfig, ThemeTokens


@dataclass
class SlideContext:
    tokens: ThemeTokens
    slot_name: str = "full"
    data: dict[str, Any] = field(default_factory=dict)

    @property
    def slot(self) -> SlotConfig:
        return self.tokens.slot(self.slot_name)

    def color(self, index: int) -> str:
        colors = self.tokens.series_colors
        return colors[index % len(colors)]

    def figure(
        self,
        *,
        nrows: int = 1,
        ncols: int = 1,
    ) -> tuple[Figure, Axes] | tuple[Figure, Any]:
        w_in, h_in = self._inches_from_slot()
        style_path = self.tokens.mplstyle_path()
        if style_path.exists():
            plt.style.use(str(style_path))
        fig, axes = plt.subplots(
            nrows,
            ncols,
            figsize=(w_in, h_in),
            facecolor=self.tokens.facecolor,
        )
        if nrows == 1 and ncols == 1:
            ax = axes
            self._style_axes(ax)
            return fig, ax
        flat = axes.flatten() if hasattr(axes, "flatten") else [axes]
        for ax in flat:
            self._style_axes(ax)
        return fig, axes

    def _inches_from_slot(self) -> tuple[float, float]:
        w_px = self.tokens.slide_width_px * self.slot.width_frac
        h_px = self.tokens.slide_height_px * self.slot.height_frac
        dpi = self.tokens.dpi
        return w_px / dpi, h_px / dpi

    def _style_axes(self, ax: Axes) -> None:
        ax.set_facecolor(self.tokens.facecolor)
        for spine in ax.spines.values():
            spine.set_color(self.tokens.colors.get("border", "#3a3a5c"))
