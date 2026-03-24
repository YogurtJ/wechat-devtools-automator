# CLI Reference

This skill is designed to be wrapper-first.

## Setup

```bash
export WDA="$HOME/.codex/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
```

## Common subcommands

```bash
"$WDA" doctor --project "$(pwd)"
"$WDA" routes --project "$(pwd)"
"$WDA" shot --project "$(pwd)" --route pages/home/index
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-step 900 --scroll-captures 3
"$WDA" gui-shot --project "$(pwd)" --route pages/home/index
"$WDA" click-shot --project "$(pwd)" --route pages/store/index --tap ".coupon-card"
```

## Common options

- `--project <path>`: project root or any child path.
- `--route <value>`: route path, alias, or route with query.
- `--query key=value`: repeatable query parameter.
- `--tap <selector>`: tap an element before capture; repeatable.
- `--input <selector>::<value>`: type into an input or textarea before capture.
- `--trigger <selector>::<event>[::jsonDetail]`: fire a component event before capture.
- `--action <spec>`: generic action sequence item like `tap:.cta`, `wait:1200`, `input:.search-input::tea`.
- `--console-limit <n>`: keep the latest N console / exception records in the report.
- `--build`: build npm before launching.
- `--wait <ms>`: wait before first capture.
- `--output <path>`: explicit page screenshot output path.
- `--json`: JSON output for machine parsing.

## Scroll options

- `--scroll-step <n>`: step size for auto-generated captures.
- `--scroll-captures <n>`: number of scroll captures.
- `--scroll-y 0,900,1800`: explicit scroll positions.
- `--scroll-target auto|page|inner`: scroll mode.
- `--scroll-selector <selector>`: force known inner container.
- `--scroll-debug`: print candidate ranking for inner containers.

## Compatibility fallback

If wrapper is temporarily unavailable, use:

```bash
node "$HOME/.codex/skills/wechat-devtools-automator/scripts/visual_check.js" --project "$(pwd)" --route pages/home/index
```
