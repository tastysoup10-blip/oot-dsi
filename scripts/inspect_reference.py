#!/usr/bin/env python3
"""Create a lightweight inventory of a local ZeldaRET/oot checkout.

This script only lists paths and counts file extensions. It does not read ROMs,
extract assets, or copy upstream source into this repository.
"""
from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("reference", type=Path, help="Path to a local ZeldaRET/oot checkout")
    args = parser.parse_args()

    root = args.reference.expanduser().resolve()
    if not root.is_dir():
        parser.error(f"reference directory does not exist: {root}")

    print(f"Reference checkout: {root}")
    print("\nTop-level entries:")
    for item in sorted(root.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
        kind = "dir " if item.is_dir() else "file"
        print(f"  [{kind}] {item.name}")

    counts: Counter[str] = Counter()
    total = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        # Ignore Git internals and large generated/build directories.
        if ".git" in path.parts or any(part in {"build", "baseroms"} for part in path.parts):
            continue
        total += 1
        counts[path.suffix.lower() or "[no extension]"] += 1

    print(f"\nTracked-looking files scanned (excluding .git, build, baseroms): {total}")
    print("File counts by extension:")
    for suffix, count in counts.most_common():
        print(f"  {suffix:18} {count:6}")

    src = root / "src"
    if src.is_dir():
        print("\nSource directories (up to 3 levels):")
        for path in sorted(src.rglob("*")):
            if path.is_dir() and len(path.relative_to(src).parts) <= 3:
                print(f"  {path.relative_to(root)}")

    print("\nInventory complete. This is a filesystem overview, not a code audit.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
