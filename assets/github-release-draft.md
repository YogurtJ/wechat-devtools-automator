# GitHub release draft

## Release title ideas
- `wechat-devtools-automator` beta: CLI Mini Program evidence capture
- WeChat DevTools Automator goes beta: screenshots, scrolls, console, report.json
- Give agents visibility into Mini Programs: beta release

## Release highlights
- CLI now packages build→routes→interaction→scroll→capture into a single streak.
- Auto scroll-detection and inner container handling expose below-the-fold UI without extra setup.
- Console/error logs plus `report.json` deliver machine-readable evidence for QA and CI.
- Artifact folders pair screenshots + DevTools GUI crops so reviewers and agents reuse the same proof.

## Suggested release notes sections
- `## Summary` — state the beta launch purpose and high-level workflow improvements.
- `## What’s new` — bullet the CLI-tasks combo, scroll/container detection, console/log capture, and `report.json` export.
- `## How to test` — mention `doctor`, `routes`, `shot`, `scroll-shot`, and `report.json` inspection in `<project>/output/wechat-devtools-automator/<run-id>`.
- `## Caveats` — note DevTools must be installed, inner scroll detection might need tweaks for complex layouts, `report.json` records logs only once per run.

## Launch score prompts
- “Run the CLI flow for beta release and confirm you get a timestamped evidence folder with route, scroll, and console captures.”
- “Trigger the beta run on a query-enabled route, scroll inner lists, and share the artifact path plus `report.json` summary.”
