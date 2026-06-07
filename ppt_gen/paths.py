from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
THEMES_DIR = ROOT / "themes"
DECKS_DIR = ROOT / "decks"
BUILD_DIR = DECKS_DIR / ".build"
OUTPUT_DIR = ROOT / "output"
ASSETS_DIR = ROOT / "assets"
PLOTS_ASSETS_DIR = ASSETS_DIR / "plots"
DIAGRAMS_ASSETS_DIR = ASSETS_DIR / "diagrams"
CACHE_DIR = ASSETS_DIR / "cache"
DATA_DIR = ROOT / "data"
PLOTS_DIR = ROOT / "plots"
MERMAID_DIR = ROOT / "mermaid"


def theme_dir(name: str) -> Path:
    return THEMES_DIR / name


def ensure_dirs() -> None:
    for d in (BUILD_DIR, OUTPUT_DIR, PLOTS_ASSETS_DIR, DIAGRAMS_ASSETS_DIR, CACHE_DIR):
        d.mkdir(parents=True, exist_ok=True)
