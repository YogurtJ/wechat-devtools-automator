# Install & Share Guide (beta release)

This keeps installers and reviewers in sync: document the commands you ran, the artifact folder each run produced, and the trigger-QA notes that justify the beta posture.

Read `LICENSE` before promoting the repo more widely so the permission model is explicit.

## 1) Use from any agent tool

```bash
git clone https://github.com/YogurtJ/wechat-devtools-automator.git
cd wechat-devtools-automator
export WDA="$(pwd)/scripts/wechat_devtools_automator.sh"
```

Then confirm the wrapper works:

```bash
"$WDA" doctor --project /path/to/mini-program-project
"$WDA" routes --project /path/to/mini-program-project
```

This path works well for Codex, Claude Code, Cursor, OpenCode, OpenClaw, and similar agent tools as long as they can execute local shell commands.

## 2) Install as a Codex skill

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/skills"
git clone https://github.com/YogurtJ/wechat-devtools-automator.git \
  "$CODEX_HOME/skills/wechat-devtools-automator"
export WDA="$CODEX_HOME/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project "$(pwd)"
```

Use this when you want the repository plus the packaged skill shape under `$CODEX_HOME/skills`.

## 3) Packaged `.skill` install

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

Treat the downloaded `.skill` as a beta release artifact. Link to this guide, the quickstart, and `assets/release-checklist.md` so testers can see both the commands and the release evidence bundle.

## 4) Beta-ready share checklist

- ✅ Mention the verified `platform + Node + DevTools` combo you recorded in the release checklist.
- ✅ Include one clean artifact folder path (`output/wechat-devtools-automator/<run-id>/`) that bundles the screenshots and `report.json`.
- ✅ Reference the trigger sweep summary (`evals/sweeps/<timestamp>/summary.md`) when describing trigger quality.
- ✅ Highlight any console errors or scroll interactions so reviewers know what to expect.
- ✅ If you tuned the description, note the winning prompt ID and link to the sweep artifact.

## 5) Share guidance

### Internal teams

- Pin a tested commit or release asset (the wrapper path does not change across versions).
- Share a sample route + screenshot pair so that teammates see what “working” looks like.
- Include sanitized `report.json` plus the screenshot files and a short explanation of the user gesture that generated them.
- Encourage teammates to copy the release checklist template so each release aligns with the same evidence bundle.
- If teammates use different agent tools, standardize on the same `WDA=.../scripts/wechat_devtools_automator.sh` wrapper path.

### Broader beta or community sharing

- Publish the release notes with explicit prerequisites (local WeChat DevTools, mini program project).
- Embed a runnable command block—not just prose—that shows how to `doctor`, `routes`, and capture the first screenshot.
- Describe the limitations as product maturity constraints rather than licensing restrictions, because the repository is now MIT-licensed.
- Link the release checklist and trigger QA summary so downstream agents know where to find the screenshots, console logs, and pass/fail counts.
- If you use GitHub as the landing surface, mirror the About text/topics from `references/github-metadata.md`.

## 6) Trigger QA gate

Before sharing or releasing, rerun `scripts/run_isolated_trigger_eval.sh` (or `scripts/sweep_trigger_descriptions.sh`) and stash the summary under `evals/sweeps/<timestamp>/`. Attach that summary to your release artifact so reviewers can replicate how trigger quality was measured.

If you made behavior changes, update `README.md`, `references/quickstart.md`, and this guide together so every onboarding surface stays aligned with the commands you just verified.
