# Behavior Checklist

Use this checklist to verify post-trigger quality, not only trigger activation.

## Environment and preflight

- `doctor` runs and reports pass/fail checks clearly.
- Missing DevTools path produces actionable remediation text.
- Missing `project.config.json` or `app.json` produces clear error.

## Route and query flow

- `routes` lists discovered routes and alias candidates.
- A full route opens correctly.
- Route with query parameters opens correctly.
- Ambiguous alias returns candidate list instead of random selection.

## Build flow

- `--build` path executes before launch.
- Failure during build is surfaced clearly.

## Screenshot quality

- Default run saves simulator/page screenshot and prints absolute path.
- `gui-shot` saves GUI screenshot and prints absolute path(s).
- Output summary includes artifacts in a readable way.

## Scroll behavior

- `scroll-shot` with `--scroll-step` produces multiple captures.
- `--scroll-y` uses explicit positions.
- Auto scroll chooses inner container when appropriate.
- `--scroll-target page` forces page-level scroll.
- `--scroll-selector` can force known inner container.
- `--scroll-debug` emits useful candidate diagnostics.

## Reliability and cleanup

- DevTools session closes cleanly by default.
- Keep-open mode works when requested.
- Command exit codes reflect success/failure.
- JSON mode is parseable and contains core fields.

## Release tie-in

- Pair this checklist with `assets/release-checklist.md` so each release document shows which behaviors were verified during the trigger QA run.
- Save the eval build artifacts (`summary.md`, `summary.json`, `run.log`) in the release folder so downstream reviewers can trace the exact commands that exercised these behaviors.
