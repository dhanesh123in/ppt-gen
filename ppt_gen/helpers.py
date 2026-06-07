from __future__ import annotations

from matplotlib.axes import Axes
from matplotlib.figure import Figure
from matplotlib.ticker import FuncFormatter, MaxNLocator

from ppt_gen.theme.tokens import ThemeTokens


def simplify_ticks(ax: Axes, *, max_x: int = 6, max_y: int = 5) -> None:
    ax.xaxis.set_major_locator(MaxNLocator(nbins=max_x, integer=False, min_n_ticks=3))
    ax.yaxis.set_major_locator(MaxNLocator(nbins=max_y, integer=False, min_n_ticks=3))


def format_y_ticks_compact(ax: Axes, decimals: int = 1) -> None:
    ax.yaxis.set_major_formatter(
        FuncFormatter(lambda value, _pos: f"{value:.{decimals}f}")
    )


def pad_ylim(ax: Axes, fraction: float = 0.12) -> None:
    ymin, ymax = ax.get_ylim()
    span = ymax - ymin or 1.0
    pad = span * fraction
    ax.set_ylim(ymin - pad, ymax + pad)


def place_legend_clear(ax: Axes, *, position: str = "outside-right") -> None:
    """Place legend where it won't cover data lines."""
    opts = {
        "outside-right": {"loc": "center left", "bbox_to_anchor": (1.01, 0.5)},
        "upper-right": {"loc": "upper right", "bbox_to_anchor": (0.97, 0.97)},
        "upper-left": {"loc": "upper left", "bbox_to_anchor": (0.03, 0.97)},
        "below": {"loc": "upper center", "bbox_to_anchor": (0.5, -0.22), "ncol": 1},
    }
    kw = opts.get(position, opts["outside-right"])
    legend = ax.legend(framealpha=0.92, borderaxespad=0.4, **kw)
    if legend:
        legend.get_frame().set_facecolor(ax.get_facecolor())
        legend.get_frame().set_edgecolor(ax.spines["bottom"].get_edgecolor())


def apply_plot_margins(fig: Figure, tokens: ThemeTokens) -> None:
    margins = tokens.plot.get("margins")
    if margins:
        fig.subplots_adjust(
            left=margins.get("left", 0.14),
            right=margins.get("right", 0.88),
            top=margins.get("top", 0.90),
            bottom=margins.get("bottom", 0.18),
        )


def finalize_line_chart(
    fig: Figure,
    ax: Axes,
    tokens: ThemeTokens,
    *,
    legend_position: str = "outside-right",
) -> None:
    format_y_ticks_compact(ax)
    pad_ylim(ax)
    simplify_ticks(ax, max_x=6, max_y=4)
    place_legend_clear(ax, position=legend_position)
    apply_plot_margins(fig, tokens)
    ax.set_xlabel(ax.get_xlabel(), labelpad=4)
    ax.set_ylabel(ax.get_ylabel(), labelpad=10)
    ax.tick_params(axis="both", which="major", pad=3)
    ax.set_title(ax.get_title(), pad=10)


def annotate_highlight(ax: Axes, x: float, y: float, text: str) -> None:
    ax.annotate(
        text,
        xy=(x, y),
        xytext=(10, 10),
        textcoords="offset points",
        fontsize=ax.xaxis.get_label().get_size(),
        fontweight="bold",
        arrowprops=dict(arrowstyle="->", lw=1.5),
    )
