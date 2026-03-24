# GitHub Metadata Guide

Use this when turning the skill folder into a GitHub-facing beta repository or release page.

## Positioning

- Product name: `wechat-devtools-automator`
- Category: Codex skill / CLI automation helper for WeChat Mini Programs
- Beta posture: public GitHub beta while licensing remains explicitly `UNLICENSED`

## Repository description candidates

- Beta Codex skill for WeChat Mini Program screenshots, scroll capture, and console evidence in WeChat DevTools
- Give agents eyes inside WeChat DevTools: open Mini Program routes, interact, scroll, screenshot, and export `report.json`
- Evidence-driven WeChat Mini Program QA with route opening, interaction replay, screenshot capture, and console logs

## Suggested GitHub topics

- `wechat-devtools`
- `wechat-miniprogram`
- `mini-program`
- `codex-skill`
- `agentic-engineering`
- `visual-debugging`
- `screenshot-automation`
- `console-capture`

## README first-screen checklist

- name the product in both English and Chinese context where helpful
- say “public GitHub beta” or “beta release candidate” near the top
- say what the user gets after one run: screenshots + `report.json` + rerunnable command flow
- link install, smoke evidence, and trigger QA docs within the first screenful
- avoid claiming open-source status until `LICENSE` exists

## Release page checklist

- include one short summary paragraph
- include one runnable command block: `doctor`, `routes`, `shot`
- link one real artifact folder example and the trigger QA summary
- mention the tested platform/Node/DevTools combo
- repeat the current license posture from `LICENSE-NOTICE.md`

## What not to claim yet

- do not call the skill MIT / Apache / open-source
- do not imply a public package registry release
- do not imply broad redistribution rights that the current metadata does not grant
