# Trigger Description 调优（可重复流程）

## 目标

把 description 调优从“手工改一句试一次”变成可重复批量评测。

## 步骤

1. 在 skill 根目录里维护 `evals/description_candidates.md`（按一行一个候选）。
2. 运行 sweep：

```bash
bash scripts/sweep_trigger_descriptions.sh \
  -- --runs-per-query 1 --num-workers 4 --timeout 25
```

3. 查看输出目录（默认 `evals/sweeps/<timestamp>/`）：
   - `summary.md`：候选排名与通过率
   - `summary.json`：机器可读汇总
   - `<candidate>.json`：单候选结构化结果
   - `<candidate>.log`：原始执行日志

## 常用变体

- 仅跑指定候选：

```bash
bash scripts/sweep_trigger_descriptions.sh \
  --ids baseline_current,cn_real_page_focus \
  -- --runs-per-query 1
```

- 只解析候选不执行：

```bash
bash scripts/sweep_trigger_descriptions.sh --list
```
