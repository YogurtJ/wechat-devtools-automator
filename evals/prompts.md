## Prompt Bank

用于人工抽检 skill 触发质量。目标是覆盖真实开发者口语、近似边界语义与误触发场景。

## A. 高置信触发（中文口语）

- 先运行 `doctor`，再列出 `routes`，打开 `pages/order/index`，滚动截两张图。
- 按 `id=123&tab=detail` 打开页面，截图并把 console/异常一起抓下来。
- 在搜索框输入“拿铁”，等列表刷新后截图并确认 artifacts。
- 点开 coupon tab，截当前状态然后记录 console 输出。
- 把规格抽屉打开，滚动内部内容再截几张图。
- 从首页入口逐层点进目标页面再截一次，避免跳过中间状态。
- 往下滚三屏，交互后记录截图和 `report.json`。
- 展示未登录/无权限/空数据的页面状态，确认体验差异。
- 这个页面一直 loading、按钮无反应，复现状态并保存 console/exception 日志。
- 刚改了文案或样式，帮我在 DevTools 里确认变化并留 artifacts 证据。

## B. 英文与中英混输

- Run WeChat DevTools doctor, list routes, open a mini program frame, and capture below-the-fold screenshots.
- Open a Mini Program route with query params, tap a tab, and capture the updated view plus console.
- Scroll the mini app page inside DevTools and capture the inner scroll container.

## C. 状态与症状核验（在 DevTools 复查）

- 帮我看这个小程序页面是不是白屏，顺便截图和记录 console。
- 我想确认编译后有没有变化，打开页面、截图并保存 artifacts。
- 帮我复现 tab 切换失败的症状，截图并同步 console/exception。

## D. 近似误触发负例（应拒绝）

- Use Playwright to test my React website and capture a desktop screenshot.
- 只需要看 `app.json` 的 route 配置，不要打开开发者工具。
- 纯重构小程序购物车逻辑，不需要可视化验证。
- 调试浏览器网页的 console 报错，非小程序场景。
- 去排查 Obsidian 插件界面，不是微信 DevTools。
- 帮我写这个 skill 的 README 并打包发布。
