"""Export LangGraph workflows as Markdown (Mermaid) and optional PNG.

Usage:
  python -m scripts.export_graphs
  python -m scripts.export_graphs --png
  python -m scripts.export_graphs --out data/graphs
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.graphs.ticket_assistant import get_ticket_assist_graph  # noqa: E402
from app.graphs.ticket_chat import get_ticket_chat_graph  # noqa: E402

GRAPHS = {
    "ticket_assist": get_ticket_assist_graph,
    "ticket_chat": get_ticket_chat_graph,
}


def export_one(name: str, get_graph, out_dir: Path, with_png: bool) -> list[str]:
    written: list[str] = []
    graph = get_graph().get_graph()
    mermaid = graph.draw_mermaid()

    md_path = out_dir / f"{name}.md"
    md_path.write_text(
        f"# {name}\n\n```mermaid\n{mermaid.strip()}\n```\n",
        encoding="utf-8",
    )
    written.append(str(md_path))

    if with_png:
        png_path = out_dir / f"{name}.png"
        try:
            png_bytes = graph.draw_mermaid_png()
            png_path.write_bytes(png_bytes)
            written.append(str(png_path))
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] {name}.png failed: {exc}", file=sys.stderr)

    return written


def main() -> None:
    parser = argparse.ArgumentParser(description="Export LangGraph workflow diagrams")
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "data" / "graphs",
        help="output directory (default: data/graphs)",
    )
    parser.add_argument(
        "--png",
        action="store_true",
        help="also export PNG via Mermaid renderer (needs network or local renderer)",
    )
    args = parser.parse_args()

    out_dir = args.out if args.out.is_absolute() else ROOT / args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    all_written: list[str] = []
    for name, getter in GRAPHS.items():
        all_written.extend(export_one(name, getter, out_dir, args.png))

    print(f"exported {len(all_written)} file(s) -> {out_dir}")
    for path in all_written:
        print(f"  {path}")


if __name__ == "__main__":
    main()
