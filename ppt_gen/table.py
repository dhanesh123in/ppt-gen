from __future__ import annotations

import pandas as pd

from ppt_gen.theme.tokens import ThemeTokens


def render_table_markdown(
    df: pd.DataFrame,
    tokens: ThemeTokens,
    *,
    max_rows: int | None = None,
) -> str:
    if max_rows is not None:
        df = df.head(max_rows)
    header_bg = tokens.table_header_bg()
    zebra_bg = tokens.table_zebra_bg()
    border = tokens.colors.get("border", "#3a3a5c")
    font_px = tokens.table["font_px"]
    fg = tokens.foreground

    md_table = df.to_markdown(index=False)

    return f"""<style scoped>
table {{
  font-size: {font_px}px;
  border-collapse: collapse;
  width: 100%;
}}
table th {{
  background: {header_bg};
  color: {fg};
  padding: 0.4em 0.6em;
}}
table td {{
  border: 1px solid {border};
  padding: 0.35em 0.6em;
}}
table tr:nth-child(even) {{
  background: {zebra_bg};
}}
</style>

{md_table}
"""


def get_table_data(name: str, data: dict) -> pd.DataFrame:
    if name not in data:
        raise KeyError(f"Unknown table data '{name}'. Available: {sorted(data)}")
    frame = data[name]
    if not isinstance(frame, pd.DataFrame):
        raise TypeError(f"Data '{name}' is not a DataFrame")
    return frame
