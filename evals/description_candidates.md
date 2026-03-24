-# Trigger Description Candidates

用于给 `scripts/sweep_trigger_descriptions.sh` 提供批量候选 description。

## 格式规则

- 每个候选占一行，且必须匹配：`- \`id\`: description...`
- 可选显示名：`- \`id\` (Label): description...`
- 若想评测当前 `SKILL.md` 的 description，用：`@CURRENT`

## Candidates

- `baseline_current` (Current SKILL.md): @CURRENT
- `cn_real_page_focus`: 在微信开发者工具里按 route/query 打开小程序真实页面，截图、滚动、交互后再截图，并收集 console/异常，适合核对白屏或编译变化。
- `cn_scroll_interact`: 打开指定 route、往下滚到折叠内容、在抽屉或内层容器交互，再截几张图以覆盖首屏以下。
- `cn_console_capture`: Run doctor、list routes、打开页面并保存 console/exception 报文与 `report.json`，同时产出页面截图。
- `balanced_cn_en`: Real WeChat DevTools check: open route/query, scroll below the fold, tap or input, capture screenshots, and grab console/errors; not for generic web or desktop captures.
- `en_beta_search`: WeChat DevTools Beta loop for Mini Program visibility checks—route discovery, query launch, scroll/interact, screenshot, console; designed for search-friendly, cross-language prompts.
