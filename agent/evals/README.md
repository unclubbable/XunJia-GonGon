# 评测说明（阶段 4）

小评测集用于简历演示「可评测」，不是完整自动化 benchmark。

## 用例文件

`ticket_assist_cases.json`

覆盖：
- 有订单的超收投诉 → 必须产出 `refund_advice`（不自动退款）
- 无订单 → `suggest_refund=false`，动作不含 `REFUND_CREATE`
- 司机改城（有 payload）→ `execute_advice`
- 绑车（空 payload）→ 倾向不通过 / 补材料

## 运行

先启动 Agent（18080），再执行：

```powershell
cd Agent
.\.venv\Scripts\python.exe -m scripts.run_evals
```

结果写入 `data/eval_report.json`。人工核对：摘要是否合理、caution 是否提示「须人工确认」。

## Langfuse

联调时在云端过滤 `agent.ticket_assist` / `agent.ticket_chat`，查看 metadata（category、has_order）与 output（refund/execute/confidence）。
