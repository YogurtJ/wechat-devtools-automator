# WeChat DevTools Automator

English README: [`README.md`](README.md)

这是一个面向微信小程序真实页面验证的 WeChat DevTools 自动化仓库。

当前状态：GitHub 公开 beta，可用于评估、试用和真实项目联调。

`wechat-devtools-automator` 的核心价值，是让 agent 真正“看见”微信开发者工具里的页面：先做环境检查，再列 route，按 route + query 打开页面，执行点击/输入/滚动，然后把截图和 console / exception 一起收进证据目录。

## 当前姿态

- 分发姿态：公开 GitHub beta
- 许可姿态：仍然是 `UNLICENSED`
- 信任锚点：真实 smoke 记录、可重跑命令、`.skill` 包、`report.json`、发布清单

在更大范围传播前，建议同时阅读 `LICENSE-NOTICE.md`、`references/install-and-share.md`、`assets/release-checklist.md`、`references/github-metadata.md`。

## 一次运行能得到什么

- `<project>/output/wechat-devtools-automator/<run-id>/` 这样的证据目录
- 页面截图，以及可选的 GUI 裁剪图
- 记录 route / query / action / console / exception 的 `report.json`
- 可复跑、可审计、可交接的命令链路

## 为什么需要它

微信小程序前端开发最难的一点，常常不是“写代码”，而是“看得到”。普通网页可以用 Playwright 驱动浏览器，但小程序的真实渲染通常要经过微信开发者工具。如果 agent 看不到真实页面，很多前端判断都会退化成猜测。

这个仓库把这件事变成一套稳定工作流：

- `doctor`：检查环境
- `routes`：列出可用页面
- `shot` / `scroll-shot` / `gui-shot`：抓真实页面
- `--tap` / `--longpress` / `--input` / `--trigger` / `--action`：进入交互后的目标状态
- `report.json`：把 console / 异常和截图放到一起

## 不只适用于 Codex

当前打包出来的 `.skill` 主要面向 Codex，但仓库的核心其实是 shell wrapper 加 Node 脚本。

也就是说，只要你的 agent 工具能执行本地 shell 命令，这套工作流同样可以用于：

- Codex
- Claude Code
- Cursor
- OpenCode
- OpenClaw
- 以及其他支持本地命令调用的 agent 工具

通用入口就是：

```bash
scripts/wechat_devtools_automator.sh
```

## 安装方式

### 方式 A：作为通用本地工具使用

```bash
git clone https://github.com/YogurtJ/wechat-devtools-automator.git
cd wechat-devtools-automator
export WDA="$(pwd)/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project /path/to/mini-program-project
"$WDA" routes --project /path/to/mini-program-project
```

### 方式 B：作为 Codex skill 安装

```bash
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
mkdir -p "$CODEX_HOME/skills"
git clone https://github.com/YogurtJ/wechat-devtools-automator.git \
  "$CODEX_HOME/skills/wechat-devtools-automator"
export WDA="$CODEX_HOME/skills/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"
"$WDA" doctor --project "$(pwd)"
"$WDA" routes --project "$(pwd)"
```

如果你更想直接分发 `.skill` 包，可以看 `references/install-and-share.md`。

## 快速开始

```bash
export WDA="/path/to/wechat-devtools-automator/scripts/wechat_devtools_automator.sh"

"$WDA" doctor --project "$(pwd)"
"$WDA" routes --project "$(pwd)"
"$WDA" shot --project "$(pwd)" --route "<从 routes 输出里复制一个真实 route>"
```

默认产物目录：

```text
<project>/output/wechat-devtools-automator/<run-id>/
```

拿到一个真实 route 后，可以继续：

```bash
"$WDA" shot --project "$(pwd)" --route "<real-route>" --query id=item_001
"$WDA" shot --project "$(pwd)" --route "<real-route>" --tap "<selector>"
"$WDA" shot --project "$(pwd)" --route "<real-route>" --input "<selector>::奶茶"
"$WDA" scroll-shot --project "$(pwd)" --route "<real-route>" --scroll-step 900 --scroll-captures 3
"$WDA" gui-shot --project "$(pwd)" --route "<real-route>"
```

更稳妥的首次接入路径见 `references/quickstart.md`。

## 适合什么场景

- 微信小程序页面的真实 UI 验证
- 改了 route / query 后的视觉确认
- 只有点击、输入之后才会出现的页面状态
- 首屏以下、内层滚动容器的检查
- 给 agent 评审、Bug 交接、异步协作提供截图 + 日志证据包

## 不适合什么场景

- 普通网页 / 浏览器自动化
- 与微信开发者工具无关的桌面级截图
- 不需要真实渲染验证的纯代码重构
- 宣称自己已经“原生集成”所有 agent IDE；在 Codex 之外，当前支持路径是直接调用 wrapper / scripts

## 当前限制

- 依赖微信开发者工具的 GUI / 会话状态，同机并行跑可能互相影响
- 视觉结果会受到系统字体、缩放、OS、mock / API 数据影响
- `gui-shot` 目前更偏 macOS；更通用的仍是 page / simulator 截图
- 如果项目本身 `build-npm` 失败，需要先修项目依赖

## 兼容性

| 平台 | Node | 微信开发者工具 | 已验证 |
| --- | --- | --- | --- |
| macOS 15.5 | Node v24.13.1 | 2.01.2510280 | `doctor` + `routes` + `shot` + `scroll-shot` 于 2026-03-24 验证 |

新增验证组合请继续记录到 `assets/release-checklist.md`。

## 分享建议

- 首次介绍时，建议同时给出 `README.md`、`README.zh-CN.md`、`references/quickstart.md`
- 做 release QA 时，配上 `assets/release-checklist.md` 和 trigger QA 摘要
- 做问题交接时，优先共享整个截图目录和 `report.json`
- 如果用 GitHub 作为 landing page，记得同步设置 About / topics，可参考 `references/github-metadata.md`

## 相关文档

- English README：`README.md`
- 安装与分享：`references/install-and-share.md`
- Trigger / Eval：`references/eval.md`
- GitHub 元数据建议：`references/github-metadata.md`
