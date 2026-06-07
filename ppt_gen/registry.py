from __future__ import annotations

import importlib
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

from matplotlib.figure import Figure

from ppt_gen.paths import PLOTS_DIR
from ppt_gen.slide_context import SlideContext

PlotFunc = Callable[[SlideContext], Figure]

_REGISTRY: dict[str, PlotFunc] = {}


def register(name: str) -> Callable[[PlotFunc], PlotFunc]:
    def decorator(func: PlotFunc) -> PlotFunc:
        _REGISTRY[name] = func
        return func

    return decorator


def get_plot(name: str) -> PlotFunc:
    _ensure_plots_loaded()
    if name not in _REGISTRY:
        raise KeyError(f"Unknown plot '{name}'. Registered: {sorted(_REGISTRY)}")
    return _REGISTRY[name]


def list_plots() -> list[str]:
    _ensure_plots_loaded()
    return sorted(_REGISTRY)


def _ensure_plots_loaded() -> None:
    if _REGISTRY:
        return
    if not PLOTS_DIR.exists():
        return
    if str(PLOTS_DIR.parent) not in sys.path:
        sys.path.insert(0, str(PLOTS_DIR.parent))
    for path in sorted(PLOTS_DIR.glob("*.py")):
        if path.name.startswith("_"):
            continue
        importlib.import_module(f"plots.{path.stem}")


def load_data() -> dict[str, Any]:
    import pandas as pd

    from ppt_gen.paths import DATA_DIR

    data: dict[str, Any] = {}
    if not DATA_DIR.exists():
        return data
    for csv_path in sorted(DATA_DIR.glob("*.csv")):
        data[csv_path.stem] = pd.read_csv(csv_path)
    return data
