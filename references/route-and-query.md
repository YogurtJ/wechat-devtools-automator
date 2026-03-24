# Route And Query Guide

Use this guide to avoid route ambiguity and parameter mistakes.

## Supported route input styles

- Full route: `pages/home/index`
- Full route with slash: `/pages/home/index`
- Route with query: `pages/detail/index?id=item_001`
- Alias (derived from `app.json`): `home`
- Subpackage alias (derived): `merchant/hub`

If alias resolution is ambiguous, the tool should print candidate routes and stop.

## Query parameters

Use repeated `--query` flags:

```bash
"$WDA" shot --project "$(pwd)" --route pages/detail/index --query id=item_001 --query source=feed
```

Equivalent inline route form:

```bash
"$WDA" shot --project "$(pwd)" --route "pages/detail/index?id=item_001&source=feed"
```

## Route discovery workflow

1. Run `routes` first and copy a real route from output.
2. Use alias only if unique.
3. Add query parameters explicitly.
4. Re-run `routes` if ambiguity appears after route changes.

## Generic best practices

- Do not hardcode project-specific route names in the skill docs.
- Keep examples to canonical patterns like `pages/home/index` and `pages/detail/index`.
- Always include `--project "$(pwd)"` in copy-paste examples.
