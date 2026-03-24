# WeChat DevTools Automator

简体中文说明：[`README.zh-CN.md`](README.zh-CN.md)

Beta release candidate for agentic WeChat Mini Program visual debugging inside WeChat DevTools / 微信开发者工具.

Status: public GitHub beta for real Mini Program development workflows with documented smoke runs.

`wechat-devtools-automator` gives agents CLI-powered eyes on real Mini Program pages: run preflight, compile when needed, list routes, open a page with query params, click or type to reach the right state, scroll below the fold, capture screenshots, and collect console / exception output as evidence.

## Beta posture

- Distribution posture today: public GitHub beta for evaluation and smoke-tested adoption
- License posture today: `UNLICENSED` until an explicit open-source or source-available license is added
- Release trust anchors: documented smoke runs, packaged `.skill` artifact, trigger QA summaries, and sharable evidence folders

Before promoting the repo more broadly, point readers to `LICENSE-NOTICE.md`, `references/install-and-share.md`, `assets/release-checklist.md`, and `references/github-metadata.md`.

## What one run gives you

- A route-aware evidence folder under `<project>/output/wechat-devtools-automator/<run-id>/`
- Page screenshots and optional GUI crop
- `report.json` with route, query, action, console, and exception context
- A reproducible CLI trail that another agent or reviewer can rerun

## Why this exists

Mini Program frontend work often fails at the “eyes-on” step. Browser projects can lean on Playwright, but Mini Program UI verification usually passes through WeChat DevTools. If the agent cannot see the real rendered page, many judgments regress into guesswork.

This repo turns that into a repeatable workflow:

- `doctor` to verify the local environment
- `routes` to discover available pages
- `shot` / `scroll-shot` / `gui-shot` to capture real rendered UI
- `--tap`, `--longpress`, `--input`, `--trigger`, `--action` to reach post-interaction states
- `report.json` output with `console` / exception evidence

## Not Codex-only

The packaged `.skill` targets Codex today, but the core workflow is just the wrapper plus Node scripts.

If your agent tool can run local shell commands, you can use the same flow from Codex, Claude Code, Cursor, OpenCode, OpenClaw, or similar agent-driven setups by calling:

```bash
scripts/wechat_devtools_automator.sh
```

## Install

### Option A: use from any agent tool

Clone the repo anywhere convenient, then call the wrapper directly:

```bash
git clone https://github.com/YogurtJ/wechat-devtools-automator.git
cd wechat-devtools-automator
export WDA="$(pwd)/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project /path/to/mini-program-project
"$WDA" routes --project /path/to/mini-program-project
```

### Option B: install as a Codex skill

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/skills"
git clone https://github.com/YogurtJ/wechat-devtools-automator.git \
  "$CODEX_HOME/skills/wechat-devtools-automator"
export WDA="$CODEX_HOME/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project "$(pwd)"
"$WDA" routes --project "$(pwd)"
```

Prefer a packaged `.skill` instead? See `references/install-and-share.md`.

## Quickstart

```bash
export WDA="/path/to/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"

"$WDA" doctor --project "$(pwd)"
"$WDA" routes --project "$(pwd)"
"$WDA" shot --project "$(pwd)" --route "<copy-a-route-from-routes-output>"
```

Artifacts default to:

```text
<project>/output/wechat-devtools-automator/<run-id>/
```

After you have one real route from `routes`, continue with:

```bash
"$WDA" shot --project "$(pwd)" --route "<real-route>" --query id=item_001
"$WDA" shot --project "$(pwd)" --route "<real-route>" --tap "<selector>"
"$WDA" shot --project "$(pwd)" --route "<real-route>" --input "<selector>::奶茶"
"$WDA" scroll-shot --project "$(pwd)" --route "<real-route>" --scroll-step 900 --scroll-captures 3
"$WDA" gui-shot --project "$(pwd)" --route "<real-route>"
```

Need a safer first-run path? See `references/quickstart.md`.

## Good fit prompts

- “帮我在微信开发者工具里打开这个小程序页面并截图。”
- “先编译一下，再带参数打开指定页面让我看真实渲染。”
- “这个页面得先点一下 tab 才能看到目标状态，帮我点开再截图。”
- “帮我往下滚几屏，把首屏以下也截出来。”
- “打开页面后把 console 报错也一起抓出来。”
- “Open a WeChat Mini Program route with query params and capture screenshots.”

## Best used for

- UI validation for Mini Program pages
- Visual debugging after route/query changes
- Interaction-driven states that only appear after tapping or typing
- Below-the-fold inspection
- Collecting screenshots and console evidence for agent handoff or bug reports

## Not the right tool for

- Generic website browser automation
- Whole-desktop screenshots unrelated to WeChat DevTools
- Pure code refactors that do not require visual verification
- A claim of native integration with every agent IDE; outside Codex, the wrapper/script path is the supported route

## Limits and known constraints

- Depends on DevTools GUI/session state; parallel runs on one machine can contend
- Visual results can vary by local font, OS, zoom, and mock / API data
- `gui-shot` is macOS-first; simulator/page screenshots are the portable default
- If `build-npm` fails due to missing npm deps in the project, fix project deps first

## Compatibility matrix

| Platform | Node | WeChat DevTools | Validation |
| --- | --- | --- | --- |
| macOS 15.5 | Node v24.13.1 | 2.01.2510280 | `doctor` + `routes` + `shot` + `scroll-shot` on 2026-03-24 |

Record every newly verified platform combo in `assets/release-checklist.md`.

## Sharing guidance

- For first-time users, link this README plus `README.zh-CN.md` and `references/quickstart.md`
- For release QA, include `assets/release-checklist.md` and the trigger QA summary
- For handoff, always share the screenshot folder and `report.json`, not screenshots alone
- If you publish a GitHub repo, fill the repo About box/topics using `references/github-metadata.md`

## Related docs

- Chinese README: `README.zh-CN.md`
- Install and share: `references/install-and-share.md`
- Trigger QA: `references/eval.md`
- Release metadata: `references/github-metadata.md`
