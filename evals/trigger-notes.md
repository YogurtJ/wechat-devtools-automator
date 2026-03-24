# Trigger Notes

本轮调优目标是让 trigger 文案更适合 beta 发布检索，保持简洁的域名优先表达，同时覆盖现实正例/边界/负例。

1. 主触发层（高置信）
   - 正例 prompt 短平快地描述微信开发者工具中的实际操作链：run `doctor`、列 `routes`、打开 route/带 query、滚动、抽屉交互、截图并抓 console/exception。
   - 号召 agents 直接交付 artifacts：`report.json`、模拟器页面图、console 报文，在一套流程里完成视觉+日志闭环。

2. 边界层（需要判别）
   - 加入英文/混合语、状态/症状复查类 prompt，强调“在 DevTools 里重新确认白屏/样式改动/按钮失效”的意图，以检验 skill 在模糊语义上的稳定性。

3. 负例层（防误触发）
   - 接入 Playwright、React 网页、仅读 `app.json`、Obsidian 插件、README 打包等非小程序视觉场景，保持 precision 。

新的 description candidate 也同步简化，便于 `scripts/sweep_trigger_descriptions.sh` 用短句匹配查询捕捉搜索友好的词序。
