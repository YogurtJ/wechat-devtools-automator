# WeChat DevTools Automator Quickstart (beta)

Get a working screenshot flow in under a minute by running the core commands in sequence, then attach the artifact folder produced by each run so future reviewers can see the simulator output and `report.json` together.

## 1) Install the wrapper
```bash
export WDA="$HOME/.codex/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
```
This should point to the skill you just installed or packaged. Add the line to your shell profile to make the wrapper available in every terminal session.

## 2) Validate your wechat devtools + project
```bash
"$WDA" doctor --project "$(pwd)"
```
Expect clear checks for the WeChat DevTools binary, `app.json`, and the declared `miniprogramRoot`. Failures usually mean the current terminal is in the wrong repo or the DevTools path is misconfigured.

## 3) Discover live routes
```bash
"$WDA" routes --project "$(pwd)"
```
Use the output to drive every subsequent command. Avoid earlier hardcoded names; the tool lists only routes whose pages actually exist under your project’s `miniprogramRoot`.

## 4) Capture the home screen
```bash
"$WDA" shot --project "$(pwd)" --route "${ROUTE}" --output-prefix "baseline"
```
Replace `${ROUTE}` with one of the routes from step 3. The screenshot(s) and the generated `report.json` land under `output/wechat-devtools-automator/<run-id>/`. Keep that folder intact for artifact sharing.

## 5) Capture scroll or interaction states
```bash
"$WDA" scroll-shot --project "$(pwd)" --route "${ROUTE}" --scroll-captures 3 --scroll-step 900
"$WDA" shot --project "$(pwd)" --route "${ROUTE}" --tap "<selector>"
```
Use `scroll-shot` for long lists and `--tap`, `--input`, or `--action` when the desired UI only appears after user gestures. Each run saves additional screenshot files; mention them in your release notes.

## 6) Optional GUI context
```bash
"$WDA" gui-shot --project "$(pwd)" --route "${ROUTE}"
```
Only capture the GUI view when someone specifically needs the bordering DevTools window for debugging. The default `shot` outputs already focus on the simulator canvas so reviewers can quickly spot visual regressions.

## 7) Share the evidence
After every verification run, copy the artifact folder path printed to stdout, then:

1. Sanitize `report.json` if it contains personal IDs or tokens.
2. Attach `report.json` plus the screenshot files when you publish release notes or share a demo.
3. Reference these artifacts in `assets/release-checklist.md` and your release communication so downstream agents can retrace the steps without guessing.

## Troubleshooting quick wins
- `doctor` fails because the `WECHAT_DEVTOOLS_APP` path is not set? Export the actual path or install via the app bundle path referenced in `scripts/mp_open.sh`.
- Routes list is empty? Make sure you pointed `--project` to the repo that owns the `miniprogramRoot` passed to the wrapper.
- Screenshots look whole-desktop? Only use the default `shot`, `scroll-shot`, and `gui-shot` commands; they already focus on the simulator region that matters to agents.
