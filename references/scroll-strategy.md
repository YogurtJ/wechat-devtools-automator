# Scroll Strategy

Use this guide when one screenshot is not enough.

## Default behavior

- Default mode is `auto`.
- The tool first tries to detect a vertical inner scroll container (for example, `scroll-view`).
- If no suitable inner container is found, it falls back to page-level scroll.

## Recommended patterns

Below-the-fold capture with fixed steps:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-step 900 --scroll-captures 3
```

Precise capture points:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-y 0,700,1400,2100
```

Force page scroll:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-target page
```

Force known inner container:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-target inner --scroll-selector ".content-scroll"
```

Debug auto-detection decisions:

```bash
"$WDA" scroll-shot --project "$(pwd)" --route pages/feed/index --scroll-step 900 --scroll-captures 3 --scroll-debug
```

## Choosing the mode

- Use `auto` first in most projects.
- Use `page` when page-level sticky elements drive layout.
- Use `inner` when a known inner list is the real content viewport.
