# Store Copy

## Name

- `wechat-devtools-automator`
- WeChat DevTools Automator

## One-line pitch

- Let agents run WeChat DevTools CLI in minutes and deliver a single evidence folder with screenshots, console signals, and `report.json`.

## Short description

- Build, open, interact with, and capture any Mini Program route via CLI so you get screenshots, scroll shots, typed/clicked states, and console logs in one artifact tree.

## Marketplace description

`wechat-devtools-automator` is engineered to give agents true Mini Program eyesight: compile/customize the target route, run optional clicks and typing, crawl scroll containers, and snap the simulator while gathering console/error output.

After one CLI run you have a timestamped artifact folder with:
- the selected route, query payloads, and interaction steps
- sequential screenshots that capture top-to-bottom and inner scroll containers
- GUI-focused crops and raw DevTools logs in `report.json`

Sharing, auditing, or continuing work is as simple as shipping that folder.

## 5-minute success path

1. Run `doctor` to confirm DevTools + project setup.
2. Run `routes` to pick the target page.
3. Run `shot` or `scroll-shot` once.
4. Open the generated artifact folder and review `report.json`.

In one short loop, a new user can move from install to first usable evidence package.

## Artifact folder example

- Example structure: `assets/artifact-example.md`
- Typical output root: `<project>/output/wechat-devtools-automator/<run-id>/`

## Why `report.json` matters

- It is the machine-readable run summary for agents and CI.
- It records route/query/actions/log signals next to screenshot files.
- It lets reviewers answer “what exactly happened during capture?” without replaying manually.
- It makes bug reports and cross-person handoff auditable.

## Launch highlights

- Beta release validates CLI flow: compile, open, run route, scroll, click, capture, and record console in one automated chain.
- Auto-detects scrollable containers so inner lists and drawers are visible without extra prompts.
- Console/error collection and `report.json` generation make agent QA reviewable and CI-friendly.
- Generalized route/query naming means the same commands adapt to any Mini Program project.

## Why people may install it

- 希望把“截图 + 日志 + 结论”一次性交付给评审者
- 希望让 agent 产出可复用、可比对、可归档的证据包
- 希望首次接入时 5 分钟就看到真实收益

## Ideal users

- 用各种 agent 工具开发微信小程序并需要“可验证输出”的个人或团队
- 需要远程协作、异步评审、跨角色交接的项目
- 重构期想减少“我这边看起来没问题”沟通成本的团队

## Suggested keywords

- 微信小程序
- 微信开发者工具
- WeChat Mini Program
- WeChat DevTools CLI
- evidence-driven debugging
- screenshot evidence
- console logs
- report.json
- agent handoff

## GitHub metadata

### Repository description candidates
- `wechat-devtools-automator`: beta WeChat DevTools automation for agentic Mini Program evidence capture
- `wechat-devtools-automator`: CLI-driven Mini Program evidence capture (screenshots, scrolls, console, report.json)
- Give agents eyes inside WeChat DevTools: compile, interact, and capture a route in one artifact.
- WeChat Mini Program beta: route + interaction + scroll screenshots bundled with console proof.

### Suggested topics
- `wechat-miniprogram`
- `mini-program`
- `wechat-devtools`
- `ai-agents`
- `cli-tool`
- `evidence-automation`
- `agentic-development`
- `mini-program-qa`
- `visual-debugging`

### Beta posture wording
- `Public GitHub beta` is accurate while `package.json` remains `UNLICENSED`.
- Avoid `open-source`, `MIT`, `Apache`, or `community license` until a real `LICENSE` file exists.

## Example prompts

- 帮我用 5 分钟路径跑一遍，给我 artifacts 和 `report.json`
- 打开这个 route，点一次“下一步”，滚三屏并输出证据包
- 这个页面要带 query，跑完后告诉我是否有 console/error 信号
- Open this Mini Program route and return a shareable evidence folder with `report.json`

## Positioning note

If Playwright gives agents “eyes” for the web, `wechat-devtools-automator` aims to do the same for 微信小程序 inside WeChat DevTools.
