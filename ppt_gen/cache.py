from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def content_hash(*parts: Any) -> str:
    payload = json.dumps(parts, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


def cache_meta_path(cache_dir: Path, key: str) -> Path:
    return cache_dir / f"{key}.json"


def is_cache_valid(
    cache_dir: Path,
    key: str,
    *,
    expected_hash: str,
    output_path: Path,
) -> bool:
    meta = cache_meta_path(cache_dir, key)
    if not meta.exists() or not output_path.exists():
        return False
    stored = json.loads(meta.read_text())
    return stored.get("hash") == expected_hash


def write_cache_meta(cache_dir: Path, key: str, *, hash_value: str, output: Path) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_meta_path(cache_dir, key).write_text(
        json.dumps({"hash": hash_value, "output": str(output)})
    )
