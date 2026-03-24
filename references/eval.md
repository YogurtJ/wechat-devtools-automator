# Trigger Eval (Beta release)

This documents how the beta release team measures whether `wechat-devtools-automator` triggers only for real Mini Program UI flows. Every release candidate should leave behind the isolated eval artifacts, the summary of trigger quality, and the smoke-test evidence captured in `assets/release-checklist.md`.

## 1) Run the isolated eval

```bash
bash scripts/run_isolated_trigger_eval.sh
```

- Defaults to the current skill root.
- Uses `evals/trigger_evals.json` unless you pass `--eval-set`.
- Copies the minimal `auth.json`/`config.toml` into a temporary isolated `CODEX_HOME`, runs `run_eval.py`, and cleans up afterward.
- The output includes `summary.md`, `summary.json`, and per-prompt logs; attach them to the release draft alongside the `artifacts` folder and trigger QA notes.

## 2) Customize if needed

- Override the description so the eval proves the new copy matches the real behavior:

  ```bash
  bash scripts/run_isolated_trigger_eval.sh --description "Open a Mini Program page and show the simulator, not the browser."
  ```

- Point to a curated eval set with `--eval-set /abs/path/trigger_evals.json`.
- Pass through additional `run_eval.py` flags (e.g., `-- --num-workers 4 --timeout 25 --verbose`).
- Use `--keep-home` to inspect the temporary `CODEX_HOME` directory during debugging.

## 3) Release QA workflow

1. Run `run_isolated_trigger_eval.sh` (with your latest `SKILL.md` description and command tweaks).
2. Save the `summary.md`/`summary.json` and include them in the GitHub release assets or at least point to them in `assets/release-checklist.md`.
3. Run `scripts/sweep_trigger_descriptions.sh` if you tuned prompt variants, and note the winning ID in `SKILL.md`.
4. Cross-check the artifact folder (screenshots + `report.json`) with `assets/artifact-example.md` so UI + console context stay together.
5. Mark the smoke test table in `assets/release-checklist.md` and link both the artifact folder and trigger QA summaries in your release notes.

## 4) In-session caveat (manual spot check)

When you run the sweep or eval from within an active Codex session that already exposes the skill, the temporary-path detector can undercount real triggers. Treat the sweep as one signal and confirm a few representative prompts manually:

```bash
codex exec --json --skip-git-repo-check --sandbox read-only -C "$(pwd)" --ephemeral \
  '帮我在微信开发者工具里打开小程序首页，给我一张真实截图。' \
  2>/dev/null | rg '/skills/.+/SKILL.md'
```

If the stream contains `wechat-devtools-automator/SKILL.md`, the skill did trigger even if the isolated score seemed low. Reserve this manual check for edge-case sanity and document the result in your release notes along with the sweep summary.

## 5) Behavior checklist & release QA

- Confirm `doctor`, `routes`, `shot`, `scroll-shot`, `gui-shot`, and `trigger` flows before the eval so failures don’t pollute the results.
- Record the behavior checklist items verified during this run (`evals/behavior_checklist.md`) and link to them in the release checklist.
- Keep the console log/exception details from `report.json` next to the related screenshot so reviewers can pair UI with runtime state.
- Update `assets/release-checklist.md` with the exact commands you ran, the outcome, and the artifact paths so downstream agents can reproduce the QA loop.

Together, the isolated eval artifacts, the sweep ranking, and the release checklist form the trigger QA foundation that makes this beta skill trustworthy for other agents.
