# Artifact Directory Example

Below is a typical output from one run:

```text
<project>/output/wechat-devtools-automator/20260324-231544-scroll-shot-pages-store-index-36095/
├── report.json
├── page.png
├── page-top.png
├── page-y900.png
├── page-y1800.png
└── gui.png (optional)
```

## `report.json` example fields

```json
{
  "projectRoot": "/path/to/project",
  "route": "pages/store/index",
  "query": { "storeId": "s_1001" },
  "artifacts": [
    { "kind": "page", "path": "page.png" },
    { "kind": "page-scroll-0", "path": "page-top.png" },
    { "kind": "page-scroll-900", "path": "page-y900.png" },
    { "kind": "page-scroll-1800", "path": "page-y1800.png" },
    { "kind": "gui", "path": "gui.png" }
  ],
  "performedActions": [
    { "type": "tap", "selector": ".next-btn" },
    { "type": "input", "selector": "#search", "value": "奶茶" }
  ],
  "pageScreenshots": [
    { "path": "page-top.png", "scrollTop": 0 },
    { "path": "page-y900.png", "scrollTop": 900 },
    { "path": "page-y1800.png", "scrollTop": 1800 }
  ],
  "consoleEvents": [{ "level": "warn", "text": "price missing fallback", "time": 1711260000123 }],
  "exceptions": [],
  "startedAt": "2026-03-24T10:32:18.512Z",
  "finishedAt": "2026-03-24T10:32:26.941Z"
}
```

## Why this helps users

- Reviewers can inspect screenshots and execution facts in one place.
- Agents can consume `report.json` to auto-generate issue summaries.
- Teams can diff artifacts between runs to validate UI fixes quickly.
