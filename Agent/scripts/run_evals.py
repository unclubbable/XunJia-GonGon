"""Run phase4 small eval set against local Agent.

Usage:
  python -m scripts.run_evals
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

CASES = ROOT / "evals" / "ticket_assist_cases.json"
OUT = ROOT / "data" / "eval_report.json"
BASE = "http://127.0.0.1:18080"


def post_assist(payload: dict) -> dict:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}/v1/ticket/assist",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode("utf-8"))


def check_case(case: dict, result: dict) -> dict:
    expect = case.get("expect") or {}
    suggestion = result.get("suggestion") or {}
    refund = suggestion.get("refund_advice") or {}
    execute = suggestion.get("execute_advice") or {}
    actions = suggestion.get("recommended_actions") or []
    issues: list[str] = []

    if "suggest_refund" in expect and bool(refund.get("suggest_refund")) != bool(expect["suggest_refund"]):
        issues.append(f"suggest_refund want={expect['suggest_refund']} got={refund.get('suggest_refund')}")

    if expect.get("forbid_action") and expect["forbid_action"] in actions:
        issues.append(f"forbid_action present: {expect['forbid_action']}")

    if expect.get("need_refund_field") and not isinstance(refund, dict):
        issues.append("missing refund_advice")

    if expect.get("need_execute_field") and not isinstance(execute, dict):
        issues.append("missing execute_advice")

    caution_key = expect.get("caution_contains")
    if caution_key:
        blob = f"{refund.get('caution','')}{execute.get('caution','')}"
        if caution_key not in blob:
            issues.append(f"caution missing keyword: {caution_key}")

    if "suggest_approve_prefer" in expect:
        prefer = bool(expect["suggest_approve_prefer"])
        got = bool(execute.get("suggest_approve"))
        if prefer is False and got is True:
            issues.append("expected suggest_approve=false for incomplete payload")

    return {
        "id": case.get("id"),
        "ok": len(issues) == 0,
        "issues": issues,
        "actions": actions,
        "refund": refund,
        "execute": execute,
        "summary": result.get("summary"),
        "confidence": suggestion.get("confidence"),
    }


def main() -> None:
    data = json.loads(CASES.read_text(encoding="utf-8"))
    rows = []
    for case in data.get("cases") or []:
        try:
            result = post_assist(case["input"])
            rows.append(check_case(case, result))
        except Exception as exc:
            rows.append({"id": case.get("id"), "ok": False, "issues": [str(exc)]})

    report = {
        "suite": data.get("name"),
        "passed": sum(1 for r in rows if r.get("ok")),
        "total": len(rows),
        "rows": rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"passed": report["passed"], "total": report["total"]}, ensure_ascii=False))
    for r in rows:
        status = "PASS" if r.get("ok") else "FAIL"
        print(f"[{status}] {r.get('id')} {r.get('issues') or ''}")
    if report["passed"] != report["total"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
