from __future__ import annotations

import matplotlib.pyplot as plt

from ppt_gen.slide_context import SlideContext

try:
    import seaborn as sns
except ImportError:  # pragma: no cover
    sns = None


def apply_slide_style(ctx: SlideContext) -> None:
    style_path = ctx.tokens.mplstyle_path()
    if style_path.exists():
        plt.style.use(str(style_path))
    if sns is not None:
        sns.set_theme(
            style="darkgrid" if ctx.tokens.variant == "dark" else "whitegrid",
            context="talk",
            font_scale=1.15,
            palette=ctx.tokens.series_colors,
        )
