from ppt_gen.helpers import finalize_line_chart
from ppt_gen.registry import register
from ppt_gen.slide_context import SlideContext


@register("revenue_trend")
def render(ctx: SlideContext):
    fig, ax = ctx.figure()
    df = ctx.data.get("quarterly")
    if df is None:
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        revenue = [4.2, 4.5, 4.8, 5.1, 5.4, 5.9]
    else:
        months = df["month"].tolist()
        revenue = df["revenue_m"].tolist()

    ax.plot(
        months,
        revenue,
        label="Revenue",
        color=ctx.color(0),
        marker="o",
        linewidth=ctx.tokens.plot["linewidth"],
        markersize=ctx.tokens.plot["markersize"],
    )
    ax.set_title("Revenue trend")
    ax.set_xlabel("Month")
    ax.set_ylabel("Revenue (M)")
    ax.grid(True, alpha=ctx.tokens.plot["grid_alpha"])
    finalize_line_chart(fig, ax, ctx.tokens, legend_position="upper-left")
    return fig
