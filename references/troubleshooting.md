# Troubleshooting

## `doctor` fails on DevTools path

Symptom: DevTools app or CLI path not found.

Actions:

```bash
export WECHAT_DEVTOOLS_APP="/Applications/wechatwebdevtools.app"
"$WDA" doctor --project "$(pwd)"
```

If DevTools is installed elsewhere, set `WECHAT_DEVTOOLS_APP` to that app bundle path.

## Project root not found

Symptom: cannot find `project.config.json`.

Actions:

```bash
"$WDA" doctor --project "$(pwd)"
```

Then run from workspace root or pass an explicit `--project`.

## `app.json` not found under `miniprogramRoot`

Symptom: route listing/open fails.

Actions:

- Check `project.config.json` and `miniprogramRoot`.
- Confirm `<miniprogramRoot>/app.json` exists.
- Re-run `doctor`.

## Route ambiguity

Symptom: route alias maps to multiple pages.

Actions:

```bash
"$WDA" routes --project "$(pwd)"
```

Use a full route path instead of a short alias.

## Scroll captures are wrong container

Symptom: screenshot does not move through expected content.

Actions:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-step 900 --scroll-captures 3 --scroll-debug
```

Then force mode:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-target page
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-target inner --scroll-selector ".content-scroll"
```

## GUI screenshot unavailable

Symptom: `gui-shot` fails due to screenshot helper not found or missing permission.

Actions:

- Ensure screenshot helper is installed/configured (`CODEX_SCREENSHOT_HELPER` if custom).
- Grant screen recording permission to terminal/Codex app if prompted by macOS.
- Prefer page screenshots until GUI capture is available.

## Build-related failures

Symptom: opening succeeds but page resources are stale or missing.

Actions:

```bash
"$WDA" shot --project "$(pwd)" --route pages/home/index --build
```

If project provides custom build scripts, verify they are executable.

## Desired state only appears after click/input

Symptom: first screenshot is the wrong state because the page needs interaction.

Actions:

```bash
"$WDA" shot --project "$(pwd)" --route pages/store/index --tap ".coupon-card"
"$WDA" shot --project "$(pwd)" --route pages/search/index --input ".search-input::奶茶" --action "wait:1200"
```

If you need a longer flow, chain repeated `--action` flags in order.

## Need console or exception evidence

Symptom: page opens, but the failure only shows in console.

Actions:

- Open the generated `report.json` beside the screenshots.
- Review `consoleEvents` for console output and uncaught exceptions.
- Increase retention if needed:

```bash
"$WDA" shot --project "$(pwd)" --route pages/home/index --console-limit 200
```
