# Contributing

Thanks for helping improve `wechat-devtools-automator`.

## Before opening a PR

1. Keep changes generic across Mini Program projects.
2. Do not hardcode project-specific routes, selectors, or merchant data.
3. Sanitize screenshots and `report.json` before sharing artifacts.
4. Update `README.md` and the relevant file under `references/` when behavior changes.

## Recommended checks

Run the smallest relevant checks for your change:

```bash
python3 ~/.cc-switch/skills/skill-creator/scripts/quick_validate.py .
python3 -m json.tool evals/trigger_evals.json >/dev/null
bash scripts/package_skill.sh
```

If you changed runtime behavior, also run a real smoke flow against a Mini Program project:

```bash
export WDA="$HOME/.codex/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project /path/to/project
"$WDA" routes --project /path/to/project
"$WDA" shot --project /path/to/project --route "<route>"
```

## PR expectations

- Include the exact commands you ran.
- Link one sanitized artifact folder when visual behavior changed.
- Mention whether you updated trigger prompts or release docs.
- Avoid bundling local `dist/`, `evals/sweeps/`, or scratch planning files.
