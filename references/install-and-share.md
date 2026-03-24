# Install & Share Guide (beta release)

This keeps installers and reviewers in sync: document the commands you ran, the artifact folder each run produced, and the trigger-QA notes that justify the beta posture.

Read `LICENSE-NOTICE.md` before promoting the repo more widely so the current `UNLICENSED` / beta-evaluation posture is explicit.

## 1) Quick install (for contributors)

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/skills"
cp -R /path/to/wechat-devtools-automator "$CODEX_HOME/skills/wechat-devtools-automator"
```

Then define the wrapper and confirm the skill works:

```bash
export WDA="$CODEX_HOME/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project "$(pwd)"
"$WDA" routes --project "$(pwd)"
```

Record the `routes` output and `doctor` diagnostics in `assets/release-checklist.md` as part of each beta run. The wrapper line can go into your repo’s `README` or onboarding doc so that future contributors can reach for the same command block.

## 2) Packaged `.skill` install (for beta testers)

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/skills"
unzip -q /path/to/wechat-devtools-automator.skill -d "$CODEX_HOME/skills"
```

Confirm the install with the wrapper:

```bash
export WDA="$CODEX_HOME/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project "$(pwd)"
```

Treat the downloaded `.skill` as a beta evaluation artifact while `package.json` stays `UNLICENSED`. Link to this guide, the quickstart, and `assets/release-checklist.md` so testers can see both the commands and the release evidence bundle.

## 3) Beta-ready share checklist

- ✅ Mention the verified `platform + Node + DevTools` combo you recorded in the release checklist.
- ✅ Include one clean artifact folder path (`output/wechat-devtools-automator/<run-id>/`) that bundles the screenshots and `report.json`.
- ✅ Reference the trigger sweep summary (`evals/sweeps/<timestamp>/summary.md`) when describing trigger quality.
- ✅ Highlight any console errors or scroll interactions so reviewers know what to expect.
- ✅ If you tuned the description, note the winning prompt ID and link to the sweep artifact.

## 4) Share guidance

### Internal teams

- Pin a tested commit or release asset (the wrapper path does not change across versions).
- Share a sample route + screenshot pair so that teammates see what “working” looks like.
- Include sanitized `report.json` plus the screenshot files and a short explanation of the user gesture that generated them.
- Encourage teammates to copy the release checklist template so each release aligns with the same evidence bundle.

### Broader beta or community sharing

- Publish the release notes with explicit prerequisites (local WeChat DevTools, mini program project).
- Embed a runnable command block—not just prose—that shows how to `doctor`, `routes`, and capture the first screenshot.
- Describe the limitations (`UNLICENSED` beta evaluation release) and mention that the `.skill` is distributed as a beta artifact until licensing changes.
- Link the release checklist and trigger QA summary so downstream agents know where to find the screenshots, console logs, and pass/fail counts.
- If you use GitHub as the landing surface, mirror the About text/topics from `references/github-metadata.md`.

## 5) Trigger QA gate

Before sharing or releasing, rerun `scripts/run_isolated_trigger_eval.sh` (or `scripts/sweep_trigger_descriptions.sh`) and stash the summary under `evals/sweeps/<timestamp>/`. Attach that summary to your release artifact so reviewers can replicate how trigger quality was measured.

If you made behavior changes, update `README.md`, `references/quickstart.md`, and this guide together so every onboarding surface stays aligned with the commands you just verified.
