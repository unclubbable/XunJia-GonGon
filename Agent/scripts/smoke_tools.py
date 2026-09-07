"""Smoke-test assist tools (no full LLM graph).

Usage:
  python -m scripts.smoke_tools
  python -m scripts.smoke_tools --order-id 412
  python -m scripts.smoke_tools --skip-java
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.tools.assist_tools import (  # noqa: E402
    ASSIST_TOOLS,
    check_city_price_support,
    get_order,
    retrieve_policy,
)


def _print(title: str, raw: str) -> None:
    print(f"\n=== {title} ===")
    try:
        print(json.dumps(json.loads(raw), ensure_ascii=False, indent=2)[:2000])
    except Exception:  # noqa: BLE001
        print(raw[:2000])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--order-id", type=int, default=None)
    parser.add_argument("--skip-java", action="store_true")
    args = parser.parse_args()

    print(f"tools={len(ASSIST_TOOLS)} names={[t.name for t in ASSIST_TOOLS]}")

    _print(
        "retrieve_policy",
        retrieve_policy.invoke({"query": "退款规则", "audience": "passenger"}),
    )

    if args.skip_java:
        print("\nskip java tools")
        return

    if args.order_id is not None:
        _print("get_order", get_order.invoke({"order_id": args.order_id}))

    _print(
        "check_city_price_support",
        check_city_price_support.invoke({"city_code": "370100", "vehicle_type": "1"}),
    )


if __name__ == "__main__":
    main()
