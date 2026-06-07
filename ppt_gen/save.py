from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.figure import Figure

from ppt_gen.slide_context import SlideContext


def save_figure(fig: Figure, ctx: SlideContext, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(
        path,
        dpi=ctx.tokens.dpi,
        facecolor=ctx.tokens.facecolor,
        edgecolor="none",
        bbox_inches="tight",
        pad_inches=ctx.tokens.pad_inches,
    )
    plt.close(fig)
    return path
