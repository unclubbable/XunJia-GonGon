"""Ingest platform agreements into Qdrant.

Usage:
  python -m scripts.ingest_knowledge
  python -m scripts.ingest_knowledge --recreate
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.rag.ingest import ingest_knowledge  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--recreate", action="store_true", default=True)
    parser.add_argument("--no-recreate", action="store_true")
    args = parser.parse_args()
    recreate = not args.no_recreate
    result = ingest_knowledge(recreate=recreate)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if not result.get("ok"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
