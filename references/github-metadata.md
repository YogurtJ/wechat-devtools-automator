# GitHub Metadata Guide

Use this when turning the skill folder into a GitHub-facing beta repository or release page.

## Positioning

- Product name: `wechat-devtools-automator`
- Category: agent-tool-friendly CLI automation helper for WeChat Mini Programs
- Beta posture: public GitHub beta, MIT-licensed

## Repository description candidates

- MIT-licensed beta WeChat DevTools automation for agentic Mini Program screenshots, scroll capture, and console evidence
- Give agents eyes inside WeChat DevTools: open Mini Program routes, interact, scroll, screenshot, and export `report.json`
- Evidence-driven WeChat Mini Program QA with route opening, interaction replay, screenshot capture, and console logs

## Suggested GitHub topics

- `wechat-devtools`
- `wechat-miniprogram`
- `mini-program`
- `ai-agents`
- `agentic-engineering`
- `visual-debugging`
- `screenshot-automation`
- `console-capture`
- `developer-tools`

## README first-screen checklist

- name the product in both English and Chinese context where helpful
- say “public GitHub beta” or “beta release candidate” near the top
- say what the user gets after one run: screenshots + `report.json` + rerunnable command flow
- mention that the wrapper/scripts can be called from multiple agent tools, while the packaged `.skill` is Codex-specific
- link install, smoke evidence, and trigger QA docs within the first screenful
- link the MIT `LICENSE` directly once the repo is published

## Release page checklist

- include one short summary paragraph
- include one runnable command block: `doctor`, `routes`, `shot`
- link one real artifact folder example and the trigger QA summary
- mention the tested platform/Node/DevTools combo
- mention that the repository is MIT-licensed

## What not to claim yet

- do not imply a public package registry release
- do not imply official native integration inside every agent IDE
