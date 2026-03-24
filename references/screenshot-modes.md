# Screenshot Modes

This skill supports two visual outputs.

## 1) Simulator/Page screenshot (default, recommended)

- Captures rendered mini-program content from simulator automation.
- Best for UI validation, diffing, and agent reasoning.
- Lower noise than full-window captures.

Example:

```bash
"$WDA" shot --project "$(pwd)" --route pages/home/index
```

## 2) DevTools GUI screenshot (optional)

- Captures WeChat DevTools via screenshot helper, then crops to the simulator region by default on macOS.
- Useful when you need IDE-level context or error overlays.
- Set `WECHAT_DEVTOOLS_GUI_MODE=window` to keep the whole window instead of the simulator crop.

Example:

```bash
"$WDA" gui-shot --project "$(pwd)" --route pages/home/index
```

## Output expectations

- Always print absolute output path(s).
- If multiple files are produced, list each file path.
- For scroll captures, include the scroll position in file naming or output metadata.
- Console and exception output should be written into the sibling `report.json`.

## Suggested review order

1. Page screenshot(s) from top to bottom.
2. Scroll captures for below-the-fold states.
3. GUI screenshot only if page screenshots are insufficient.
