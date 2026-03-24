# Release Checklist (beta-ready)

This checklist doubles as a smoke-test signoff and release-ready narrative for GitHub readers. Keep it next to your release draft so reviewers can follow the commands, artifact paths, and trigger QA evidence that prove the beta skill works.

## 1) Beta documentation sync

- [ ] `README.md`, `references/quickstart.md`, `references/install-and-share.md`, and `references/eval.md` reflect the same commands, limitations, and trigger QA posture you just verified.
- [ ] `LICENSE` still matches `package.json` (`MIT`) and the wording used in release notes / repo About text.
- [ ] Limitations focus on product maturity and environment constraints, while trigger/eval artifacts still live under `evals/` plus `output/wechat-devtools-automator/`.
- [ ] Release notes summarize “what changed”, “who should care”, and link to the artifact folder plus the sweep summary (`evals/sweeps/<timestamp>/summary.md`).
- [ ] Compatibility matrix records the exact platform, Node, and WeChat DevTools combos you tested during this release.
- [ ] Repository keywords (GitHub topics, `package.json` keywords) mention terms like `wechat-devtools`, `mini-program`, `screenshot`, `trigger-eval` so the beta skill is findable via search.
- [ ] If this ships through a GitHub repository, the repo About box/topics follow `references/github-metadata.md`.

## 2) Smoke-test signoff (one row per documented run)

| Date (YYYY-MM-DD) | Project/Path | Step | Command | Outcome & Notes | Artifacts |
| --- | --- | --- | --- | --- | --- |
| | | `doctor` | `"$WDA" doctor --project <project>` |  |  |
| | | `routes` | `"$WDA" routes --project <project>` |  |  |
| | | `shot` (base route) | `"$WDA" shot --project <project> --route <route>` |  |  |
| | | `shot` (interaction) | `"$WDA" shot --project <project> --route <route> --tap <selector>` or `--input` |  |  |
| | | `scroll-shot` | `"$WDA" scroll-shot --project <project> --route <route> --scroll-captures <n>` |  |  |
| | | Evidence bundle | `ls <project>/output/wechat-devtools-automator/<run-id>` |  |  |

Fill every column while you run the commands; if you capture multiple runs, add rows for each. In the Artifacts column note the screenshot files plus the `report.json` path, and specify any GUI/scroll captures that were needed.

## 3) Artifact hygiene

- [ ] Artifact folder contains `report.json`, `page.png`/`page-*.png`, optional `gui.png`, and any scroll-shot fragments grouped under the same `<run-id>` directory.
- [ ] `report.json` lists the route, query, actions, and console/exception events that correspond to the screenshots.
- [ ] Screenshots focus on the simulator canvas unless you capture GUI context deliberately.
- [ ] Release notes repeat any console errors from `report.json` if they affect the release scope.
- [ ] Sanitize sensitive query IDs, tokens, or personal data in `report.json` before sharing.

## 4) Trigger QA signoff

- [ ] `scripts/run_isolated_trigger_eval.sh` executed with the latest `SKILL.md` description and pass/fail counts noted.
- [ ] `evals/sweeps/<timestamp>/summary.md` (from sweep or manual runs) attached to release evidence.
- [ ] Release notes mention the candidate description that shipped along with the trigger scores and any manual spot checks performed via `codex exec`.
- [ ] `evals/behavior_checklist.md` items touched during this run are explicitly marked so future agents know which behavior anchors were verified.
- [ ] Manual caveats (in-session undercount risk) and any follow-up `codex exec` prompt checks are logged as part of the trigger QA evidence.

## 5) Packaging & handoff

- [ ] `.skill` artifact name/version matches the beta release snapshot and does not embed nested `/dist` archives.
- [ ] Wrapper path (`scripts/wechat_devtools_automator.sh`) is referenced so team members know how to rerun the recorded commands.
- [ ] Release communication links to this checklist plus one artifact folder so reviewers can reproduce the evidence without guesswork.
- [ ] If a new beta `bundle` is published, confirm the `.skill` asset and release notes still reflect the current MIT-licensed beta posture.
